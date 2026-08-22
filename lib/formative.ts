import { activity } from "@/data/activity";
import { activities } from "@/data/activities";
import { store, type FormativeDraft, type FormativeRecommendation } from "@/lib/store";

export type EvidenceBundle = {
  studentId: string;
  responses: { stepId: string; kind: string; value: string; title: string }[];
  conversations: { stepId: string; role: string; content: string; title: string }[];
  experimentResults: { stepId: string; kind: string; value: string; title: string }[];
  misconceptions: { stepId: string; label: string; evidenceQuote: string; title: string }[];
};

function stepTitle(stepId: string) {
  for (const a of activities) {
    const s = a.steps.find((s) => s.id === stepId);
    if (s) return s.title;
  }
  return stepId;
}

/** Photo + number answers are treated as experiment / measurement evidence. */
export function isExperimentResult(kind: string) {
  return kind === "photo" || kind === "number";
}

export function collectEvidence(studentId: string): EvidenceBundle {
  const responses = store.answers
    .filter((a) => a.studentId === studentId)
    .map((a) => ({
      stepId: a.stepId,
      kind: a.kind,
      value: a.value.length > 280 ? a.value.slice(0, 280) + "…" : a.value,
      title: stepTitle(a.stepId),
    }));

  const experimentResults = responses.filter((r) => isExperimentResult(r.kind));

  const conversations = store.conversations
    .filter((c) => c.studentId === studentId)
    .slice(-40)
    .map((c) => ({
      stepId: c.stepId,
      role: c.role,
      content: c.content.length > 220 ? c.content.slice(0, 220) + "…" : c.content,
      title: stepTitle(c.stepId),
    }));

  const misconceptions = store.misconceptions
    .filter((m) => m.studentId === studentId)
    .map((m) => ({
      stepId: m.stepId,
      label: m.label,
      evidenceQuote: m.evidenceQuote,
      title: stepTitle(m.stepId),
    }));

  return { studentId, responses, conversations, experimentResults, misconceptions };
}

export function listStudentIdsWithEvidence(): string[] {
  const ids = new Set<string>();
  for (const a of store.answers) ids.add(a.studentId);
  for (const c of store.conversations) ids.add(c.studentId);
  for (const m of store.misconceptions) ids.add(m.studentId);
  return [...ids].sort();
}

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Deterministic draft when no LLM key is set — still produces teacher-only
 * recommendations from structured evidence, never a grade.
 */
export function stubFormativeDraft(bundle: EvidenceBundle): FormativeDraft {
  const recs: FormativeRecommendation[] = [];

  if (bundle.misconceptions.length) {
    const top = bundle.misconceptions[0];
    recs.push({
      id: uid("rec"),
      priority: "high",
      focus: top.label,
      recommendation: `Check in about "${top.label}" on ${top.title}. Ask the student to restate the idea in their own words using their recorded evidence — do not assign a mark.`,
      evidenceRefs: [
        `Misconception: "${top.evidenceQuote}"`,
        `Step: ${top.title}`,
      ],
    });
  }

  if (bundle.experimentResults.length === 0 && bundle.responses.length > 0) {
    recs.push({
      id: uid("rec"),
      priority: "medium",
      focus: "Experiment evidence",
      recommendation:
        "Encourage the student to record at least one measurement or endpoint photo so you can coach from concrete lab evidence.",
      evidenceRefs: [`Responses so far: ${bundle.responses.length}`],
    });
  } else if (bundle.experimentResults.length) {
    const last = bundle.experimentResults[bundle.experimentResults.length - 1];
    recs.push({
      id: uid("rec"),
      priority: "medium",
      focus: "Lab measurements",
      recommendation: `Review the latest ${last.kind} evidence on "${last.title}" with the student and ask how it connects to the learning goal — keep this formative, not graded.`,
      evidenceRefs: [`${last.kind} @ ${last.title}: ${last.value.slice(0, 80)}`],
    });
  }

  if (bundle.conversations.length) {
    const userTurns = bundle.conversations.filter((c) => c.role === "user");
    const sample = userTurns[userTurns.length - 1];
    if (sample) {
      recs.push({
        id: uid("rec"),
        priority: "low",
        focus: "Conversation patterns",
        recommendation:
          "Use a recent chat question as a warm-up in the next class huddle; the AI only drafted this prompt — you decide whether to use it.",
        evidenceRefs: [`Student said (${sample.title}): "${sample.content}"`],
      });
    }
  }

  if (recs.length === 0) {
    recs.push({
      id: uid("rec"),
      priority: "low",
      focus: "Getting started",
      recommendation:
        "Little learning evidence yet. Ask the student to complete the next step and record an answer or ask the helper one question — then regenerate this draft.",
      evidenceRefs: ["No responses, conversations, or experiment results yet"],
    });
  }

  const strengths: string[] = [];
  if (bundle.responses.length >= 3) {
    strengths.push("Has recorded multiple step responses — good engagement with the procedure.");
  }
  if (bundle.experimentResults.length >= 2) {
    strengths.push("Captured repeated experiment measurements/photos — useful for precision talk.");
  }
  if (bundle.conversations.length >= 2) {
    strengths.push("Actively questioning the AI helper — productive help-seeking.");
  }
  if (strengths.length === 0) {
    strengths.push("Early in the activity; watch for the first solid piece of evidence to coach from.");
  }

  const growthAreas: string[] = [];
  if (bundle.misconceptions.length) {
    growthAreas.push(
      ...bundle.misconceptions
        .slice(0, 3)
        .map((m) => `Address flagged idea: ${m.label} (${m.title}).`),
    );
  } else {
    growthAreas.push("No misconception flags yet — keep scanning answers and chat for emerging ideas.");
  }

  return {
    id: uid("fa"),
    studentId: bundle.studentId,
    activityId: activity.id,
    summary: [
      `Formative snapshot for ${bundle.studentId} on "${activity.title}".`,
      `Evidence: ${bundle.responses.length} response(s), ${bundle.conversations.length} conversation turn(s), ${bundle.experimentResults.length} experiment result(s), ${bundle.misconceptions.length} misconception flag(s).`,
      "This is a teacher-facing draft only. It does not assign a grade or decide any learning outcome.",
    ].join(" "),
    strengths,
    growthAreas,
    recommendations: recs,
    evidenceUsed: {
      responses: bundle.responses.length,
      conversations: bundle.conversations.length,
      experimentResults: bundle.experimentResults.length,
      misconceptions: bundle.misconceptions.length,
    },
    status: "draft",
    teacherNotes: "",
    createdAt: Date.now(),
  };
}

const FORMATIVE_SYSTEM = `You are Curico Classroom's formative-assessment drafter for teachers.

You analyze learning evidence (step responses, AI conversations, experiment results such as numbers/photos, and flagged misconceptions) and draft RECOMMENDATIONS FOR THE TEACHER.

HARD RULES:
- NEVER assign a grade, score, percentage, letter, pass/fail, or proficiency level.
- NEVER decide or imply a learning outcome decision (promotion, remediation placement, final mastery claim).
- NEVER release language meant to be shown automatically to the student as a judgement.
- Draft coaching suggestions the teacher may approve, edit, or reject.
- Ground every recommendation in the evidence provided; cite short evidence refs.
- Be concise and actionable. Teachers decide everything.

Return ONLY valid JSON matching:
{
  "summary": "2-4 sentences for the teacher",
  "strengths": ["..."],
  "growthAreas": ["..."],
  "recommendations": [
    {
      "priority": "high"|"medium"|"low",
      "focus": "short topic",
      "recommendation": "what the teacher might do next",
      "evidenceRefs": ["short quote or fact from evidence"]
    }
  ]
}`;

function buildEvidencePrompt(bundle: EvidenceBundle) {
  return `ACTIVITY: ${activity.title}
LEARNING GOAL: ${activity.learningGoal}
STUDENT ID: ${bundle.studentId}

STEP RESPONSES (${bundle.responses.length}):
${bundle.responses.map((r) => `- [${r.stepId}] ${r.title} (${r.kind}): ${r.value}`).join("\n") || "(none)"}

EXPERIMENT RESULTS — numbers/photos (${bundle.experimentResults.length}):
${bundle.experimentResults.map((r) => `- [${r.stepId}] ${r.title} (${r.kind}): ${r.value}`).join("\n") || "(none)"}

CONVERSATIONS (${bundle.conversations.length}):
${bundle.conversations.map((c) => `- [${c.stepId}] ${c.title} ${c.role}: ${c.content}`).join("\n") || "(none)"}

MISCONCEPTION FLAGS (${bundle.misconceptions.length}):
${bundle.misconceptions.map((m) => `- [${m.stepId}] ${m.title}: ${m.label} — "${m.evidenceQuote}"`).join("\n") || "(none)"}

Draft teacher-only formative recommendations. No grades. No outcome decisions.`;
}

type LlmShape = {
  summary?: string;
  strengths?: string[];
  growthAreas?: string[];
  recommendations?: {
    priority?: string;
    focus?: string;
    recommendation?: string;
    evidenceRefs?: string[];
  }[];
};

function normalizePriority(p: string | undefined): "high" | "medium" | "low" {
  if (p === "high" || p === "medium" || p === "low") return p;
  return "medium";
}

export async function generateFormativeDraft(bundle: EvidenceBundle): Promise<FormativeDraft> {
  const key = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!key) return stubFormativeDraft(bundle);

  // Free OpenRouter models only (slug must end with :free).
  const model =
    process.env.CURICO_MODEL && process.env.CURICO_MODEL.endsWith(":free")
      ? process.env.CURICO_MODEL
      : "dots-studio/dots-3-note-preview:free";

  const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Curico Classroom PoC Formative Assessment",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1400,
      reasoning: { enabled: false },
      messages: [
        { role: "system", content: FORMATIVE_SYSTEM },
        { role: "user", content: buildEvidencePrompt(bundle) },
      ],
    }),
  });

  if (!orRes.ok) {
    const fallback = stubFormativeDraft(bundle);
    fallback.summary = `(LLM unavailable — stub draft) ` + fallback.summary;
    return fallback;
  }

  const data = await orRes.json();
  const raw: string = data?.choices?.[0]?.message?.content || "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return stubFormativeDraft(bundle);

  let parsed: LlmShape;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return stubFormativeDraft(bundle);
  }

  const recommendations: FormativeRecommendation[] = (parsed.recommendations || [])
    .slice(0, 6)
    .map((r) => ({
      id: uid("rec"),
      priority: normalizePriority(r.priority),
      focus: (r.focus || "Coaching focus").slice(0, 120),
      recommendation: (r.recommendation || "").slice(0, 600),
      evidenceRefs: (r.evidenceRefs || []).slice(0, 5).map((e) => String(e).slice(0, 200)),
    }))
    .filter((r) => r.recommendation.trim().length > 0);

  const draft = stubFormativeDraft(bundle);
  return {
    ...draft,
    id: uid("fa"),
    summary:
      (parsed.summary || draft.summary).slice(0, 1200) +
      " This draft does not assign a grade or decide any learning outcome.",
    strengths: (parsed.strengths?.length ? parsed.strengths : draft.strengths)
      .slice(0, 6)
      .map((s) => String(s).slice(0, 280)),
    growthAreas: (parsed.growthAreas?.length ? parsed.growthAreas : draft.growthAreas)
      .slice(0, 6)
      .map((s) => String(s).slice(0, 280)),
    recommendations: recommendations.length ? recommendations : draft.recommendations,
    createdAt: Date.now(),
  };
}
