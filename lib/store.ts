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

type Store = {
  misconceptions: Misconception[];
  answers: StudentAnswer[];
};

const g = globalThis as unknown as { __curicoStore?: Store };
if (!g.__curicoStore) g.__curicoStore = { misconceptions: [], answers: [] };
export const store: Store = g.__curicoStore;
