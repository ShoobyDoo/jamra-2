import chokidar from "chokidar";
import path from "node:path";
import type { AppContext } from "../../../app/context.js";
import type {
  ExtensionLoader,
  ExtensionRegistry,
  ExtensionRuntime,
} from "../extensions.types.js";
import { registerLocalExtensions } from "./local-registry.js";

interface WatcherOptions {
  context: AppContext;
  registry: ExtensionRegistry;
  runtime: ExtensionRuntime;
  loader: ExtensionLoader;
}

export const enableExtensionDevWatcher = ({
  context,
  registry,
  runtime,
  loader,
}: WatcherOptions): void => {
  if (context.config.env !== "development") {
    return;
  }

  const installDir = path.resolve(
    process.cwd(),
    context.config.extensions.installDir,
  );
  const pendingReloads = new Set<string>();

  const watcher = chokidar.watch(installDir, {
    persistent: true,
    ignoreInitial: true,
    ignorePermissionErrors: true,
    awaitWriteFinish: {
      stabilityThreshold: 250,
      pollInterval: 50,
    },
    ignored: [
      /(^|[/\\])\./,
      /[/\\]dist([/\\]|$)/,
      /[/\\]out([/\\]|$)/,
      /[/\\]node_modules([/\\]|$)/,
    ],
  });

  const resolveExtensionId = (filePath: string): string | null => {
    const relative = path.relative(installDir, filePath);
    if (!relative || relative.startsWith("..")) {
      return null;
    }
    const [extensionId] = relative.split(path.sep);
    return extensionId || null;
  };

  const reloadExtension = (extensionId: string, changedPath: string): void => {
    if (pendingReloads.has(extensionId)) {
      return;
    }
    pendingReloads.add(extensionId);

    void (async () => {
      try {
        if (changedPath.endsWith("manifest.json")) {
          await registerLocalExtensions(context, registry, loader);
        }

        const record = await registry.findById(extensionId);
        if (!record) {
          context.logger.warn("Extension change detected but no record found", {
            extensionId,
            changedPath,
          });
          return;
        }

        await runtime.dispose(record);
        context.logger.info("Disposed extension after source change", {
          extensionId,
          changedPath,
        });
      } catch (error) {
        context.logger.warn("Failed to hot reload extension", {
          extensionId,
          changedPath,
          error,
        });
      } finally {
        pendingReloads.delete(extensionId);
      }
    })();
  };

  watcher.on("all", (event, filePath) => {
    const extensionId = resolveExtensionId(filePath);
    if (!extensionId) {
      return;
    }
    reloadExtension(extensionId, filePath);
  });

  watcher.on("error", (error) => {
    context.logger.warn("Extension watcher error", { error });
  });

  context.logger.info("Watching extension sources for live reload", {
    installDir,
  });
};
