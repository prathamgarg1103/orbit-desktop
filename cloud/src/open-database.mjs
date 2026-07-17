import { DiyaDatabase } from "./database.mjs";
import { SupabaseDatabase } from "./supabase-database.mjs";

export async function openDiyaDatabase(config) {
  if (!config.databaseUrl) return new DiyaDatabase(config.databasePath);
  const database = new SupabaseDatabase(config.databaseUrl);
  await database.healthCheck();
  return database;
}
