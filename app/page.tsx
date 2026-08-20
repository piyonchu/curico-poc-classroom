import Link from "next/link";
import { activity } from "@/data/activity";

export default function LandingPage() {
  return (
    <div className="shell">
      <div className="top">
        <div>
          <div className="meta" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 }}>
            Curico Classroom
          </div>
          <h1 style={{ marginTop: 6 }}>{activity.title}</h1>
          <div className="meta">{activity.subject} · {activity.gradeBand}</div>
        </div>
        <Link href="/teacher">Teacher view →</Link>
      </div>

      <div className="landing-hero card">
        <div className="landing-goal">
          <div className="block-label">🎯 Learning goal</div>
          <p className="block-body">{activity.learningGoal}</p>
        </div>
        <div className="landing-stats">
          <div><b>{activity.steps.length}</b><span>steps</span></div>
          <div><b>~60</b><span>minutes</span></div>
          <div><b>3</b><span>trials</span></div>
        </div>
        <div className="row" style={{ marginTop: 24 }}>
          <Link href="/activity" className="btn" style={{ padding: "12px 22px", fontSize: 15 }}>
            Start activity →
          </Link>
          <Link href="/teacher" className="btn ghost" style={{ padding: "12px 18px" }}>
            Peek at teacher dashboard
          </Link>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 24 }}>
        <div className="card">
          <h2>What you'll do</h2>
          <ol style={{ paddingLeft: 20, margin: "8px 0 0" }}>
            <li>Read the safety notes and confirm you're clear.</li>
            <li>State the goal in your own words — the AI checks your mental model.</li>
            <li>Rinse and fill the burette; record the initial reading.</li>
            <li>Pipette 5.00 mL vinegar into the flask, add water and phenolphthalein.</li>
            <li>Titrate three trials to a faint pink endpoint (30 s persistence).</li>
            <li>Keep the two palest endpoints; compute molarity and % w/w acetic acid.</li>
            <li>Reflect on which measurement dominates your error.</li>
          </ol>
        </div>

        <div className="card">
          <h2>What you'll need</h2>
          <ul style={{ paddingLeft: 20, margin: "8px 0 0" }}>
            {activity.materials.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20, borderLeft: "4px solid #f2994a" }}>
        <h2>⚠️ Safety</h2>
        <ul style={{ paddingLeft: 20, margin: "8px 0 0" }}>
          {activity.safety.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      <div className="card" style={{ marginTop: 20, background: "#f4f8ff", borderColor: "#dbe4ff" }}>
        <h2>How the AI helper works</h2>
        <ul style={{ paddingLeft: 20, margin: "8px 0 0" }}>
          <li><b>Socratic hints, not answers.</b> It asks you a small question that moves you one step forward.</li>
          <li><b>Grounded in this activity sheet.</b> Every reply is retrieved from the teacher's document (RAG on pgvector). Chunk IDs are shown under each reply.</li>
          <li><b>Multi-modal input.</b> Type, dictate with 🎤, snap a photo with 📷, or drop/paste an image.</li>
          <li><b>Flags misconceptions.</b> If you say something the teacher's misconception catalog matches, it's sent to the teacher dashboard with a draft feedback sentence to approve.</li>
          <li><b>Formative assessment for teachers.</b> The teacher dashboard can analyze your responses, chat, and experiment evidence and draft coaching recommendations — never an automatic grade.</li>
        </ul>
      </div>

      <div className="row" style={{ marginTop: 16, justifyContent: "center", gap: 12 }}>
        <Link href="/activity" className="btn" style={{ padding: "14px 28px", fontSize: 16 }}>
          Start activity →
        </Link>
        <Link href="/teacher" className="btn ghost" style={{ padding: "14px 20px", fontSize: 15 }}>
          Teacher dashboard
        </Link>
      </div>
    </div>
  );
}
