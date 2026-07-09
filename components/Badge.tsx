"use client";

const styles: Record<string, string> = {
  STEMI: "bg-stemi text-white",
  NSTEMI: "bg-nstemi text-white",
  "Unstable Angina": "bg-ua text-white",
  "Possible ACS - indeterminate": "bg-ink/70 text-white",
  "Low likelihood ACS": "bg-stable text-white",
  Low: "bg-stable text-white",
  Intermediate: "bg-ua text-white",
  High: "bg-nstemi text-white",
  "Very High / Immediate": "bg-artery text-white",
};

export default function Badge({ label }: { label: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${styles[label] ?? "bg-ink text-white"}`}>
      {label}
    </span>
  );
}
