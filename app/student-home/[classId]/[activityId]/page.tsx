"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getActivity } from "@/data/activities";
import {
  Classroom,
  activityMeta,
  getClassroom,
  getSession,
} from "@/lib/classroom";

export default function StudentActivityBriefPage({
  params,
}: {
  params: { classId: string; activityId: string };
}) {
  const { classId, activityId } = params;
  const router = useRouter();
  const [cls, setCls] = useState<Classroom | null>(null);
  const [studentId, setStudentId] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s || s.kind !== "student") {
      router.replace("/login");
      return;
    }
    setStudentId(s.id);
    const c = getClassroom(classId);
    if (!c || !c.studentIds.includes(s.id)) {
      router.replace("/student-home");
      return;
    }
    if (!c.activityIds.includes(activityId)) {
      router.replace(`/student-home/${classId}`);
      return;
    }
    setCls(c);
  }, [classId, activityId, router]);

  if (!cls) return null;

  const activity = getActivity(activityId);
  const meta = activityMeta(activityId);

  return (
    <div className="gc-shell">
      <header className="gc-topbar">
        <Link href={`/student-home/${classId}`} className="gc-back">← {cls.name}</Link>
        <div className="muted" style={{ fontSize: 12 }}>{studentId}</div>
      </header>

      <div className="gc-hero" style={{ background: cls.color }}>
        <div>
          <div className="gc-card-section" style={{ opacity: 0.9 }}>
            {meta.icon} Assignment · {cls.name}
          </div>
          <div className="gc-card-name" style={{ fontSize: 22, marginTop: 4 }}>{activity.title}</div>
          <div className="gc-card-section">{activity.subject} · {activity.gradeBand}</div>
        </div>
        <div className="gc-hero-meta">
          <div><b>{activity.steps.length}</b> steps</div>
          <div>{meta.dueLabel}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="block-label">🎯 Learning goal</div>
        <p className="block-body" style={{ marginTop: 4 }}>{activity.learningGoal}</p>
        <div className="row" style={{ marginTop: 16 }}>
          <button
            className="btn"
            style={{ padding: "12px 22px", fontSize: 15 }}
            onClick={() =>
              router.push(`/activity?class=${classId}&activity=${activityId}`)
            }
          >
            Start activity →
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>What you'll need</h2>
          <ul style={{ paddingLeft: 20, margin: "8px 0 0" }}>
            {activity.materials.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #f2994a" }}>
          <h2>⚠️ Safety</h2>
          <ul style={{ paddingLeft: 20, margin: "8px 0 0" }}>
            {activity.safety.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
