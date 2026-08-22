"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Classroom,
  classroomsForStudent,
  clearSession,
  getSession,
} from "@/lib/classroom";

export default function StudentHomePage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [studentId, setStudentId] = useState<string>("");

  useEffect(() => {
    const s = getSession();
    if (!s || s.kind !== "student") {
      router.replace("/login");
      return;
    }
    setStudentId(s.id);
    setClasses(classroomsForStudent(s.id));
  }, [router]);

  function signOut() {
    clearSession();
    router.push("/login");
  }

  return (
    <div className="gc-shell">
      <header className="gc-topbar">
        <div className="gc-topbar-brand">
          <div className="login-logo sm">C</div>
          <div>
            <div className="gc-topbar-title">Curico Classroom</div>
            <div className="muted" style={{ fontSize: 12 }}>{studentId}</div>
          </div>
        </div>
        <button className="btn secondary" onClick={signOut}>Sign out</button>
      </header>

      <h2 style={{ margin: "12px 4px" }}>Your classes</h2>

      <div className="gc-grid">
        {classes.map((c) => (
          <Link key={c.id} href={`/student-home/${c.id}`} className="gc-card">
            <div className="gc-card-head" style={{ background: c.color }}>
              <div className="gc-card-name">{c.name}</div>
              <div className="gc-card-section">{c.section}</div>
            </div>
            <div className="gc-card-body">
              <div className="muted" style={{ fontSize: 13 }}>
                {c.activityIds.length} activity · {c.schedule}
              </div>
              {c.messages.length > 0 && (
                <div className="gc-card-msg">
                  📢 {c.messages[c.messages.length - 1].text.slice(0, 70)}
                  {c.messages[c.messages.length - 1].text.length > 70 ? "…" : ""}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="muted">
            You are not enrolled in any classes yet. Ask your teacher to add <b>{studentId}</b>.
          </p>
        </div>
      )}
    </div>
  );
}
