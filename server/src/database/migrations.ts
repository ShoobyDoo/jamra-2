import { readFileSync } from 'fs';
import path from 'path';
import type Database from 'better-sqlite3';

export const runMigrations = (db: Database.Database): void => {
  // TODO: Implement migration system
  // For now, just run the schema file
  try {
    // In production (Electron packaged app), schema.sql is in extraResources
    // In development, it's in the server/src/database directory
    let schemaPath: string;

    if (process.env.ELECTRON_PACKAGED === 'true' && process.env.RESOURCES_PATH) {
      // Production: schema.sql is in the resources directory
      schemaPath = path.join(process.env.RESOURCES_PATH, 'schema.sql');
    } else {
      // Development: schema.sql is in the server/src/database directory
      schemaPath = path.join(process.cwd(), 'server', 'src', 'database', 'schema.sql');
    }

    console.log('Loading schema from:', schemaPath);
    const schema = readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};
