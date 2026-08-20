"use client";

import { useEffect, useState } from "react";
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

export default function TeacherPage() {
  const [data, setData] = useState<{ misconceptions: Misconception[]; answers: Answer[] }>({
    misconceptions: [],
    answers: [],
  });
  const [approved, setApproved] = useState<Record<string, "approve" | "edit" | "reject">>({});

  async function load() {
    const r = await fetch("/api/misconceptions");
    setData(await r.json());
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const stepTitle = (id: string) =>
    activity.steps.find((s) => s.id === id)?.title || id;

  return (
    <div className="shell">
      <div className="top">
        <div>
          <h1>Teacher dashboard — {activity.title}</h1>
          <div className="meta">
            Auto-refresh every 3s · {data.misconceptions.length} flag(s) · {data.answers.length} answer(s)
          </div>
        </div>
        <Link href="/">← Student view</Link>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Flagged misconceptions</h2>
          <div className="muted">AI drafts; you approve, edit, or reject.</div>
          {data.misconceptions.length === 0 && (
            <p className="muted">No flags yet. Have the student say something like "honey sinks because it's thicker".</p>
          )}
          {data.misconceptions.map((m) => (
            <div key={m.id} className="mc-item">
              <div>
                <span className="label">{m.label}</span>{" "}
                <span className="muted">· {stepTitle(m.stepId)} · {m.studentId}</span>
              </div>
              <div className="quote">"{m.evidenceQuote}"</div>
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
                    {approved[m.id] === a ? "✓ " : ""}{a}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Latest answers</h2>
          <div className="muted">Raw evidence recorded by the student interface.</div>
          {data.answers.length === 0 && <p className="muted">Nothing yet.</p>}
          {data.answers.slice(0, 20).map((a, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #eef0f7" }}>
              <div>
                <span className="pill ok">{a.kind}</span>{" "}
                <b>{stepTitle(a.stepId)}</b>{" "}
                <span className="muted">· {a.studentId}</span>
              </div>
              <div style={{ fontSize: 14, marginTop: 4 }}>{a.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
