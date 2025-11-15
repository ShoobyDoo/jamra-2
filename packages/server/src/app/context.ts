import type Database from "better-sqlite3";
import type { AppConfig } from "../core/config/app-config.js";
import type { HttpClient } from "../shared/http/http-client.js";
import type { Logger } from "../shared/logger.js";

export interface AppContext {
  config: AppConfig;
  db: Database.Database;
  httpClient: HttpClient;
  logger: Logger;
}

export interface ModuleRegistration {
  basePath: string;
  register: (context: AppContext) => import("express").Router;
}
