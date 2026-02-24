import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const connString = process.env.DATABASE_URL;
if (!connString) {
  throw new Error("DATABASE_URL is required. Set it in your environment.");
}
export const pool = new pg.Pool({ connectionString: connString });
export const db = drizzle(pool, { schema });
