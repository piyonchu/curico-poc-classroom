/* eslint-disable no-console */
import { readFileSync } from "fs";
import { join } from "path";
import { activity } from "../data/activity";
import { pool, resetReadyCache } from "../lib/db";
import { embed, EMBED_DIM } from "../lib/embed";

// Split a markdown document into semantically meaningful chunks:
// - one chunk per ## or ### section
// - within a section, further split if the section is longer than ~180 words
function chunkMarkdown(md: string): { heading: string; text: string }[] {
  const lines = md.split("\n");
  const sections: { heading: string; body: string[] }[] = [];
  let current: { heading: string; body: string[] } = { heading: "Intro", body: [] };
  for (const ln of lines) {
    const m = ln.match(/^(#{1,3})\s+(.+?)\s*$/);
    if (m) {
      if (current.body.length || current.heading !== "Intro") sections.push(current);
      current = { heading: m[2], body: [] };
    } else {
      current.body.push(ln);
    }
  }
  if (current.body.length) sections.push(current);

  const chunks: { heading: string; text: string }[] = [];
  for (const s of sections) {
    const text = s.body.join("\n").trim();
    if (!text) continue;
    const words = text.split(/\s+/);
    if (words.length <= 220) {
      chunks.push({ heading: s.heading, text });
    } else {
      // Split into ~180-word windows on paragraph boundaries.
      const paragraphs = text.split(/\n\s*\n/);
      let buf: string[] = [];
      let count = 0;
      for (const p of paragraphs) {
        const w = p.split(/\s+/).length;
        if (count + w > 220 && buf.length) {
          chunks.push({ heading: s.heading, text: buf.join("\n\n") });
          buf = [p];
          count = w;
        } else {
          buf.push(p);
          count += w;
        }
      }
      if (buf.length) chunks.push({ heading: s.heading, text: buf.join("\n\n") });
    }
  }
  return chunks;
}

async function main() {
  const p = pool();
  console.log("connecting to postgres…");
  await p.query("select 1");

  console.log("ensuring extension + tables…");
  await p.query("create extension if not exists vector");
  await p.query(`
    create table if not exists activity_chunks (
      id serial primary key,
      activity_id text not null,
      chunk_id text not null,
      source text not null default 'structured',
      heading text,
      text text not null,
      embedding vector(${EMBED_DIM}) not null,
      unique (activity_id, chunk_id)
    )
  `);
  // Best-effort add-column for older seeded DBs.
  await p.query(
    `alter table activity_chunks add column if not exists source text not null default 'structured'`,
  );
  await p.query(
    `alter table activity_chunks add column if not exists heading text`,
  );
  await p.query(`
    create index if not exists activity_chunks_embed_idx
      on activity_chunks
      using ivfflat (embedding vector_cosine_ops)
      with (lists = 10)
  `);

  console.log(`clearing existing chunks for ${activity.id}…`);
  await p.query("delete from activity_chunks where activity_id = $1", [activity.id]);

  // Structured chunks defined in data/activity.ts
  const structured = activity.chunks.map((c) => ({
    id: c.id,
    source: "structured" as const,
    heading: null as string | null,
    text: c.text,
  }));

  // Long-form teacher's guide chunked from data/activity_guide.md
  const guideMd = readFileSync(join(__dirname, "..", "data", "activity_guide.md"), "utf8");
  const guideChunks = chunkMarkdown(guideMd).map((c, i) => ({
    id: `guide_${String(i + 1).padStart(2, "0")}`,
    source: "guide" as const,
    heading: c.heading,
    text: `[${c.heading}]\n${c.text}`,
  }));

  const all = [...structured, ...guideChunks];
  console.log(
    `embedding + inserting ${all.length} chunks (${structured.length} structured, ${guideChunks.length} from guide)…`,
  );
  console.log(`  (first embed downloads the model, ~23 MB — this can take a minute)`);

  let i = 0;
  for (const c of all) {
    const v = await embed(c.text);
    const lit = `[${v.join(",")}]`;
    await p.query(
      `insert into activity_chunks (activity_id, chunk_id, source, heading, text, embedding)
       values ($1, $2, $3, $4, $5, $6::vector)`,
      [activity.id, c.id, c.source, c.heading, c.text, lit],
    );
    i++;
    process.stdout.write(`  ${i}/${all.length} (${c.id})\r`);
  }
  console.log("\ndone.");

  resetReadyCache();
  await p.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
