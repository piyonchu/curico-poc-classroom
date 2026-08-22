"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Classroom,
  activityMeta,
  getClassroom,
  getSession,
} from "@/lib/classroom";

export default function StudentClassPage({
  params,
}: {
  params: { classId: string };
}) {
  const { classId } = params;
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
    setCls(c);
  }, [classId, router]);

  if (!cls) return null;

  return (
    <div className="gc-shell">
      <header className="gc-topbar">
        <Link href="/student-home" className="gc-back">← Your classes</Link>
        <div className="muted" style={{ fontSize: 12 }}>{studentId}</div>
      </header>

      <div className="gc-hero" style={{ background: cls.color }}>
        <div>
          <div className="gc-card-name" style={{ fontSize: 26 }}>{cls.name}</div>
          <div className="gc-card-section">{cls.section}</div>
        </div>
        <div className="gc-hero-meta">
          <div>{cls.schedule}</div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Activities</h2>
          <p className="muted">Click an activity to open it.</p>
          {cls.activityIds.map((aid) => {
            const meta = activityMeta(aid);
            const href = `/student-home/${classId}/${aid}`;
            return (
              <div
                key={aid}
                role="link"
                tabIndex={0}
                className="gc-activity-tile as-link"
                onClick={() => router.push(href)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(href);
                  }
                }}
              >
                <div className="gc-activity-icon">{meta.icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="label">{meta.title}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {meta.subject} · {meta.dueLabel}
                  </div>
                </div>
                <span className="btn">Open →</span>
              </div>
            );
          })}
        </div>

        <div className="card">
          <h2>Announcements</h2>
          {cls.messages.length === 0 && <p className="muted">Nothing from your teacher yet.</p>}
          {[...cls.messages].reverse().map((m) => (
            <div key={m.id} className="gc-msg">
              <div className="gc-msg-head">
                <b>{m.from}</b>
                <span className="muted" style={{ fontSize: 12 }}>
                  {new Date(m.at).toLocaleString()}
                </span>
              </div>
              <div>{m.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
