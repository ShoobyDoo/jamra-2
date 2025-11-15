import path from "node:path";
import { build } from "esbuild";
import type {
  ExtensionLoader,
  ExtensionRecord,
  LoadedExtensionSource,
} from "../extensions.types.js";
import { ValidationError } from "../../../shared/errors.js";

interface LoaderOptions {
  target?: string;
}

const SUPPORTED_EXTENSIONS = new Set([
  ".js",
  ".cjs",
  ".mjs",
  ".ts",
  ".tsx",
  ".jsx",
]);

export class DefaultExtensionLoader implements ExtensionLoader {
  private readonly cache = new Map<string, LoadedExtensionSource>();

  constructor(private readonly options: LoaderOptions = {}) {}

  async loadSource(record: ExtensionRecord): Promise<LoadedExtensionSource> {
    const cached = this.cache.get(record.id);
    if (cached) {
      return cached;
    }

    const entryPath = path.resolve(
      record.installPath,
      record.manifest.entry,
    );

    const ext = path.extname(entryPath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      throw new ValidationError(
        `Unsupported extension entry file type: ${ext}`,
      );
    }

    const buildResult = await build({
      entryPoints: [entryPath],
      bundle: true,
      platform: "node",
      format: "cjs",
      target: this.options.target ?? "node18",
      sourcemap: "inline",
      write: false,
      define: {
        "process.env.NODE_ENV":
          JSON.stringify(process.env.NODE_ENV ?? "development"),
      },
      logLevel: "silent",
      external: [],
      metafile: false,
    });

    const outputFile = buildResult.outputFiles?.[0];
    if (!outputFile) {
      throw new ValidationError("Failed to compile extension source");
    }
    const source: LoadedExtensionSource = {
      code: outputFile.text,
      entryPath,
      sourceMap: undefined,
    };

    this.cache.set(record.id, source);
    return source;
  }

  async unload(record: ExtensionRecord): Promise<void> {
    this.cache.delete(record.id);
  }
}

export const createExtensionLoader = (
  options?: LoaderOptions,
): ExtensionLoader => {
  return new DefaultExtensionLoader(options);
};
