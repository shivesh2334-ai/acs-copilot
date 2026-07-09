export interface ECGInput {
  stElevation: boolean;
  stElevationLeads?: string;
  newLBBB: boolean;
  stDepression: boolean;
  tWaveInversion: boolean;
  arrhythmia?: string;
  otherFindings?: string;
}

export interface TroponinInput {
  value?: number;
  unit?: "ng/L" | "ng/mL";
  upperLimitNormal?: number;
  serial: "single" | "rising" | "falling" | "flat" | "not_done";
  assay?: "high_sensitivity" | "conventional";
}

export interface EchoInput {
  done: boolean;
  lvef?: number;
  rwma?: string;
  valvular?: string;
  mechanicalComplication?: string;
  other?: string;
}

export interface PatientInput {
  age?: number;
  sex?: "male" | "female" | "other";
  complaints: string;
  onsetHours?: number;
  vitals?: {
    sbp?: number;
    dbp?: number;
    hr?: number;
    rr?: number;
    spo2?: number;
    killipClass?: 1 | 2 | 3 | 4;
  };
  examinationFindings: string;
  riskFactors?: {
    diabetes?: boolean;
    hypertension?: boolean;
    dyslipidemia?: boolean;
    smoking?: boolean;
    familyHistory?: boolean;
    priorMI?: boolean;
    priorPCI?: boolean;
    priorCABG?: boolean;
    ckd?: boolean;
    egfr?: number;
  };
  ecg: ECGInput;
  troponin: TroponinInput;
  echo: EchoInput;
  otherInvestigations?: string;
  currentMedications?: string;
  allergiesOrContraindications?: string;
}

export type ACSClassification =
  | "STEMI"
  | "NSTEMI"
  | "Unstable Angina"
  | "Possible ACS - indeterminate"
  | "Low likelihood ACS";

export interface RiskAssessment {
  label: "Low" | "Intermediate" | "High" | "Very High / Immediate";
  rationale: string[];
}

export interface EngineOutput {
  classification: ACSClassification;
  classificationRationale: string[];
  risk: RiskAssessment;
  redFlags: string[];
  investigations: string[];
  immediateManagement: string[];
  antithrombotic: string[];
  reperfusionOrInvasiveStrategy: string[];
  secondaryPrevention: string[];
  shortTermPlan: string[];
  longTermPlan: string[];
  rehabilitation: string[];
  followUp: string[];
}
