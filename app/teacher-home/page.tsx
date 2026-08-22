"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Classroom,
  clearSession,
  createClassroom,
  getSession,
  listClassrooms,
} from "@/lib/classroom";

export default function TeacherHomePage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [section, setSection] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s || s.kind !== "teacher") {
      router.replace("/login");
      return;
    }
    setClasses(listClassrooms());
  }, [router]);

  function reload() {
    setClasses(listClassrooms());
  }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createClassroom(name.trim(), section.trim() || "Section A");
    setName("");
    setSection("");
    setShowCreate(false);
    reload();
  }

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
            <div className="muted" style={{ fontSize: 12 }}>Teacher</div>
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn ghost" onClick={() => setShowCreate((x) => !x)}>
            + Create class
          </button>
          <button className="btn secondary" onClick={signOut}>Sign out</button>
        </div>
      </header>

      {showCreate && (
        <form className="card gc-create" onSubmit={submitCreate}>
          <h2 style={{ margin: 0 }}>Create class</h2>
          <input
            className="input"
            placeholder="Class name (e.g. Chemistry 201)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <input
            className="input"
            placeholder="Section (e.g. Section B · Fall 2026)"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          />
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn ghost" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button className="btn" type="submit">Create</button>
          </div>
        </form>
      )}

      <div className="gc-grid">
        {classes.map((c) => (
          <Link key={c.id} href={`/teacher-home/${c.id}`} className="gc-card">
            <div className="gc-card-head" style={{ background: c.color }}>
              <div className="gc-card-name">{c.name}</div>
              <div className="gc-card-section">{c.section}</div>
            </div>
            <div className="gc-card-body">
              <div className="muted" style={{ fontSize: 13 }}>
                {c.studentIds.length} student{c.studentIds.length === 1 ? "" : "s"}
                {" · "}
                {c.activityIds.length} activity
              </div>
              {c.messages.length > 0 && (
                <div className="gc-card-msg">
                  Last message: {c.messages[c.messages.length - 1].text.slice(0, 60)}
                  {c.messages[c.messages.length - 1].text.length > 60 ? "…" : ""}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p className="muted">No classes yet — click <b>+ Create class</b> to start.</p>
        </div>
      )}
    </div>
  );
}
