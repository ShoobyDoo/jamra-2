import type { AppContext } from "../../app/context.js";
import { enableExtensionDevWatcher } from "./bootstrap/dev-watcher.js";
import { registerLocalExtensions } from "./bootstrap/local-registry.js";
import { createExtensionLoader } from "./loader/extension-loader.js";
import { createExtensionRuntime } from "./runtime/extension-runtime.js";
import { createExtensionRegistry } from "./registry/registry.service.js";
import type {
  ExtensionLoader,
  ExtensionRegistry,
  ExtensionRuntime,
} from "./extensions.types.js";

export interface ExtensionsModule {
  registry: ExtensionRegistry;
  loader: ExtensionLoader;
  runtime: ExtensionRuntime;
}

const moduleCache = new WeakMap<AppContext, ExtensionsModule>();

export const getExtensionsModule = (
  context: AppContext,
): ExtensionsModule => {
  const cached = moduleCache.get(context);
  if (cached) {
    return cached;
  }

  const registry = createExtensionRegistry(context.db);
  const loader = createExtensionLoader({
    target: context.config.env === "development" ? "node20" : "node18",
  });
  const runtime = createExtensionRuntime(loader, {
    env: context.config.env,
    defaultTimeoutMs: context.config.extensions.runtime.timeoutMs,
    httpClient: context.httpClient,
    logger: context.logger,
    allowNetworkHosts: context.config.sandbox.allowNetworkHosts,
  });

  const module: ExtensionsModule = {
    registry,
    loader,
    runtime,
  };

  moduleCache.set(context, module);

  registerLocalExtensions(context, registry, loader).catch((error) => {
    context.logger.error("Failed to bootstrap local extensions", { error });
  });

  enableExtensionDevWatcher({
    context,
    registry,
    runtime,
    loader,
  });

  return module;
};

