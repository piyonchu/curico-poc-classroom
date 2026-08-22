"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/classroom";

export default function IndexPage() {
  const router = useRouter();
  useEffect(() => {
    const s = getSession();
    if (!s) router.replace("/login");
    else if (s.kind === "teacher") router.replace("/teacher-home");
    else router.replace("/student-home");
  }, [router]);
  return null;
}
