import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import path from "path";

let db: Database.Database | null = null;

export const getDatabase = (): Database.Database => {
  if (!db) {
    // Use DB_PATH from environment (set by Electron) or fallback to ./data for development
    const dataDir = process.env.DB_PATH || path.join(process.cwd(), "data");

    // Ensure data directory exists
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
      console.log("Created data directory:", dataDir);
    }

    // Create database
    const dbPath = path.join(dataDir, "manga.db");
    db = new Database(dbPath);

    // Enable foreign keys
    db.pragma("foreign_keys = ON");

    console.log("Database connected:", dbPath);
  }
  return db;
};

export const closeDatabase = (): void => {
  if (db) {
    db.close();
    db = null;
    console.log("Database connection closed");
  }
};
