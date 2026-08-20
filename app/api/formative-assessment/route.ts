import { NextRequest, NextResponse } from "next/server";
import {
  collectEvidence,
  generateFormativeDraft,
  listStudentIdsWithEvidence,
} from "@/lib/formative";
import { store, type FormativeDraftStatus } from "@/lib/store";

export const runtime = "nodejs";

/**
 * AI-assisted formative assessment for teachers.
 * Analyzes responses, conversations, experiment results, and misconception
 * evidence → drafts recommendations. Never assigns grades or outcomes.
 */

export async function GET() {
  const students = listStudentIdsWithEvidence().map((studentId) => {
    const e = collectEvidence(studentId);
    return {
      studentId,
      evidence: {
        responses: e.responses.length,
        conversations: e.conversations.length,
        experimentResults: e.experimentResults.length,
        misconceptions: e.misconceptions.length,
      },
    };
  });

  return NextResponse.json({
    disclaimer:
      "Formative drafts recommend teacher actions only. The system never auto-grades or decides learning outcomes.",
    students,
    drafts: [...store.formativeDrafts].sort((a, b) => b.createdAt - a.createdAt),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      studentId?: string;
    };

    const targets = body.studentId
      ? [body.studentId]
      : listStudentIdsWithEvidence();

    if (targets.length === 0) {
      return NextResponse.json(
        {
          error:
            "No learning evidence yet. Have a student record answers, chat, or experiment results first.",
        },
        { status: 400 },
      );
    }

    const created = [];
    for (const studentId of targets) {
      const bundle = collectEvidence(studentId);
      const draft = await generateFormativeDraft(bundle);
      store.formativeDrafts.unshift(draft);
      created.push(draft);
    }

    return NextResponse.json({
      ok: true,
      disclaimer:
        "Drafts are for teacher review only — approve, edit, or reject. Nothing is applied as a grade or outcome.",
      drafts: created,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to generate formative draft" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as {
    id: string;
    status?: FormativeDraftStatus;
    teacherNotes?: string;
    summary?: string;
    recommendations?: { id: string; recommendation: string }[];
  };

  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const draft = store.formativeDrafts.find((d) => d.id === body.id);
  if (!draft) {
    return NextResponse.json({ error: "draft not found" }, { status: 404 });
  }

  if (body.status) {
    if (!["draft", "approved", "edited", "rejected"].includes(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    draft.status = body.status;
    draft.reviewedAt = Date.now();
  }
  if (typeof body.teacherNotes === "string") {
    draft.teacherNotes = body.teacherNotes.slice(0, 2000);
    if (draft.status === "draft") draft.status = "edited";
    draft.reviewedAt = Date.now();
  }
  if (typeof body.summary === "string") {
    draft.summary = body.summary.slice(0, 2000);
    if (draft.status === "draft") draft.status = "edited";
    draft.reviewedAt = Date.now();
  }
  if (Array.isArray(body.recommendations)) {
    for (const upd of body.recommendations) {
      const rec = draft.recommendations.find((r) => r.id === upd.id);
      if (rec && typeof upd.recommendation === "string") {
        rec.recommendation = upd.recommendation.slice(0, 800);
      }
    }
    if (draft.status === "draft") draft.status = "edited";
    draft.reviewedAt = Date.now();
  }

  return NextResponse.json({
    ok: true,
    draft,
    note: "Teacher decision recorded. No grade or learning outcome was set by the system.",
  });
}
