import { nanoid } from "nanoid";
import type { Database } from "better-sqlite3";
import type { Logger } from "../../shared/logger.js";
import { DomainError } from "../../shared/errors.js";
import type { FileExtensionPackager } from "./packager.js";
import type { GitRepositoryFetcher } from "./fetchers/git-fetcher.js";
import type { ExtensionSourceFetcher } from "./fetchers/source-fetcher.js";
import type { ExtensionCompiler } from "./compiler/extension-compiler.js";
import type { ExtensionMetadata } from "./types/repository-schema.types.js";
import type { ExtensionLoader } from "../extensions/extensions.types.js";

/**
 * Installation status types
 */
type InstallStatus =
  | "pending"
  | "downloading"
  | "compiling"
  | "installing"
  | "completed"
  | "failed";

/**
 * Service for managing extension installations
 */
export class InstallerService {
  constructor(
    private readonly db: Database,
    private readonly packager: FileExtensionPackager,
    private readonly gitFetcher: GitRepositoryFetcher,
    private readonly sourceFetcher: ExtensionSourceFetcher,
    private readonly compiler: ExtensionCompiler,
    private readonly loader: ExtensionLoader,
    private readonly logger: Logger,
  ) {}

  /**
   * Queue extension installations from a Git repository
   * @param gitUrl - Git repository URL
   * @param extensionIds - Optional array of specific extension IDs to install
   * @param branch - Git branch (default: "main")
   * @returns Array of job IDs
   */
  async queueInstall(
    gitUrl: string,
    extensionIds?: string[],
    branch: string = "main",
  ): Promise<string[]> {
    this.logger.info(`Queuing installation from repository: ${gitUrl}`);

    // 1. Fetch repository index
    const repoIndex = await this.gitFetcher.fetchRepositoryIndex(gitUrl, branch);

    // 2. Filter extensions if specific IDs provided
    const extensionsToInstall = extensionIds
      ? repoIndex.extensions.filter((e) => extensionIds.includes(e.id))
      : repoIndex.extensions;

    if (extensionsToInstall.length === 0) {
      throw new DomainError(
        extensionIds
          ? `No extensions found matching IDs: ${extensionIds.join(", ")}`
          : "No extensions found in repository",
      );
    }

    // 3. Insert into extension_installs table
    const jobIds: string[] = [];
    const stmt = this.db.prepare(`
      INSERT INTO extension_installs
      (id, extension_id, status, repo_url, extension_metadata, requested_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const ext of extensionsToInstall) {
      const jobId = nanoid();
      stmt.run(
        jobId,
        ext.id,
        "pending",
        gitUrl,
        JSON.stringify(ext),
        Date.now(),
      );
      jobIds.push(jobId);
      this.logger.info(`Queued installation job ${jobId} for extension: ${ext.id}`);
    }

    // 4. Start processing queue (don't await)
    this.processQueue().catch((error) => {
      this.logger.error("Error processing installation queue:", error);
    });

    return jobIds;
  }

  /**
   * Process pending installation jobs
   */
  async processQueue(): Promise<void> {
    this.logger.info("Processing installation queue...");

    // 1. Query pending installs
    const stmt = this.db.prepare(`
      SELECT * FROM extension_installs
      WHERE status = 'pending'
      ORDER BY requested_at ASC
    `);
    const pending = stmt.all() as any[];

    if (pending.length === 0) {
      this.logger.info("No pending installations");
      return;
    }

    this.logger.info(`Found ${pending.length} pending installation(s)`);

    // 2. Process each install sequentially
    for (const install of pending) {
      try {
        await this.processInstall(install);
      } catch (error) {
        this.logger.error(
          `Installation failed for job ${install.id}:`,
          error as Record<string, unknown>,
        );
        // Continue with next installation
      }
    }

    this.logger.info("Queue processing complete");
  }

  /**
   * Process a single installation job
   */
  private async processInstall(install: any): Promise<void> {
    const { id: jobId, extension_id, extension_metadata } = install;

    this.logger.info(`Processing installation job ${jobId} for extension: ${extension_id}`);

    try {
      // Parse extension metadata
      const metadata: ExtensionMetadata = JSON.parse(extension_metadata);

      // Update status: downloading
      this.updateInstallStatus(jobId, "downloading");
      this.logger.info(`[${jobId}] Downloading extension source...`);

      // Fetch source code
      const sourceFiles = await this.sourceFetcher.fetchExtensionSource(metadata);
      this.logger.info(`[${jobId}] Downloaded ${sourceFiles.size} file(s)`);

      // Determine if compilation is needed
      let compiledCode: string;

      if (metadata.language === "typescript") {
        // Update status: compiling
        this.updateInstallStatus(jobId, "compiling");
        this.logger.info(`[${jobId}] Compiling TypeScript...`);

        // Compile TypeScript
        const result = await this.compiler.compileFromFiles(
          sourceFiles,
          metadata.entrypoint,
          metadata.id,
        );

        if (!result.success) {
          throw new DomainError(
            `Compilation failed: ${result.errors.join(", ")}`,
          );
        }

        if (result.warnings.length > 0) {
          this.logger.warn(
            `[${jobId}] Compilation warnings: ${result.warnings.join(", ")}`,
          );
        }

        compiledCode = result.outputCode!;
        this.logger.info(`[${jobId}] Compilation successful`);
      } else {
        // JavaScript - use source directly
        const entrypointCode = sourceFiles.get(metadata.entrypoint);
        if (!entrypointCode) {
          throw new DomainError(
            `Entrypoint not found: ${metadata.entrypoint}`,
          );
        }
        compiledCode = entrypointCode;
        this.logger.info(`[${jobId}] Using JavaScript source directly`);
      }

      // Update status: installing
      this.updateInstallStatus(jobId, "installing");
      this.logger.info(`[${jobId}] Installing extension...`);

      // Install to disk and register in database
      const installPath = await this.packager.installExtension(
        compiledCode,
        metadata,
      );
      this.logger.info(`[${jobId}] Installed to: ${installPath}`);

      // Verify extension loads
      this.logger.info(`[${jobId}] Verifying extension...`);
      await this.verifyExtension(metadata.id);
      this.logger.info(`[${jobId}] Verification successful`);

      // Update status: completed
      this.updateInstallStatus(jobId, "completed");
      this.logger.info(`[${jobId}] Installation completed successfully`);
    } catch (error) {
      // Update status: failed
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.updateInstallStatus(jobId, "failed", errorMessage);
      this.logger.error(`[${jobId}] Installation failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Update installation status in database
   */
  private updateInstallStatus(
    jobId: string,
    status: InstallStatus,
    error?: string,
  ): void {
    const stmt = this.db.prepare(`
      UPDATE extension_installs
      SET status = ?, completed_at = ?, error = ?
      WHERE id = ?
    `);

    stmt.run(
      status,
      status === "completed" || status === "failed" ? Date.now() : null,
      error ?? null,
      jobId,
    );
  }

  /**
   * Verify that extension loads correctly
   */
  private async verifyExtension(extensionId: string): Promise<void> {
    try {
      // Get extension record from database
      const stmt = this.db.prepare(`
        SELECT * FROM extensions WHERE id = ?
      `);
      const record = stmt.get(extensionId) as any;

      if (!record) {
        throw new DomainError(`Extension not found in database: ${extensionId}`);
      }

      // Parse manifest
      const manifest = JSON.parse(record.manifest_json);

      // Create extension record
      const extensionRecord = {
        id: record.id,
        slug: record.slug,
        name: record.name,
        version: record.version,
        repoSource: record.repo_source,
        installedAt: new Date(record.installed_at),
        enabled: record.enabled === 1,
        installPath: record.install_path,
        checksum: record.checksum,
        manifest,
      };

      // Load extension source
      await this.loader.loadSource(extensionRecord);

      this.logger.info(`Extension ${extensionId} verified successfully`);
    } catch (error) {
      this.logger.error(`Extension verification failed:`, error as Record<string, unknown>);
      throw new DomainError(
        `Extension verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get installation status by job ID
   */
  getInstallStatus(jobId: string): any {
    const stmt = this.db.prepare(`
      SELECT * FROM extension_installs WHERE id = ?
    `);
    return stmt.get(jobId);
  }
}

export interface InstallerServiceArgs {
  db: Database;
  packager: FileExtensionPackager;
  gitFetcher: GitRepositoryFetcher;
  sourceFetcher: ExtensionSourceFetcher;
  compiler: ExtensionCompiler;
  loader: ExtensionLoader;
  logger: Logger;
}

export const createInstallerService = (
  args: InstallerServiceArgs,
): InstallerService => {
  return new InstallerService(
    args.db,
    args.packager,
    args.gitFetcher,
    args.sourceFetcher,
    args.compiler,
    args.loader,
    args.logger,
  );
};
