"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ALL_STUDENTS,
  ACTIVITY_LIBRARY,
  Classroom,
  activityMeta,
  addStudent,
  getClassroom,
  getSession,
  postMessage,
  removeStudent,
  updateClassroom,
} from "@/lib/classroom";

export default function TeacherClassPage({
  params,
}: {
  params: { classId: string };
}) {
  const { classId } = params;
  const router = useRouter();
  const [cls, setCls] = useState<Classroom | null>(null);
  const [tab, setTab] = useState<"stream" | "students" | "activities" | "schedule">("stream");
  const [message, setMessage] = useState("");
  const [pickStudent, setPickStudent] = useState("");
  const [schedule, setSchedule] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s || s.kind !== "teacher") {
      router.replace("/login");
      return;
    }
    const c = getClassroom(classId);
    if (!c) {
      router.replace("/teacher-home");
      return;
    }
    setCls(c);
    setSchedule(c.schedule);
  }, [classId, router]);

  function reload() {
    const c = getClassroom(classId);
    if (c) setCls(c);
  }

  if (!cls) return null;

  const available = ALL_STUDENTS.filter((s) => !cls.studentIds.includes(s));

  function send() {
    if (!message.trim()) return;
    postMessage(classId, "teacher", message.trim());
    setMessage("");
    reload();
  }

  function saveSchedule() {
    updateClassroom(classId, { schedule: schedule.trim() || "TBD" });
    reload();
  }

  return (
    <div className="gc-shell">
      <header className="gc-topbar">
        <Link href="/teacher-home" className="gc-back">← All classes</Link>
        <div className="muted" style={{ fontSize: 12 }}>Teacher</div>
      </header>

      <div className="gc-hero" style={{ background: cls.color }}>
        <div>
          <div className="gc-card-name" style={{ fontSize: 26 }}>{cls.name}</div>
          <div className="gc-card-section">{cls.section}</div>
        </div>
        <div className="gc-hero-meta">
          <div>{cls.studentIds.length} students</div>
          <div>{cls.activityIds.length} activity</div>
        </div>
      </div>

      <nav className="gc-tabs">
        {(["stream", "students", "activities", "schedule"] as const).map((t) => (
          <button
            key={t}
            className={"gc-tab " + (tab === t ? "active" : "")}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {tab === "stream" && (
        <div className="grid">
          <div className="card">
            <h2>Announce to class</h2>
            <textarea
              className="input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share something with your class…"
              rows={3}
            />
            <div className="row" style={{ marginTop: 8, justifyContent: "flex-end" }}>
              <button className="btn" onClick={send} disabled={!message.trim()}>
                Post
              </button>
            </div>

            <h3 className="subh">Messages</h3>
            {cls.messages.length === 0 && <p className="muted">No messages yet.</p>}
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

          <div className="card">
            <h2>Progress snapshot</h2>
            <p className="muted">Follow student progress across the assigned activity.</p>
            <div className="gc-progress-list">
              {cls.studentIds.length === 0 && <p className="muted">No students enrolled.</p>}
              {cls.studentIds.map((s) => (
                <div key={s} className="gc-progress-row">
                  <span className="label">{s}</span>
                  <span className="pill ok">enrolled</span>
                </div>
              ))}
            </div>
            <Link href="/teacher" className="btn ghost" style={{ marginTop: 12, display: "inline-block" }}>
              Open teacher dashboard →
            </Link>
          </div>
        </div>
      )}

      {tab === "students" && (
        <div className="card">
          <h2>People</h2>
          <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <select
              className="input"
              style={{ maxWidth: 240 }}
              value={pickStudent}
              onChange={(e) => setPickStudent(e.target.value)}
            >
              <option value="">Choose a student…</option>
              {available.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              className="btn"
              disabled={!pickStudent}
              onClick={() => {
                addStudent(classId, pickStudent);
                setPickStudent("");
                reload();
              }}
            >
              Add student
            </button>
          </div>

          <h3 className="subh">Enrolled ({cls.studentIds.length})</h3>
          {cls.studentIds.length === 0 && <p className="muted">No one yet.</p>}
          <ul className="gc-student-list">
            {cls.studentIds.map((s) => (
              <li key={s}>
                <span className="gc-avatar">{s.slice(-1)}</span>
                <span className="label">{s}</span>
                <button
                  className="btn ghost"
                  onClick={() => {
                    removeStudent(classId, s);
                    reload();
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "activities" && (
        <div className="card">
          <h2>Assigned activities</h2>
          <p className="muted">
            {cls.activityIds.length} of {ACTIVITY_LIBRARY.length} available activities assigned.
          </p>
          {cls.activityIds.map((aid) => {
            const meta = activityMeta(aid);
            const assigned = true;
            return (
              <div key={aid} className="gc-activity-tile">
                <div className="gc-activity-icon">{meta.icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="label">{meta.title}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {meta.subject} · {meta.gradeBand} · {meta.dueLabel}
                  </div>
                </div>
                <Link href={`/activity?activity=${aid}`} className="btn ghost">
                  Preview steps →
                </Link>
                <button
                  className="btn ghost"
                  onClick={() => {
                    updateClassroom(classId, {
                      activityIds: cls.activityIds.filter((x) => x !== aid),
                    });
                    reload();
                  }}
                >
                  Unassign
                </button>
              </div>
            );
          })}

          {ACTIVITY_LIBRARY.some((a) => !cls.activityIds.includes(a.id)) && (
            <>
              <h3 className="subh">Available to assign</h3>
              {ACTIVITY_LIBRARY.filter((a) => !cls.activityIds.includes(a.id)).map((meta) => (
                <div key={meta.id} className="gc-activity-tile">
                  <div className="gc-activity-icon">{meta.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div className="label">{meta.title}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {meta.subject} · {meta.gradeBand}
                    </div>
                  </div>
                  <button
                    className="btn"
                    onClick={() => {
                      updateClassroom(classId, {
                        activityIds: [...cls.activityIds, meta.id],
                      });
                      reload();
                    }}
                  >
                    Assign
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === "schedule" && (
        <div className="card">
          <h2>Schedule</h2>
          <textarea
            className="input"
            rows={3}
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            placeholder="e.g. Mon/Wed 10:00–11:30, Lab Fri 13:00"
          />
          <div className="row" style={{ marginTop: 8, justifyContent: "flex-end" }}>
            <button className="btn" onClick={saveSchedule}>Save</button>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            Current: <b>{cls.schedule}</b>
          </p>
        </div>
      )}
    </div>
  );
}
