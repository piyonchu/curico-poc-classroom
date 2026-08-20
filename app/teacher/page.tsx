"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { activity } from "@/data/activity";

type Misconception = {
  id: string;
  studentId: string;
  stepId: string;
  label: string;
  evidenceQuote: string;
  suggestedFeedback: string;
  createdAt: number;
};
type Answer = {
  studentId: string;
  stepId: string;
  kind: string;
  value: string;
  createdAt: number;
};
type Conversation = {
  id: string;
  studentId: string;
  stepId: string;
  role: string;
  content: string;
  createdAt: number;
};
type FormativeRecommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  focus: string;
  recommendation: string;
  evidenceRefs: string[];
};
type FormativeDraft = {
  id: string;
  studentId: string;
  summary: string;
  strengths: string[];
  growthAreas: string[];
  recommendations: FormativeRecommendation[];
  evidenceUsed: {
    responses: number;
    conversations: number;
    experimentResults: number;
    misconceptions: number;
  };
  status: "draft" | "approved" | "edited" | "rejected";
  teacherNotes: string;
  createdAt: number;
};

export default function TeacherPage() {
  const [data, setData] = useState<{
    misconceptions: Misconception[];
    answers: Answer[];
    conversations: Conversation[];
  }>({
    misconceptions: [],
    answers: [],
    conversations: [],
  });
  const [drafts, setDrafts] = useState<FormativeDraft[]>([]);
  const [disclaimer, setDisclaimer] = useState("");
  const [students, setStudents] = useState<
    { studentId: string; evidence: FormativeDraft["evidenceUsed"] }[]
  >([]);
  const [approved, setApproved] = useState<Record<string, "approve" | "edit" | "reject">>({});
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const loadFeed = useCallback(async () => {
    const r = await fetch("/api/misconceptions");
    setData(await r.json());
  }, []);

  const loadFormative = useCallback(async () => {
    const r = await fetch("/api/formative-assessment");
    const j = await r.json();
    setDrafts(j.drafts || []);
    setDisclaimer(j.disclaimer || "");
    setStudents(j.students || []);
  }, []);

  useEffect(() => {
    loadFeed();
    loadFormative();
    const t = setInterval(() => {
      loadFeed();
      loadFormative();
    }, 3000);
    return () => clearInterval(t);
  }, [loadFeed, loadFormative]);

  const stepTitle = (id: string) =>
    activity.steps.find((s) => s.id === id)?.title || id;

  async function generateDrafts() {
    setGenerating(true);
    setGenError(null);
    try {
      const r = await fetch("/api/formative-assessment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const text = await r.text();
      let j: any = null;
      try {
        j = text ? JSON.parse(text) : null;
      } catch {
        setGenError(`Bad response (${r.status}): ${text.slice(0, 120) || "empty body"}`);
        return;
      }
      if (!r.ok) {
        setGenError(j?.error || `HTTP ${r.status}`);
        return;
      }
      await loadFormative();
    } catch (e: any) {
      setGenError(e.message || "Network error");
    } finally {
      setGenerating(false);
    }
  }

  async function reviewDraft(
    id: string,
    status: FormativeDraft["status"],
    extra?: { teacherNotes?: string },
  ) {
    await fetch("/api/formative-assessment", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status, ...extra }),
    });
    await loadFormative();
  }

  const experimentAnswers = data.answers.filter(
    (a) => a.kind === "photo" || a.kind === "number",
  );

  return (
    <div className="shell">
      <div className="top">
        <div>
          <h1>Teacher dashboard — {activity.title}</h1>
          <div className="meta">
            Auto-refresh every 3s · {data.misconceptions.length} flag(s) ·{" "}
            {data.answers.length} answer(s) · {data.conversations.length} chat turn(s) ·{" "}
            {drafts.length} formative draft(s)
          </div>
        </div>
        <Link href="/">← Student view</Link>
      </div>

      <div className="banner-warn">
        <b>Teacher control:</b> AI drafts recommendations from learning evidence.
        It does <b>not</b> assign grades or decide learning outcomes — you approve,
        edit, or reject every draft.
      </div>

      <div className="card fa-panel">
        <div className="fa-head">
          <div>
            <h2>AI-assisted formative assessment</h2>
            <div className="muted">
              Analyzes responses, conversations, experiment results (numbers/photos),
              and misconception flags → teacher recommendations only.
            </div>
            {disclaimer && <div className="muted" style={{ marginTop: 4 }}>{disclaimer}</div>}
          </div>
          <button className="btn" onClick={generateDrafts} disabled={generating}>
            {generating ? "Generating…" : "Generate recommendations"}
          </button>
        </div>

        {students.length > 0 && (
          <div className="evidence-strip">
            {students.map((s) => (
              <div key={s.studentId} className="evidence-chip">
                <b>{s.studentId}</b>
                <span>{s.evidence.responses} responses</span>
                <span>{s.evidence.conversations} chat</span>
                <span>{s.evidence.experimentResults} experiments</span>
                <span>{s.evidence.misconceptions} flags</span>
              </div>
            ))}
          </div>
        )}

        {genError && <p className="error">{genError}</p>}

        {drafts.length === 0 && (
          <p className="muted">
            No drafts yet. Collect student evidence on /activity, then generate
            recommendations here.
          </p>
        )}

        {drafts.map((d) => (
          <div key={d.id} className="fa-draft">
            <div className="fa-draft-top">
              <div>
                <span className="label">{d.studentId}</span>{" "}
                <span className={"pill status-" + d.status}>{d.status}</span>
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                Evidence used: {d.evidenceUsed.responses} responses ·{" "}
                {d.evidenceUsed.conversations} conversations ·{" "}
                {d.evidenceUsed.experimentResults} experiment results ·{" "}
                {d.evidenceUsed.misconceptions} misconceptions
              </div>
            </div>
            <p className="fa-summary">{d.summary}</p>
            <div className="fa-cols">
              <div>
                <div className="muted"><b>Strengths</b></div>
                <ul>
                  {d.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="muted"><b>Growth areas</b></div>
                <ul>
                  {d.growthAreas.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="muted"><b>Recommendations for you</b></div>
            {d.recommendations.map((r) => (
              <div key={r.id} className="fa-rec">
                <span className={"pill pri-" + r.priority}>{r.priority}</span>{" "}
                <b>{r.focus}</b>
                <div>{r.recommendation}</div>
                {r.evidenceRefs.length > 0 && (
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    Evidence: {r.evidenceRefs.join(" · ")}
                  </div>
                )}
              </div>
            ))}
            <label className="fa-notes">
              <span className="muted">Your notes / edits (not sent to the student automatically)</span>
              <textarea
                value={editingNotes[d.id] ?? d.teacherNotes}
                onChange={(e) =>
                  setEditingNotes((m) => ({ ...m, [d.id]: e.target.value }))
                }
                rows={2}
                placeholder="Optional teacher rewrite…"
              />
            </label>
            <div className="actions">
              <button
                className={"btn " + (d.status === "approved" ? "" : "ghost")}
                onClick={() =>
                  reviewDraft(d.id, "approved", {
                    teacherNotes: editingNotes[d.id] ?? d.teacherNotes,
                  })
                }
              >
                approve
              </button>
              <button
                className={"btn " + (d.status === "edited" ? "" : "ghost")}
                onClick={() =>
                  reviewDraft(d.id, "edited", {
                    teacherNotes: editingNotes[d.id] ?? d.teacherNotes,
                  })
                }
              >
                save edits
              </button>
              <button
                className={"btn " + (d.status === "rejected" ? "" : "ghost")}
                onClick={() => reviewDraft(d.id, "rejected")}
              >
                reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid">
        <div className="card">
          <h2>Flagged misconceptions</h2>
          <div className="muted">AI drafts; you approve, edit, or reject.</div>
          {data.misconceptions.length === 0 && (
            <p className="muted">
              No flags yet. Have the student say something like &quot;It&apos;s clearly pink
              so that&apos;s the endpoint&quot; on Step 8.
            </p>
          )}
          {data.misconceptions.map((m) => (
            <div key={m.id} className="mc-item">
              <div>
                <span className="label">{m.label}</span>{" "}
                <span className="muted">
                  · {stepTitle(m.stepId)} · {m.studentId}
                </span>
              </div>
              <div className="quote">&quot;{m.evidenceQuote}&quot;</div>
              {m.suggestedFeedback && (
                <div className="feedback">
                  <b>Draft feedback:</b> {m.suggestedFeedback}
                </div>
              )}
              <div className="actions">
                {(["approve", "edit", "reject"] as const).map((a) => (
                  <button
                    key={a}
                    className={"btn " + (approved[m.id] === a ? "" : "ghost")}
                    onClick={() => setApproved((s) => ({ ...s, [m.id]: a }))}
                  >
                    {approved[m.id] === a ? "✓ " : ""}
                    {a}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Learning evidence feed</h2>
          <div className="muted">
            Responses, experiment results, and recent conversation turns.
          </div>

          <h3 className="subh">Experiment results</h3>
          {experimentAnswers.length === 0 && (
            <p className="muted">No number/photo experiment evidence yet.</p>
          )}
          {experimentAnswers.slice(0, 12).map((a, i) => (
            <div key={"ex" + i} style={{ padding: "8px 0", borderBottom: "1px solid #eef0f7" }}>
              <div>
                <span className="pill ok">{a.kind}</span>{" "}
                <b>{stepTitle(a.stepId)}</b>{" "}
                <span className="muted">· {a.studentId}</span>
              </div>
              <div style={{ fontSize: 14, marginTop: 4 }}>
                {a.kind === "photo" ? "(photo evidence captured)" : a.value}
              </div>
            </div>
          ))}

          <h3 className="subh">Latest answers</h3>
          {data.answers.length === 0 && <p className="muted">Nothing yet.</p>}
          {data.answers.slice(0, 12).map((a, i) => (
            <div key={"an" + i} style={{ padding: "8px 0", borderBottom: "1px solid #eef0f7" }}>
              <div>
                <span className="pill ok">{a.kind}</span>{" "}
                <b>{stepTitle(a.stepId)}</b>{" "}
                <span className="muted">· {a.studentId}</span>
              </div>
              <div style={{ fontSize: 14, marginTop: 4 }}>
                {a.kind === "photo" ? "(photo)" : a.value}
              </div>
            </div>
          ))}

          <h3 className="subh">Recent conversations</h3>
          {data.conversations.length === 0 && (
            <p className="muted">No chat turns stored yet.</p>
          )}
          {data.conversations.slice(0, 16).map((c) => (
            <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid #eef0f7" }}>
              <div>
                <span className="pill">{c.role}</span>{" "}
                <b>{stepTitle(c.stepId)}</b>{" "}
                <span className="muted">· {c.studentId}</span>
              </div>
              <div style={{ fontSize: 14, marginTop: 4 }}>{c.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
