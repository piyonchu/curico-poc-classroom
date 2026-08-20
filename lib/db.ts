import { Pool } from "pg";

const g = globalThis as unknown as { __curicoPool?: Pool };

export function pool(): Pool {
  if (!g.__curicoPool) {
    g.__curicoPool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        "postgres://curico:curico@localhost:5433/curico",
      max: 5,
    });
  }
  return g.__curicoPool;
}

let _ready: Promise<boolean> | null = null;
export async function pgReady(): Promise<boolean> {
  if (!_ready) {
    _ready = (async () => {
      try {
        const p = pool();
        await p.query("select 1");
        const r = await p.query(
          "select count(*)::int as n from pg_tables where tablename = 'activity_chunks'",
        );
        return r.rows[0].n > 0;
      } catch {
        return false;
      }
    })();
  }
  return _ready;
}

// Force re-check (used by seed script after creating tables)
export function resetReadyCache() {
  _ready = null;
}
