"use client";

import { useState } from "react";
import { PatientInput, EngineOutput } from "@/lib/types";
import PatientForm from "@/components/PatientForm";
import ResultPanel from "@/components/ResultPanel";
import QueryBot from "@/components/QueryBot";

interface AssessResult {
  engineOutput: EngineOutput;
  narrative: string;
  caseId: string | null;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessResult | null>(null);
  const [lastInput, setLastInput] = useState<PatientInput | null>(null);

  async function handleSubmit(input: PatientInput) {
    setLoading(true);
    setError(null);
    setResult(null);
    setLastInput(input);
    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Request failed");
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-vein">ACS Copilot</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Acute Coronary Syndrome Decision Support</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/60">
          Enter complaints, examination findings, ECG, troponin, echo and other data to generate a
          structured triage classification, risk tier, and investigation / treatment / rehabilitation
          plan. Decision support only — always apply clinical judgement.
        </p>
      </header>

      <PatientForm onSubmit={handleSubmit} loading={loading} />

      {error && <p className="mt-6 rounded-md bg-artery/10 p-3 text-sm text-artery">{error}</p>}

      {result && (
        <div className="mt-10 space-y-6">
          <ResultPanel result={result} />
          {lastInput && <QueryBot input={lastInput} engineOutput={result.engineOutput} narrative={result.narrative} />}
        </div>
      )}
    </main>
  );
}
