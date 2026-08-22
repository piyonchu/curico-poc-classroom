// Client-side demo store for classroom management (localStorage-backed).
// Not production — this is only for the topic-72 PoC demo.

export type Classroom = {
  id: string;
  name: string;
  section: string;
  color: string;
  studentIds: string[];
  activityIds: string[];
  schedule: string;
  messages: { id: string; from: string; text: string; at: number }[];
  createdAt: number;
};

export type Session =
  | { kind: "teacher"; id: "teacher" }
  | { kind: "student"; id: string };

const KEY = "curico.classrooms.v2";
const SESSION_KEY = "curico.session.v1";

const COLORS = ["#4a5cff", "#1a7f3a", "#b0480e", "#8a3ab9", "#0e7c9c", "#c14b7a"];

export const ALL_STUDENTS = ["student-1", "student-2", "student-3", "student-4", "student-5"];

export type ActivityMeta = {
  id: string;
  title: string;
  subject: string;
  gradeBand: string;
  icon: string;
  dueLabel: string;
};

export const ACTIVITY_LIBRARY: ActivityMeta[] = [
  {
    id: "act_vinegar_titration_v2",
    title: "Titration of Vinegar with 0.100 M NaOH",
    subject: "General Chemistry I",
    gradeBand: "First-year undergraduate",
    icon: "🧪",
    dueLabel: "Due Friday",
  },
  {
    id: "act_rainbow_in_a_glass_v1",
    title: "Rainbow in a Glass: Density Layering",
    subject: "Introductory Chemistry — Density",
    gradeBand: "Middle school / early high school",
    icon: "🌈",
    dueLabel: "Due next Monday",
  },
];

export function activityMeta(id: string): ActivityMeta {
  return (
    ACTIVITY_LIBRARY.find((a) => a.id === id) || {
      id,
      title: id,
      subject: "",
      gradeBand: "",
      icon: "📘",
      dueLabel: "",
    }
  );
}

function read(): Classroom[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed();
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function write(list: Classroom[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

function seed(): Classroom[] {
  const initial: Classroom[] = [
    {
      id: "cls_chem101",
      name: "Chemistry 101",
      section: "Section A · Fall 2026",
      color: COLORS[0],
      studentIds: ["student-1", "student-2", "student-3"],
      activityIds: ACTIVITY_LIBRARY.map((a) => a.id),
      schedule: "Mon/Wed 10:00–11:30, Lab Fri 13:00",
      messages: [
        {
          id: "m_seed_1",
          from: "teacher",
          text: "Welcome! Please complete the vinegar titration lab before Friday.",
          at: Date.now() - 1000 * 60 * 60 * 20,
        },
      ],
      createdAt: Date.now() - 1000 * 60 * 60 * 48,
    },
  ];
  write(initial);
  return initial;
}

export function listClassrooms(): Classroom[] {
  return read();
}

export function getClassroom(id: string): Classroom | undefined {
  return read().find((c) => c.id === id);
}

export function classroomsForStudent(studentId: string): Classroom[] {
  return read().filter((c) => c.studentIds.includes(studentId));
}

export function createClassroom(name: string, section: string): Classroom {
  const list = read();
  const c: Classroom = {
    id: "cls_" + Math.random().toString(36).slice(2, 8),
    name,
    section,
    color: COLORS[list.length % COLORS.length],
    studentIds: [],
    activityIds: ACTIVITY_LIBRARY.map((a) => a.id),
    schedule: "TBD",
    messages: [],
    createdAt: Date.now(),
  };
  list.push(c);
  write(list);
  return c;
}

export function updateClassroom(id: string, patch: Partial<Classroom>) {
  const list = read();
  const i = list.findIndex((c) => c.id === id);
  if (i < 0) return;
  list[i] = { ...list[i], ...patch };
  write(list);
}

export function addStudent(id: string, studentId: string) {
  const c = getClassroom(id);
  if (!c) return;
  if (c.studentIds.includes(studentId)) return;
  updateClassroom(id, { studentIds: [...c.studentIds, studentId] });
}

export function removeStudent(id: string, studentId: string) {
  const c = getClassroom(id);
  if (!c) return;
  updateClassroom(id, { studentIds: c.studentIds.filter((s) => s !== studentId) });
}

export function postMessage(id: string, from: string, text: string) {
  const c = getClassroom(id);
  if (!c) return;
  const msg = { id: "m_" + Math.random().toString(36).slice(2, 8), from, text, at: Date.now() };
  updateClassroom(id, { messages: [...c.messages, msg] });
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}
