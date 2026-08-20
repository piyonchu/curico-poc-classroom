// Local sentence embeddings via @xenova/transformers. No API key needed.
// Model: Xenova/all-MiniLM-L6-v2 (384 dims). ~23 MB, downloaded once and
// cached in ~/.cache/huggingface (or the project's node_modules cache).

let pipe: any = null;

export async function getEmbedder() {
  if (pipe) return pipe;
  const { pipeline, env } = await import("@xenova/transformers");
  // Allow model download at runtime; cache locally.
  env.allowLocalModels = false;
  env.useBrowserCache = false;
  pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  return pipe;
}

export async function embed(text: string): Promise<number[]> {
  const p = await getEmbedder();
  const out = await p(text, { pooling: "mean", normalize: true });
  return Array.from(out.data as Float32Array);
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (const t of texts) out.push(await embed(t));
  return out;
}

export const EMBED_DIM = 384;
