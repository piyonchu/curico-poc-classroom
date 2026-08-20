// In-memory store shared across API routes for the PoC. Restart the dev
// server to reset. In production this is Postgres.

export type Misconception = {
  id: string;
  studentId: string;
  stepId: string;
  misconceptionId: string; // matches activity.commonMisconceptions[].id, or "other"
  label: string;
  evidenceQuote: string; // student's own words
  suggestedFeedback: string; // draft feedback for the teacher to approve
  createdAt: number;
};

export type StudentAnswer = {
  studentId: string;
  stepId: string;
  kind: "text" | "number" | "choice" | "photo";
  value: string;
  createdAt: number;
};

/** Chat turns persisted server-side so formative assessment can read them. */
export type ConversationTurn = {
  id: string;
  studentId: string;
  stepId: string;
  role: "user" | "assistant";
  content: string;
  hasImage?: boolean;
  createdAt: number;
};

/**
 * Teacher-facing formative draft. AI proposes; teacher decides.
 * Intentionally has no grade, score, pass/fail, or outcome decision fields.
 */
export type FormativeRecommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  focus: string;
  recommendation: string;
  evidenceRefs: string[];
};

export type FormativeDraftStatus = "draft" | "approved" | "edited" | "rejected";

export type FormativeDraft = {
  id: string;
  studentId: string;
  activityId: string;
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
  status: FormativeDraftStatus;
  /** Teacher may rewrite before approving; never auto-sent to the student. */
  teacherNotes: string;
  createdAt: number;
  reviewedAt?: number;
};

type Store = {
  misconceptions: Misconception[];
  answers: StudentAnswer[];
  conversations: ConversationTurn[];
  formativeDrafts: FormativeDraft[];
};

const g = globalThis as unknown as { __curicoStore?: Store };
if (!g.__curicoStore) {
  g.__curicoStore = {
    misconceptions: [],
    answers: [],
    conversations: [],
    formativeDrafts: [],
  };
}
// Hot-reload safe: older process shapes may lack newer keys.
const s = g.__curicoStore;
if (!s.conversations) s.conversations = [];
if (!s.formativeDrafts) s.formativeDrafts = [];
export const store: Store = s;
