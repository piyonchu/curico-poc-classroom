import { getActivity } from "@/data/activities";
import { pool, pgReady } from "@/lib/db";
import { embed } from "@/lib/embed";

export type Retrieved = { id: string; text: string; score: number };

// ---- Fallback: keyword overlap (used when pgvector is not available) ----
const STOP = new Set([
  "the","a","an","of","and","or","to","is","are","was","were","in","on","at",
  "it","this","that","for","with","as","by","be","i","you","we","my","your",
  "what","why","how","do","does","did","can","could","should","would","if",
  "so","but","not","no","yes","me","us","them","they","he","she","one","two",
]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t) && t.length > 1);
}

function keywordRetrieve(
  query: string,
  stepId: string,
  k: number,
  activityId: string,
): Retrieved[] {
  const activity = getActivity(activityId);
  const step = activity.steps.find((s) => s.id === stepId);
  const qTokens = new Set([
    ...tokens(query),
    ...(step ? tokens(step.title + " " + step.instructions) : []),
  ]);
  const scored = activity.chunks.map((c) => {
    const cTokens = tokens(c.text);
    let overlap = 0;
    for (const t of cTokens) if (qTokens.has(t)) overlap++;
    const stepNumMatch = stepId.match(/\d+/);
    if (stepNumMatch && c.text.includes(`Step ${stepNumMatch[0]}`)) overlap += 2;
    return { id: c.id, text: c.text, score: overlap };
  });
  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// ---- Real path: pgvector cosine similarity ----
async function vectorRetrieve(
  query: string,
  stepId: string,
  k: number,
  activityId: string,
): Promise<Retrieved[]> {
  const activity = getActivity(activityId);
  const step = activity.steps.find((s) => s.id === stepId);
  // Enrich the query with the current step's title/instructions so retrieval
  // stays on-step even for terse student questions ("wait what?").
  const enriched = step
    ? `${step.title}. ${step.instructions}. ${query}`
    : query;
  const qvec = await embed(enriched);
  const vecLit = `[${qvec.join(",")}]`;
  const r = await pool().query<{ chunk_id: string; text: string; sim: number }>(
    `select chunk_id, text, 1 - (embedding <=> $1::vector) as sim
       from activity_chunks
      where activity_id = $2
      order by embedding <=> $1::vector asc
      limit $3`,
    [vecLit, activity.id, k],
  );
  return r.rows.map((row) => ({
    id: row.chunk_id,
    text: row.text,
    score: row.sim,
  }));
}

export async function retrieve(
  query: string,
  stepId: string,
  k = 4,
  activityId?: string,
): Promise<{ hits: Retrieved[]; backend: "pgvector" | "keyword" }> {
  const activity = getActivity(activityId);
  if (await pgReady()) {
    try {
      const hits = await vectorRetrieve(query, stepId, k, activity.id);
      if (hits.length) return { hits, backend: "pgvector" };
    } catch (e) {
      console.warn("pgvector retrieve failed, falling back:", e);
    }
  }
  return { hits: keywordRetrieve(query, stepId, k, activity.id), backend: "keyword" };
}
