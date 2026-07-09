"use client";

import { useState } from "react";
import { PatientInput } from "@/lib/types";

const emptyInput: PatientInput = {
  age: undefined,
  sex: undefined,
  complaints: "",
  onsetHours: undefined,
  vitals: {},
  examinationFindings: "",
  riskFactors: {},
  ecg: { stElevation: false, newLBBB: false, stDepression: false, tWaveInversion: false },
  troponin: { serial: "not_done" },
  echo: { done: false },
  otherInvestigations: "",
  currentMedications: "",
  allergiesOrContraindications: "",
};

export default function PatientForm({ onSubmit, loading }: { onSubmit: (input: PatientInput) => void; loading: boolean }) {
  const [input, setInput] = useState<PatientInput>(emptyInput);

  const update = (patch: Partial<PatientInput>) => setInput((prev) => ({ ...prev, ...patch }));
  const updateVitals = (patch: Partial<NonNullable<PatientInput["vitals"]>>) =>
    setInput((prev) => ({ ...prev, vitals: { ...prev.vitals, ...patch } }));
  const updateRisk = (patch: Partial<NonNullable<PatientInput["riskFactors"]>>) =>
    setInput((prev) => ({ ...prev, riskFactors: { ...prev.riskFactors, ...patch } }));
  const updateEcg = (patch: Partial<PatientInput["ecg"]>) => setInput((prev) => ({ ...prev, ecg: { ...prev.ecg, ...patch } }));
  const updateTroponin = (patch: Partial<PatientInput["troponin"]>) =>
    setInput((prev) => ({ ...prev, troponin: { ...prev.troponin, ...patch } }));
  const updateEcho = (patch: Partial<PatientInput["echo"]>) => setInput((prev) => ({ ...prev, echo: { ...prev.echo, ...patch } }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(input);
      }}
      className="space-y-5"
    >
      <div className="section-card grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="field-label">Age</label>
          <input type="number" className="field-input" value={input.age ?? ""} onChange={(e) => update({ age: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
        <div>
          <label className="field-label">Sex</label>
          <select className="field-input" value={input.sex ?? ""} onChange={(e) => update({ sex: (e.target.value || undefined) as PatientInput["sex"] })}>
            <option value="">—</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="field-label">Symptom onset (hours ago)</label>
          <input type="number" step="0.5" className="field-input" value={input.onsetHours ?? ""} onChange={(e) => update({ onsetHours: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
        <div>
          <label className="field-label">Killip class</label>
          <select className="field-input" value={input.vitals?.killipClass ?? ""} onChange={(e) => updateVitals({ killipClass: e.target.value ? (Number(e.target.value) as 1 | 2 | 3 | 4) : undefined })}>
            <option value="">—</option>
            <option value="1">I — no failure</option>
            <option value="2">II — mild HF</option>
            <option value="3">III — pulmonary edema</option>
            <option value="4">IV — cardiogenic shock</option>
          </select>
        </div>
      </div>

      <div className="section-card">
        <label className="field-label">Chief complaints *</label>
        <textarea required className="field-textarea" placeholder="e.g. Central chest pain, 45 min, radiating to left arm, associated sweating and breathlessness" value={input.complaints} onChange={(e) => update({ complaints: e.target.value })} />
      </div>

      <div className="section-card">
        <label className="field-label">Examination findings *</label>
        <textarea required className="field-textarea" placeholder="e.g. BP 110/70, HR 96, bibasal crepitations, S3 present, no murmur" value={input.examinationFindings} onChange={(e) => update({ examinationFindings: e.target.value })} />
      </div>

      <div className="section-card grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div><label className="field-label">SBP</label><input type="number" className="field-input" value={input.vitals?.sbp ?? ""} onChange={(e) => updateVitals({ sbp: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div><label className="field-label">DBP</label><input type="number" className="field-input" value={input.vitals?.dbp ?? ""} onChange={(e) => updateVitals({ dbp: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div><label className="field-label">HR</label><input type="number" className="field-input" value={input.vitals?.hr ?? ""} onChange={(e) => updateVitals({ hr: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div><label className="field-label">RR</label><input type="number" className="field-input" value={input.vitals?.rr ?? ""} onChange={(e) => updateVitals({ rr: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div><label className="field-label">SpO2 %</label><input type="number" className="field-input" value={input.vitals?.spo2 ?? ""} onChange={(e) => updateVitals({ spo2: e.target.value ? Number(e.target.value) : undefined })} /></div>
      </div>

      <div className="section-card">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/60">ECG</p>
        <div className="mb-3 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={input.ecg.stElevation} onChange={(e) => updateEcg({ stElevation: e.target.checked })} /> ST elevation</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={input.ecg.newLBBB} onChange={(e) => updateEcg({ newLBBB: e.target.checked })} /> New LBBB</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={input.ecg.stDepression} onChange={(e) => updateEcg({ stDepression: e.target.checked })} /> ST depression</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={input.ecg.tWaveInversion} onChange={(e) => updateEcg({ tWaveInversion: e.target.checked })} /> T-wave inversion</label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input className="field-input" placeholder="ST elevation leads (e.g. II, III, aVF)" value={input.ecg.stElevationLeads ?? ""} onChange={(e) => updateEcg({ stElevationLeads: e.target.value })} />
          <input className="field-input" placeholder="Arrhythmia (if any)" value={input.ecg.arrhythmia ?? ""} onChange={(e) => updateEcg({ arrhythmia: e.target.value })} />
          <input className="field-input" placeholder="Other ECG findings" value={input.ecg.otherFindings ?? ""} onChange={(e) => updateEcg({ otherFindings: e.target.value })} />
        </div>
      </div>

      <div className="section-card">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/60">Troponin</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div><label className="field-label">Value</label><input type="number" step="0.01" className="field-input" value={input.troponin.value ?? ""} onChange={(e) => updateTroponin({ value: e.target.value ? Number(e.target.value) : undefined })} /></div>
          <div><label className="field-label">Unit</label>
            <select className="field-input" value={input.troponin.unit ?? ""} onChange={(e) => updateTroponin({ unit: (e.target.value || undefined) as any })}>
              <option value="">—</option><option value="ng/L">ng/L</option><option value="ng/mL">ng/mL</option>
            </select>
          </div>
          <div><label className="field-label">Upper limit normal</label><input type="number" step="0.01" className="field-input" value={input.troponin.upperLimitNormal ?? ""} onChange={(e) => updateTroponin({ upperLimitNormal: e.target.value ? Number(e.target.value) : undefined })} /></div>
          <div><label className="field-label">Pattern</label>
            <select className="field-input" value={input.troponin.serial} onChange={(e) => updateTroponin({ serial: e.target.value as any })}>
              <option value="not_done">Not done</option><option value="single">Single value</option><option value="rising">Rising</option><option value="falling">Falling</option><option value="flat">Flat / stable</option>
            </select>
          </div>
          <div><label className="field-label">Assay</label>
            <select className="field-input" value={input.troponin.assay ?? ""} onChange={(e) => updateTroponin({ assay: (e.target.value || undefined) as any })}>
              <option value="">—</option><option value="high_sensitivity">High-sensitivity</option><option value="conventional">Conventional</option>
            </select>
          </div>
        </div>
      </div>

      <div className="section-card">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/60">Echocardiogram</p>
        <label className="mb-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={input.echo.done} onChange={(e) => updateEcho({ done: e.target.checked })} /> Echo performed</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div><label className="field-label">LVEF %</label><input type="number" className="field-input" value={input.echo.lvef ?? ""} onChange={(e) => updateEcho({ lvef: e.target.value ? Number(e.target.value) : undefined })} /></div>
          <input className="field-input sm:col-span-3" placeholder="RWMA / valvular / mechanical complication / other findings" value={input.echo.rwma ?? ""} onChange={(e) => updateEcho({ rwma: e.target.value })} />
        </div>
        <input className="field-input mt-3" placeholder="Mechanical complication, if any (e.g. VSD, papillary muscle rupture, free wall rupture)" value={input.echo.mechanicalComplication ?? ""} onChange={(e) => updateEcho({ mechanicalComplication: e.target.value })} />
      </div>

      <div className="section-card">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/60">Risk factors & history</p>
        <div className="flex flex-wrap gap-4 text-sm">
          {([
            ["diabetes", "Diabetes"], ["hypertension", "Hypertension"], ["dyslipidemia", "Dyslipidemia"],
            ["smoking", "Smoking"], ["familyHistory", "Family history"], ["priorMI", "Prior MI"],
            ["priorPCI", "Prior PCI"], ["priorCABG", "Prior CABG"], ["ckd", "CKD"],
          ] as [keyof NonNullable<PatientInput["riskFactors"]>, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input type="checkbox" checked={!!input.riskFactors?.[key]} onChange={(e) => updateRisk({ [key]: e.target.checked } as any)} /> {label}
            </label>
          ))}
        </div>
        <div className="mt-3 w-40">
          <label className="field-label">eGFR</label>
          <input type="number" className="field-input" value={input.riskFactors?.egfr ?? ""} onChange={(e) => updateRisk({ egfr: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
      </div>

      <div className="section-card grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="field-label">Other investigations</label>
          <textarea className="field-textarea" placeholder="CXR, labs, coronary angiography findings, etc." value={input.otherInvestigations} onChange={(e) => update({ otherInvestigations: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Current medications</label>
          <textarea className="field-textarea" value={input.currentMedications} onChange={(e) => update({ currentMedications: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Allergies / contraindications</label>
          <textarea className="field-textarea" value={input.allergiesOrContraindications} onChange={(e) => update({ allergiesOrContraindications: e.target.value })} />
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full rounded-md bg-vein py-3 text-sm font-semibold text-white transition hover:bg-vein/90 disabled:opacity-50 sm:w-auto sm:px-8">
        {loading ? "Analyzing…" : "Run ACS Assessment"}
      </button>
    </form>
  );
}
