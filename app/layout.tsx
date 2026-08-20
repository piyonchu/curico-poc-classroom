import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Curico Classroom PoC",
  description: "Student hands-on interface with Socratic AI (RAG-grounded)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
