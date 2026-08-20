import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    misconceptions: [...store.misconceptions].sort(
      (a, b) => b.createdAt - a.createdAt,
    ),
    answers: [...store.answers].sort((a, b) => b.createdAt - a.createdAt),
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    studentId: string;
    stepId: string;
    kind: "text" | "number" | "choice" | "photo";
    value: string;
  };
  store.answers.push({ ...body, createdAt: Date.now() });
  return NextResponse.json({ ok: true });
}
