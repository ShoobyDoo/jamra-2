import type { AppContext } from "../../app/context.js";
import { getExtensionsModule } from "../extensions/extensions.module.js";
import { createExtensionPackager } from "./packager.js";
import { createInstallerService } from "./installer.service.js";
import { createGitRepositoryFetcher } from "./fetchers/git-fetcher.js";
import { createExtensionSourceFetcher } from "./fetchers/source-fetcher.js";
import { createExtensionCompiler } from "./compiler/extension-compiler.js";

const buildModule = (context: AppContext) => {
  const { loader } = getExtensionsModule(context);

  const packager = createExtensionPackager(
    context.db,
    context.config.extensions.installDir,
  );
  const gitFetcher = createGitRepositoryFetcher(context.httpClient);
  const sourceFetcher = createExtensionSourceFetcher(context.httpClient);
  const compiler = createExtensionCompiler();

  const service = createInstallerService({
    db: context.db,
    packager,
    gitFetcher,
    sourceFetcher,
    compiler,
    loader,
    logger: context.logger,
  });

  return { service };
};

const moduleCache = new WeakMap<AppContext, ReturnType<typeof buildModule>>();

export const getInstallerModule = (context: AppContext) => {
  const cached = moduleCache.get(context);
  if (cached) {
    return cached;
  }
  const module = buildModule(context);
  moduleCache.set(context, module);
  return module;
};
