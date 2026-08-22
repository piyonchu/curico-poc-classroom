"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSession, ALL_STUDENTS } from "@/lib/classroom";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    if (u === "teacher") {
      setSession({ kind: "teacher", id: "teacher" });
      router.push("/teacher-home");
      return;
    }
    if (ALL_STUDENTS.includes(u)) {
      setSession({ kind: "student", id: u });
      router.push("/student-home");
      return;
    }
    setError("Use 'teacher' or 'student-1' … 'student-5' (any password).");
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <div className="login-logo">C</div>
          <div>
            <div className="login-title">Curico Classroom</div>
            <div className="muted">Sign in to continue</div>
          </div>
        </div>

        <label className="login-label">
          Username
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="teacher or student-1"
            autoFocus
          />
        </label>

        <label className="login-label">
          Password
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="anything"
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn" type="submit" style={{ marginTop: 4 }}>
          Sign in
        </button>

        <div className="login-hint">
          Demo accounts: <code>teacher</code>, <code>student-1</code>, <code>student-2</code>, … <code>student-5</code>.
          Any password works.
        </div>
      </form>
    </div>
  );
}
