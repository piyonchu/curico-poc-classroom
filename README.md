# Curico Classroom — PoC

Proof-of-concept for the Curico Classroom capstone. Focuses on the two components the client asked to demo: the **student hands-on interface** and the **Socratic AI assistant** (RAG-grounded, flags misconceptions to the teacher).

The demo activity is a **college general-chemistry titration lab** — vinegar titrated against ~0.100 M NaOH with phenolphthalein — with 18 steps, embedded concept lessons, three trials, and full analysis (adapted from the LibreTexts Chem 10 canonical procedure).

---

## Prerequisites

- **Node.js 18.17+** (Node 20 recommended). `node -v`
- **npm** (bundled with Node). `npm -v`
- **Docker Desktop** (for the Postgres + pgvector container). `docker --version` and `docker compose version`
- Network access on first run — the seed script downloads a ~23 MB local embedding model.
- A modern browser. Camera capture and voice input work in Chrome/Edge; Safari won't do `SpeechRecognition`.
- Optional but recommended: an **OpenRouter API key** for the LLM chat. Without one, the app boots and uses a deterministic stub reply so the UI is still clickable.

---

## One-time setup

```bash
# 1. install JS dependencies
npm install

# 2. start the pgvector Postgres (Docker) — listens on host port 5433
npm run db:up

# 3. seed the RAG store:
#    - creates the extension + activity_chunks table + ivfflat index
#    - embeds 23 structured chunks + ~24 chunks from the teacher's guide
#    - inserts them; ~47 rows total
#    - first run downloads Xenova/all-MiniLM-L6-v2 (~23 MB) into node_modules cache
npm run seed
```

Verify the DB has the chunks:

```bash
docker exec curico-poc-classroom-db-1 \
  psql -U curico -d curico -c "select count(*) from activity_chunks;"
# expect: 47
```

### Environment configuration

Create (or edit) `.env.local` at the repo root:

```
# LLM (OpenRouter). Free-tier slugs work; some are upstream-rate-limited.
OPENROUTER_API_KEY=sk-or-v1-...
CURICO_MODEL=dots-studio/dots-3-note-preview:free

# Optional. Defaults to the docker compose Postgres above.
DATABASE_URL=postgres://curico:curico@localhost:5433/curico
```

Notes on model choice:
- `dots-studio/dots-3-note-preview:free` — multimodal (accepts images from the chat helper's 📷 / 📎 / drag-drop). This is a "reasoning" model; the route already sends `reasoning: { enabled: false }` so it doesn't burn `max_tokens` on hidden reasoning.
- `z-ai/glm-5.2:free` — text-only, often rate-limited by the upstream provider (Decart).
- Any paid vision model works too (e.g. `anthropic/claude-haiku-4-5`).

`.env.local` is git-ignored.

---

## Run

```bash
npm run dev
```

- **http://localhost:3000/** — activity landing page (title, learning goal, materials, safety, "Start activity" button)
- **http://localhost:3000/activity** — the step-by-step lab (18 steps, chat helper, dev panel)
- **http://localhost:3000/teacher** — teacher dashboard (auto-polls every 3 s, shows flagged misconceptions with approve/edit/reject and the raw answer feed)

---

## What to try in the demo

Chat panel prompts that fire misconception flags (visible in the yellow "flagged" pill on the reply and in the teacher view):

- On the burette-rinse step (**Step 3**): *"I already rinsed it with water, so it's fine, right?"* → flags **Rinsing burette with water is enough**.
- Around **Step 8** (endpoint photo): *"It's clearly pink so that's the endpoint, right?"* → flags **Dark pink means endpoint**.
- On **Step 16** (molarity): *"Should I divide my moles by 25 mL since that's the total volume in the flask?"* → flags **Dividing by total flask volume for molarity**.

Multimodal helper:
- **🎤** — dictate a question (Chrome only).
- **📷** — open the live camera in the chat panel, capture a frame.
- **📎** — attach any local image file.
- **Drag-and-drop** an image onto the chat card, or **paste** a screenshot (Cmd/Ctrl+V).

Dev panel (bottom-right ⚙ button, on `/activity`):
- **Unlock all steps** — click any step in the timeline regardless of progress.
- **Jump to step** — dropdown navigator.
- **Reset current step / Clear chat / Reset activity** — for looping demos.

State persistence: answers, chat, step progress, and the unlock toggle are saved to `localStorage` under `curico.activity.state.v1`. Navigate away and back, or reload — nothing is lost. **Reset activity** clears the key.

---

## Architecture (at a glance)

```
Browser (Next.js App Router client components)
   ├── /                → landing (app/page.tsx)
   ├── /activity        → step-by-step interface (app/activity/page.tsx)
   └── /teacher         → dashboard (app/teacher/page.tsx)
                             ↑ polls /api/misconceptions every 3s
Next.js server routes
   ├── /api/chat        → RAG + OpenRouter, parses <<META>> misconception line
   └── /api/misconceptions → in-memory queue (flags + latest answers)
RAG
   ├── data/activity.ts       → 23 structured chunks + step definitions
   ├── data/activity_guide.md → long-form teacher's guide, chunked at seed time
   ├── lib/embed.ts           → Xenova/all-MiniLM-L6-v2, 384 dims, local
   ├── lib/rag.ts             → pgvector cosine similarity; keyword fallback
   └── Postgres + pgvector    → docker compose, port 5433
```

The chat route enriches every LLM call with the retrieved chunk text pinned into the system message, the step's per-step `hintsPolicy`, and a `KNOWN MISCONCEPTIONS` list. The model is asked to emit a trailing `<<META>>{...}` JSON line the server parses to detect flags.

---

## Common operations

```bash
npm run dev              # dev server (Next hot reload)
npm run build            # production build (type-checks everything)
npm run start            # run the production build
npm run seed             # re-seed the RAG store (safe; deletes + re-inserts this activity's chunks)
npm run db:up            # start pgvector Postgres
npm run db:down          # stop it (keeps the volume, so seeded data persists)
docker compose down -v   # stop AND drop the volume (nuclear reset)
```

Editing the activity content:
- Edit `data/activity.ts` (steps, misconceptions, structured chunks) or `data/activity_guide.md` (long-form guide) and re-run `npm run seed`.
- The seed script does a `delete + insert` for this activity's rows only; other activities in the same DB are untouched.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `pgvector retrieve failed, falling back` in the dev log; chat still works but `ragBackend: "keyword"` | Postgres not up, or `npm run seed` never ran | `npm run db:up && npm run seed`; restart `npm run dev` |
| `502 LLM upstream 429 … temporarily rate-limited upstream` | The free model slot is throttled by the upstream provider | Wait a minute, or set a different `CURICO_MODEL` in `.env.local` |
| `(the AI returned an empty reply — try asking again)` | Reasoning model burned all `max_tokens` on hidden reasoning tokens | Already handled by passing `reasoning: { enabled: false }` — if it recurs, bump `max_tokens` in `app/api/chat/route.ts` |
| Camera doesn't open | Browser blocks `getUserMedia` on non-secure origins other than `localhost` | Use `http://localhost:3000` (not the LAN IP), or serve over HTTPS |
| Voice mic button says "not supported" | Safari / Firefox don't ship the Web Speech API | Use Chrome or Edge |
| First `npm run seed` hangs at "embedding…" for a minute | Downloading the ~23 MB `Xenova/all-MiniLM-L6-v2` model on first run | Let it finish; subsequent runs are instant (cached in `node_modules`) |
| `ENOENT onnxruntime_binding.node` at runtime in dev | Next.js webpack tried to bundle a native binary | Already fixed via `serverComponentsExternalPackages` in `next.config.js` — reinstall if you edited that file |
| Teacher dashboard shows nothing | The flags live in a Node-process in-memory store; restarting `npm run dev` clears them | Trigger a fresh flag from the chat |

---

## What's NOT in the PoC

Per the proposal these are separate components; only the two the client asked to demo are built end-to-end:

- Teacher classroom management (rosters, join codes, schedule)
- Full learning-analytics dashboard (only a minimal flag queue is shown)
- Auth / RBAC
- Safety content filter on the LLM
- WebSocket real-time — teacher view polls every 3 s
- Persistent misconception store — the flag queue lives in a Node in-memory map; restart clears it

---

## Files worth reading

- `data/activity.ts` — step definitions with input kind, per-step `hintsPolicy`, `concept` learning block, 23 short RAG chunks, and the known-misconception catalog
- `data/activity_guide.md` — long-form teacher's guide; chunked into the RAG store at seed time
- `scripts/seed.ts` — creates extension + table + ivfflat index, embeds all chunks, inserts them
- `lib/rag.ts` — pgvector cosine retrieval + keyword fallback
- `lib/embed.ts` — local sentence embeddings (`@xenova/transformers`)
- `app/api/chat/route.ts` — Socratic system prompt, RAG assembly, misconception parse, OpenRouter call, empty-reply retry
- `app/activity/page.tsx` — student interface (timeline, step blocks, chat with camera/mic/attach, dev panel, brief modal, localStorage persistence)
- `app/teacher/page.tsx` — flag queue + answer feed
