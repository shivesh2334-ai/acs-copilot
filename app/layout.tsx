import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACS Copilot — Acute Coronary Syndrome Decision Support",
  description:
    "Structured triage, risk stratification, and guideline-directed management support for acute coronary syndromes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
