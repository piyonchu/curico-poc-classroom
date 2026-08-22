import { NextRequest, NextResponse } from "next/server";
import { getActivity } from "@/data/activities";
import { retrieve } from "@/lib/rag";
import { store } from "@/lib/store";

export const runtime = "nodejs";

type ChatMsg = { role: "user" | "assistant"; content: string };
type MultipartPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

const SYSTEM = `You are the Curico Classroom AI learning assistant.

You guide a first-year undergraduate through ONE hands-on titration step at a time.

FIRST decide the student's state before you reply:
- CORRECT: their recorded answer OR their message clearly matches the INSTRUCTOR-ONLY EXPECTED ANSWER. If they were just asking a general clarifying question and answered nothing wrong, this also counts.
- PARTIAL: on the right track but missing a key piece or unclear.
- WRONG: contradicts the expected answer or the retrieved context.
- MISCONCEPTION: matches one of the KNOWN MISCONCEPTIONS.
- OFF-TOPIC / OUT-OF-SCOPE: not about the current step.

RESPONSE RULES by state:

- CORRECT → Briefly confirm they got it, in ONE sentence. You may add ONE short optional deepening question, but only if there's real value. Do NOT ask a Socratic hint for the sake of it. Example: "Yes — 8.35 × 10⁻⁴ mol is right. Notice how three-sig-fig discipline just carried the burette precision through to the answer."
- PARTIAL → Acknowledge what's right, then ONE Socratic question about the piece they're missing.
- WRONG or MISCONCEPTION → Do NOT reveal the correct answer. Ask ONE small Socratic question that surfaces the flaw, following the STEP HINT POLICY.
- OFF-TOPIC → Redirect back to the current step in one sentence.
- SAFETY concern → Stop and say so plainly.

HARD RULES (apply in every state):
- NEVER solve arithmetic for the student. NEVER write the sentence they were supposed to write. NEVER pick the choice for them. (Confirming a correct answer they already gave is not the same as producing the answer for them.)
- Ground every reply in the RETRIEVED CONTEXT. If the context does not cover the question, say so briefly and steer back.
- Stay on the current step. If asked about a later step, gently redirect.
- Short, warm, natural language. 1–3 sentences total. At most one question.
- Effective-feedback frame (Hattie & Timperley): where you are, what the next tiny action is, why it matters — never just "wrong" or "right".

AFTER your reply to the student, output a single line of JSON on its own line, prefixed with <<META>>:
<<META>>{"misconception_id": "<id or null>", "misconception_label": "<short label or null>", "evidence": "<student quote or null>", "suggested_feedback": "<one sentence draft for the teacher, or null>"}

Set misconception_id to one of the ids in KNOWN MISCONCEPTIONS if the student's message matches one; use "other" for a new one worth flagging; use null if nothing to flag.`;

function buildUserBlock(opts: {
  studentMessage: string;
  activityId: string;
  stepId: string;
  currentAnswer?: string;
  retrieved: { id: string; text: string }[];
}) {
  const activity = getActivity(opts.activityId);
  const step = activity.steps.find((s) => s.id === opts.stepId)!;
  const known = activity.commonMisconceptions
    .map((m) => `- ${m.id}: ${m.label} — ${m.description}`)
    .join("\n");
  const ctx = opts.retrieved
    .map((r) => `[${r.id}] ${r.text}`)
    .join("\n");
  return `CURRENT STEP (${step.id}): ${step.title}
Instructions the student sees: ${step.instructions}
Step hint policy for you: ${step.hintsPolicy}
INSTRUCTOR-ONLY expected answer (never quote verbatim; use it only to judge correctness): ${step.expected ?? "(no rubric expected answer for this step)"}
Student's current recorded answer for this step: ${opts.currentAnswer ?? "(none yet)"}

RETRIEVED CONTEXT from the teacher's activity sheet:
${ctx || "(no relevant chunks)"}

KNOWN MISCONCEPTIONS:
${known}

STUDENT SAYS:
${opts.studentMessage}`;
}

// Strip reasoning that leaked into the visible content field. Free reasoning
// models often ignore `reasoning: { enabled: false }` and just dump the chain
// of thought as prose in front of the final answer. We keep only the final
// "Response" / "Answer" section, and drop <think>…</think> style tags.
function stripReasoning(text: string): string {
  let t = text.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, "");
  const markers = [
    /###\s*(?:Final\s+)?Response\s*\n+/i,
    /###\s*(?:Final\s+)?Answer\s*\n+/i,
    /\n\s*Response\s*:\s*\n+/i,
    /\n\s*Final\s+answer\s*:\s*\n+/i,
    /\n---\s*\n/,
  ];
  for (const m of markers) {
    const match = t.match(m);
    if (match && typeof match.index === "number") {
      const after = t.slice(match.index + match[0].length).trim();
      if (after.length > 20) t = after;
    }
  }
  // If a "### Reasoning" block still sits at the top with no marker after it,
  // drop up through the last "###" header.
  if (/^###\s*Reasoning/i.test(t.trim())) {
    const parts = t.split(/\n###\s+/);
    if (parts.length > 1) t = parts[parts.length - 1].replace(/^[^\n]*\n/, "");
  }
  return t.trim();
}

function parseMeta(text: string): {
  reply: string;
  meta: {
    misconception_id: string | null;
    misconception_label: string | null;
    evidence: string | null;
    suggested_feedback: string | null;
  } | null;
} {
  const idx = text.lastIndexOf("<<META>>");
  if (idx === -1) return { reply: stripReasoning(text), meta: null };
  const reply = stripReasoning(text.slice(0, idx));
  const jsonPart = text.slice(idx + "<<META>>".length).trim();
  try {
    return { reply, meta: JSON.parse(jsonPart) };
  } catch {
    return { reply, meta: null };
  }
}

// Deterministic fallback used when ANTHROPIC_API_KEY is not set — lets the
// PoC boot and be clicked through without an API key. It is intentionally
// dumb; real behavior comes from the LLM path.
function stubReply(
  studentMessage: string,
  activityId: string,
  stepId: string,
  currentAnswer?: string,
) {
  const activity = getActivity(activityId);
  const step = activity.steps.find((s) => s.id === stepId)!;
  const lower = studentMessage.toLowerCase();
  let meta: any = { misconception_id: null, misconception_label: null, evidence: null, suggested_feedback: null };
  if (/(heavy|heavier|heaviest|weight|weigh|mass)/.test(lower) && !/volume/.test(lower)) {
    meta = {
      misconception_id: "m_weight_only",
      misconception_label: "Density = weight",
      evidence: studentMessage,
      suggested_feedback:
        "Ask the student to compare a small piece of metal to a large sponge — same weight, different size — to separate weight from density.",
    };
  } else if (/(thick|thicker|thickest|viscous|viscosity|goopy|syrupy)/.test(lower)) {
    meta = {
      misconception_id: "m_viscosity",
      misconception_label: "Thick means dense",
      evidence: studentMessage,
      suggested_feedback:
        "Prompt the student with oil (thick but less dense than water) to separate viscosity from density.",
    };
  }
  const reply = `(stub — no API key set) For "${step.title}": ${step.hintsPolicy.split(".")[0]}. What do you notice so far${currentAnswer ? " about your recorded answer" : ""}?`;
  return { reply, meta };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    studentId: string;
    activityId?: string;
    stepId: string;
    messages: ChatMsg[];
    currentAnswer?: string;
    image?: string; // data URL, only on the last user turn
  };
  const activity = getActivity(body.activityId);
  const last = body.messages[body.messages.length - 1];
  if (!last || last.role !== "user") {
    return NextResponse.json({ error: "no user message" }, { status: 400 });
  }

  const { hits: retrieved, backend } = await retrieve(
    last.content,
    body.stepId,
    4,
    activity.id,
  );
  const userBlock = buildUserBlock({
    studentMessage: last.content,
    activityId: activity.id,
    stepId: body.stepId,
    currentAnswer: body.currentAnswer,
    retrieved,
  });

  const key = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY;
  // Free OpenRouter models only (slug must end with :free).
  const model =
    process.env.CURICO_MODEL && process.env.CURICO_MODEL.endsWith(":free")
      ? process.env.CURICO_MODEL
      : "dots-studio/dots-3-note-preview:free";
  let reply: string;
  let meta: any = null;

  if (!key) {
    const s = stubReply(last.content, activity.id, body.stepId, body.currentAnswer);
    reply = s.reply;
    meta = s.meta;
  } else {
    const priorTurns = body.messages.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const userMsgContent: string | MultipartPart[] = body.image
      ? [
          { type: "text", text: userBlock },
          { type: "image_url", image_url: { url: body.image } },
        ]
      : userBlock;
    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Curico Classroom PoC",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1200,
        reasoning: { enabled: false },
        messages: [
          { role: "system", content: SYSTEM },
          ...priorTurns,
          { role: "user", content: userMsgContent },
        ],
      }),
    });
    if (!orRes.ok) {
      const errText = await orRes.text();
      return NextResponse.json(
        { error: `LLM upstream ${orRes.status}: ${errText.slice(0, 300)}` },
        { status: 502 },
      );
    }
    const data = await orRes.json();
    const raw: string = data?.choices?.[0]?.message?.content || "";
    const parsed = parseMeta(raw);
    reply = parsed.reply;
    meta = parsed.meta;

    // Some free models return only a <<META>> line with no prose before it,
    // or return an empty content field entirely. Retry once WITHOUT the META
    // instruction so we at least get user-visible text.
    if (!reply.trim()) {
      const retry = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Curico Classroom PoC",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1200,
          reasoning: { enabled: false },
          messages: [
            {
              role: "system",
              content:
                "You are the Curico Classroom AI. Answer the student in 1–3 warm, Socratic sentences. Never give the final answer. Ground your reply in the retrieved context. Do NOT emit any <<META>> line — just plain prose.",
            },
            ...priorTurns,
            { role: "user", content: userBlock },
          ],
        }),
      });
      if (retry.ok) {
        const retryData = await retry.json();
        const retryRaw: string = retryData?.choices?.[0]?.message?.content || "";
        reply = stripReasoning(retryRaw) || "(the AI returned an empty reply — try asking again)";
      } else {
        reply = "(the AI returned an empty reply — try asking again)";
      }
    }
  }

  // Persist conversation evidence for formative assessment (teacher drafts).
  const now = Date.now();
  store.conversations.push({
    id: `cv_${now}_u`,
    studentId: body.studentId,
    stepId: body.stepId,
    role: "user",
    content: last.content,
    hasImage: Boolean(body.image),
    createdAt: now,
  });
  store.conversations.push({
    id: `cv_${now}_a`,
    studentId: body.studentId,
    stepId: body.stepId,
    role: "assistant",
    content: reply,
    createdAt: now + 1,
  });

  if (meta && meta.misconception_id) {
    store.misconceptions.push({
      id: `mc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      studentId: body.studentId,
      stepId: body.stepId,
      misconceptionId: meta.misconception_id,
      label: meta.misconception_label || meta.misconception_id,
      evidenceQuote: meta.evidence || last.content,
      suggestedFeedback: meta.suggested_feedback || "",
      createdAt: Date.now(),
    });
  }

  return NextResponse.json({
    reply,
    citations: retrieved.map((r) => ({ id: r.id, text: r.text, score: r.score })),
    ragBackend: backend,
    flagged: meta && meta.misconception_id ? meta : null,
  });
}
