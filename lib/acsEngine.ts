import { PatientInput, EngineOutput, ACSClassification, RiskAssessment } from "./types";

/**
 * Deterministic rule engine for acute coronary syndrome triage support.
 *
 * This encodes general, well-established principles of contemporary ACS care
 * (ECG-based STEMI/NSTE-ACS separation, troponin-based MI diagnosis, risk-based
 * timing of invasive strategy, guideline-directed medical therapy, secondary
 * prevention and rehabilitation) in the author's own logic and wording. It is
 * a clinical decision SUPPORT tool, not a substitute for full guideline text,
 * institutional protocols, or clinical judgement. Always confirm dosing and
 * eligibility against current local protocols and the treating physician's
 * judgement before acting on any output.
 */

function classify(input: PatientInput): { classification: ACSClassification; rationale: string[] } {
  const rationale: string[] = [];
  const { ecg, troponin } = input;

  const troponinElevated =
    troponin.serial !== "not_done" &&
    troponin.value !== undefined &&
    troponin.upperLimitNormal !== undefined &&
    troponin.value > troponin.upperLimitNormal;

  const dynamicTroponin = troponin.serial === "rising" || troponin.serial === "falling";

  if (ecg.stElevation || ecg.newLBBB) {
    rationale.push(
      ecg.stElevation
        ? `ST elevation reported${ecg.stElevationLeads ? ` in ${ecg.stElevationLeads}` : ""}, consistent with acute transmural ischemia.`
        : "New/presumed-new LBBB reported, treated as a STEMI-equivalent."
    );
    return { classification: "STEMI", rationale };
  }

  if ((ecg.stDepression || ecg.tWaveInversion) && troponinElevated) {
    rationale.push("Ischemic ECG changes (ST depression / T-wave inversion) with elevated troponin.");
    if (dynamicTroponin) rationale.push("Troponin shows a rising/falling pattern supporting an acute myonecrosis process rather than chronic elevation.");
    return { classification: "NSTEMI", rationale };
  }

  if (!ecg.stDepression && !ecg.tWaveInversion && troponinElevated) {
    rationale.push("Troponin above the upper limit of normal without clear ischemic ECG changes; myocardial injury pattern to be correlated clinically for NSTEMI vs non-ACS myocardial injury.");
    return { classification: dynamicTroponin ? "NSTEMI" : "Possible ACS - indeterminate", rationale };
  }

  if ((ecg.stDepression || ecg.tWaveInversion) && !troponinElevated && troponin.serial !== "not_done") {
    rationale.push("Ischemic ECG changes present but troponin not elevated / not dynamic — pattern consistent with unstable angina rather than infarction.");
    return { classification: "Unstable Angina", rationale };
  }

  if (troponin.serial === "not_done") {
    rationale.push("Troponin result not yet available; classification pending biomarker result. Treat as possible ACS until excluded.");
    return { classification: "Possible ACS - indeterminate", rationale };
  }

  rationale.push("No ST elevation, no significant ischemic ECG changes, troponin not elevated.");
  return { classification: "Low likelihood ACS", rationale };
}

function assessRisk(input: PatientInput, classification: ACSClassification): RiskAssessment {
  const r: string[] = [];
  let score = 0;

  if (classification === "STEMI") {
    return {
      label: "Very High / Immediate",
      rationale: ["STEMI (or STEMI-equivalent) mandates immediate reperfusion — treat as a time-critical emergency regardless of other risk markers."],
    };
  }

  const killip = input.vitals?.killipClass ?? 1;
  if (killip >= 3) { score += 3; r.push(`Killip class ${killip} (heart failure / cardiogenic shock signs) — very high risk.`); }
  else if (killip === 2) { score += 1; r.push("Killip class 2 (mild heart failure signs)."); }

  if ((input.vitals?.sbp ?? 120) < 90) { score += 3; r.push("Hypotension (SBP <90 mmHg) — hemodynamic instability."); }
  if ((input.vitals?.hr ?? 80) > 100) { score += 1; r.push("Tachycardia (>100 bpm)."); }

  if (input.ecg.arrhythmia && /vt|vf|ventricular/i.test(input.ecg.arrhythmia)) {
    score += 3; r.push("Hemodynamically significant ventricular arrhythmia reported.");
  }

  if (input.troponin.value !== undefined && input.troponin.upperLimitNormal !== undefined) {
    const ratio = input.troponin.value / input.troponin.upperLimitNormal;
    if (ratio > 10) { score += 2; r.push("Markedly elevated troponin (>10x ULN)."); }
    else if (ratio > 1) { score += 1; r.push("Troponin elevated above ULN."); }
  }

  if (input.echo.lvef !== undefined && input.echo.lvef < 40) { score += 2; r.push(`Reduced LVEF (${input.echo.lvef}%) on echo.`); }
  if (input.echo.mechanicalComplication) { score += 4; r.push(`Mechanical complication noted on echo: ${input.echo.mechanicalComplication}.`); }

  if ((input.age ?? 0) >= 75) { score += 1; r.push("Age ≥75 years."); }
  if (input.riskFactors?.ckd || (input.riskFactors?.egfr ?? 90) < 60) { score += 1; r.push("Renal impairment (eGFR <60 or known CKD)."); }
  if (input.riskFactors?.diabetes) { score += 1; r.push("Diabetes mellitus."); }
  if (input.riskFactors?.priorMI || input.riskFactors?.priorPCI || input.riskFactors?.priorCABG) {
    score += 1; r.push("Prior coronary disease / revascularization.");
  }
  if ((input.ecg.stDepression && classification !== "Low likelihood ACS")) { score += 1; r.push("New or dynamic ST depression."); }
  if ((input.onsetHours ?? 99) < 2 && classification !== "Low likelihood ACS") { score += 1; r.push("Recent symptom onset (<2h)."); }

  if (score >= 7) return { label: "Very High / Immediate", rationale: r.length ? r : ["Multiple high-risk features."] };
  if (score >= 4) return { label: "High", rationale: r };
  if (score >= 2) return { label: "Intermediate", rationale: r };
  return { label: "Low", rationale: r.length ? r : ["No major high-risk features identified from the data provided."] };
}

function redFlags(input: PatientInput): string[] {
  const flags: string[] = [];
  if ((input.vitals?.sbp ?? 120) < 90) flags.push("Hypotension / possible cardiogenic shock — assess for urgent hemodynamic support and mechanical complications.");
  if ((input.vitals?.spo2 ?? 98) < 90) flags.push("Hypoxia — assess for pulmonary edema / respiratory failure.");
  if (input.ecg.arrhythmia && /vt|vf|ventricular|heart block|av block/i.test(input.ecg.arrhythmia)) {
    flags.push(`Malignant arrhythmia / high-grade block reported (${input.ecg.arrhythmia}) — continuous monitoring and arrhythmia management protocol.`);
  }
  if (input.echo.mechanicalComplication) flags.push(`Possible mechanical complication (${input.echo.mechanicalComplication}) — urgent cardiothoracic surgery/CCU input.`);
  if ((input.vitals?.killipClass ?? 1) >= 3) flags.push("Killip class ≥3 — pulmonary edema / cardiogenic shock, escalate care level.");
  if (/syncope|cardiac arrest/i.test(input.complaints)) flags.push("History of syncope or cardiac arrest — high risk for malignant arrhythmia, consider continuous ECG monitoring and early risk assessment.");
  return flags;
}

function buildRecommendations(input: PatientInput, classification: ACSClassification, risk: RiskAssessment): Omit<EngineOutput, "classification" | "classificationRationale" | "risk" | "redFlags"> {
  const investigations: string[] = [
    "12-lead ECG within 10 minutes of first contact; repeat at 15–30 min if initial non-diagnostic and clinical suspicion persists.",
    "Serial high-sensitivity troponin (0h/1h or 0h/2h protocol per local assay) if not already dynamic.",
    "Baseline bloods: CBC, renal function/electrolytes, lipid profile, HbA1c/fasting glucose, coagulation profile.",
    "Chest X-ray to assess for pulmonary congestion and alternative diagnoses.",
    "Transthoracic echocardiography for LV function, regional wall motion, and mechanical complications if not already done.",
  ];
  if (!input.echo.done) investigations.push("Echocardiogram not yet documented — recommend prior to discharge if inpatient, to guide LVEF-based therapy (MRA, ICD referral timing) and rehab intensity.");

  const immediateManagement: string[] = [
    "Continuous ECG and hemodynamic monitoring in an appropriately staffed area (CCU/HDU per risk).",
    "Supplemental oxygen only if SpO2 <90% or respiratory distress.",
    "Sublingual/IV nitrates for ongoing ischemic pain if SBP allows and no right ventricular infarction or PDE-5 inhibitor use.",
    "Adequate analgesia for ongoing chest pain.",
  ];

  const antithrombotic: string[] = [
    "Aspirin loading dose followed by low-dose maintenance, unless contraindicated.",
    "P2Y12 inhibitor (preferentially a potent agent — ticagrelor or prasugrel — over clopidogrel where no contraindication and invasive strategy planned) as part of dual antiplatelet therapy.",
    "Parenteral anticoagulation (e.g., unfractionated heparin or a low-molecular-weight heparin) per weight-based/renal-adjusted protocol until revascularization or clinical stabilization.",
  ];
  if (input.riskFactors?.ckd || (input.riskFactors?.egfr ?? 90) < 30) {
    antithrombotic.push("Significant renal impairment noted — adjust anticoagulant/antiplatelet choice and dosing accordingly and favor agents with established safety data in this eGFR range.");
  }
  if (input.allergiesOrContraindications) {
    antithrombotic.push(`Documented allergy/contraindication on file ("${input.allergiesOrContraindications}") — review before finalizing antithrombotic regimen.`);
  }

  const reperfusionOrInvasiveStrategy: string[] = [];
  if (classification === "STEMI") {
    reperfusionOrInvasiveStrategy.push(
      "Primary PCI is the preferred reperfusion strategy if it can be delivered within the guideline-recommended first-medical-contact-to-device time at a PCI-capable center.",
      "If timely primary PCI is not achievable, fibrinolytic therapy should be considered (absent contraindications), with transfer to a PCI-capable center for early angiography (pharmaco-invasive strategy).",
      "Door-to-balloon / first-medical-contact-to-device time should be tracked and minimized; do not delay reperfusion for troponin results in a clear STEMI."
    );
  } else if (classification === "NSTEMI" || classification === "Unstable Angina" || classification === "Possible ACS - indeterminate") {
    if (risk.label === "Very High / Immediate") {
      reperfusionOrInvasiveStrategy.push("Immediate invasive strategy (<2h) — ongoing ischemia, hemodynamic/electrical instability, or mechanical complication present.");
    } else if (risk.label === "High") {
      reperfusionOrInvasiveStrategy.push("Early invasive strategy, generally within 24h of presentation, given high-risk features.");
    } else if (risk.label === "Intermediate") {
      reperfusionOrInvasiveStrategy.push("Invasive strategy within approximately 24–72h is reasonable; a selective/ischemia-guided approach can be considered if risk remains intermediate after further workup.");
    } else {
      reperfusionOrInvasiveStrategy.push("An ischemia-guided (non-invasive risk stratification, e.g., stress testing or CT coronary angiography) approach may be reasonable if the diagnosis remains uncertain and risk features are low, with invasive assessment reserved for recurrent symptoms or positive non-invasive testing.");
    }
  } else {
    reperfusionOrInvasiveStrategy.push("No indication for emergent reperfusion/invasive strategy based on current data; reassess if symptoms recur or investigations change.");
  }

  const secondaryPrevention: string[] = [
    "High-intensity statin therapy for all ACS patients regardless of baseline LDL, with a target LDL-C <55 mg/dL (or per current local target) and add-on non-statin therapy (ezetimibe ± PCSK9 inhibitor) if target not met.",
    "Beta-blocker initiation, particularly with reduced LVEF, titrated as hemodynamically tolerated.",
    "ACE inhibitor (or ARB if intolerant) for LVEF ≤40%, hypertension, diabetes, or CKD, titrated to target dose.",
    "Mineralocorticoid receptor antagonist if LVEF ≤40% with either diabetes or heart failure, provided renal function and potassium allow.",
    "Dual antiplatelet therapy typically continued for 12 months post-ACS in the absence of high bleeding risk, with individualized shortening or extension based on ischemic vs bleeding risk (consider validated bleeding-risk tools).",
    "Structured risk-factor modification: smoking cessation support, blood pressure control, diabetes optimization, weight and dietary counseling.",
  ];
  if (input.riskFactors?.diabetes) secondaryPrevention.push("Consider an SGLT2 inhibitor and/or GLP-1 receptor agonist for cardiovascular risk reduction in diabetes, once stable.");
  if (input.echo.lvef !== undefined && input.echo.lvef <= 35) secondaryPrevention.push("LVEF ≤35% at 40 days post-MI on optimal medical therapy — reassess for primary-prevention ICD eligibility.");

  const shortTermPlan: string[] = [
    "Inpatient monitoring until pain-free, hemodynamically stable, and biomarker trend confirmed.",
    "Finalize revascularization plan (culprit-vessel and, where appropriate, staged complete revascularization for multivessel disease).",
    "Initiate/uptitrate guideline-directed medical therapy as above before discharge.",
    "Pre-discharge echocardiogram (if not already done) to finalize LVEF-based therapy decisions.",
    "Patient and family education on symptom recognition, medication adherence, and when to seek emergency care.",
  ];

  const longTermPlan: string[] = [
    "Outpatient follow-up within 1–2 weeks of discharge, then at 4–6 weeks and 3 months to review symptoms, medication tolerance/titration, and labs (lipids, renal function).",
    "Repeat echocardiography at approximately 6–12 weeks if LVEF was reduced at index event, to reassess for ICD eligibility and recovery.",
    "Annual cardiovascular risk review, lipid and glycemic monitoring, and reinforcement of lifestyle measures.",
    "Ongoing shared decision-making regarding DAPT duration and long-term antithrombotic strategy at follow-up visits.",
  ];

  const rehabilitation: string[] = [
    "Referral to a structured cardiac rehabilitation program (exercise training, education, psychosocial support) — this is a strong, evidence-based recommendation for all ACS patients able to participate.",
    "Individualized exercise prescription following risk stratification (e.g., low-level activity progressing to formal aerobic training over 4–12 weeks).",
    "Screen for depression/anxiety, which are common post-ACS and affect adherence and outcomes; refer for psychological support if indicated.",
    "Address occupational/driving advice and return-to-work timeline based on residual LV function, arrhythmia risk, and job demands.",
  ];

  const followUp: string[] = [
    "Confirm outpatient cardiology follow-up appointment before discharge.",
    "Ensure medication reconciliation and a written discharge plan (drugs, doses, indications, and duration for DAPT) is given to the patient.",
    "Provide clear safety-netting advice: symptoms requiring immediate re-presentation.",
  ];

  return { investigations, immediateManagement, antithrombotic, reperfusionOrInvasiveStrategy, secondaryPrevention, shortTermPlan, longTermPlan, rehabilitation, followUp };
}

export function runACSEngine(input: PatientInput): EngineOutput {
  const { classification, rationale } = classify(input);
  const risk = assessRisk(input, classification);
  const flags = redFlags(input);
  const rest = buildRecommendations(input, classification, risk);
  return { classification, classificationRationale: rationale, risk, redFlags: flags, ...rest };
}
