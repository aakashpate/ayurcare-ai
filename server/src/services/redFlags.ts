interface RedFlagInput {
  severity?: number | null;
  chiefComplaint?: string | null;
  duration?: string | null;
  vitals?: {
    systolicBP?: number | null;
    diastolicBP?: number | null;
    pulse?: number | null;
    temperature?: number | null;
    spo2?: number | null;
  } | null;
  interviewResponses?: Array<{ questionKey: string; response: string }>;
  biomedicalAssessment?: {
    symptoms?: any;
    allergies?: string | null;
    pastMedicalHistory?: string | null;
  } | null;
}

interface RedFlag {
  level: string;
  code: string;
  reason: string;
  sourceField?: string;
  sourceValue?: string;
}

const URGENT_KEYWORDS = [
  'chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious',
  'seizure', 'stroke', 'heart attack', 'anaphylaxis', 'severe allergic',
  'high fever', 'severe headache', 'stiff neck', 'confusion'
];

const ATTENTION_KEYWORDS = [
  'persistent', 'worsening', 'chronic', 'recurrent', 'multiple',
  'family history', 'previous surgery', 'medication'
];

export function generateRedFlags(data: RedFlagInput): RedFlag[] {
  const flags: RedFlag[] = [];

  if (data.severity && data.severity >= 8) {
    flags.push({
      level: 'URGENT',
      code: 'HIGH_SEVERITY',
      reason: `Patient reported high symptom severity (${data.severity}/10)`,
      sourceField: 'severity',
      sourceValue: String(data.severity)
    });
  } else if (data.severity && data.severity >= 6) {
    flags.push({
      level: 'ATTENTION',
      code: 'MODERATE_SEVERITY',
      reason: `Patient reported moderate symptom severity (${data.severity}/10)`,
      sourceField: 'severity',
      sourceValue: String(data.severity)
    });
  }

  if (data.vitals) {
    if (data.vitals.systolicBP && data.vitals.systolicBP > 180) {
      flags.push({
        level: 'URGENT',
        code: 'HYPERTENSIVE_CRISIS',
        reason: `Extremely high systolic blood pressure: ${data.vitals.systolicBP} mmHg`,
        sourceField: 'systolicBP',
        sourceValue: String(data.vitals.systolicBP)
      });
    } else if (data.vitals.systolicBP && data.vitals.systolicBP > 140) {
      flags.push({
        level: 'ATTENTION',
        code: 'HIGH_BP',
        reason: `Elevated systolic blood pressure: ${data.vitals.systolicBP} mmHg`,
        sourceField: 'systolicBP',
        sourceValue: String(data.vitals.systolicBP)
      });
    }

    if (data.vitals.spo2 && data.vitals.spo2 < 90) {
      flags.push({
        level: 'URGENT',
        code: 'LOW_SPO2',
        reason: `Critically low oxygen saturation: ${data.vitals.spo2}%`,
        sourceField: 'spo2',
        sourceValue: String(data.vitals.spo2)
      });
    } else if (data.vitals.spo2 && data.vitals.spo2 < 94) {
      flags.push({
        level: 'ATTENTION',
        code: 'LOW_SPO2_ATTENTION',
        reason: `Low oxygen saturation: ${data.vitals.spo2}%`,
        sourceField: 'spo2',
        sourceValue: String(data.vitals.spo2)
      });
    }

    if (data.vitals.temperature && data.vitals.temperature > 39.5) {
      flags.push({
        level: 'URGENT',
        code: 'HIGH_FEVER',
        reason: `High fever detected: ${data.vitals.temperature}°C`,
        sourceField: 'temperature',
        sourceValue: String(data.vitals.temperature)
      });
    } else if (data.vitals.temperature && data.vitals.temperature > 38) {
      flags.push({
        level: 'ATTENTION',
        code: 'FEVER',
        reason: `Fever detected: ${data.vitals.temperature}°C`,
        sourceField: 'temperature',
        sourceValue: String(data.vitals.temperature)
      });
    }

    if (data.vitals.pulse && (data.vitals.pulse > 120 || data.vitals.pulse < 50)) {
      flags.push({
        level: 'ATTENTION',
        code: 'ABNORMAL_PULSE',
        reason: `Abnormal pulse rate: ${data.vitals.pulse} bpm`,
        sourceField: 'pulse',
        sourceValue: String(data.vitals.pulse)
      });
    }
  }

  if (data.chiefComplaint) {
    const complaintLower = data.chiefComplaint.toLowerCase();
    
    for (const keyword of URGENT_KEYWORDS) {
      if (complaintLower.includes(keyword)) {
        flags.push({
          level: 'URGENT',
          code: 'URGENT_SYMPTOM',
          reason: `Concerning symptom mentioned: "${keyword}"`,
          sourceField: 'chiefComplaint',
          sourceValue: data.chiefComplaint
        });
        break;
      }
    }

    for (const keyword of ATTENTION_KEYWORDS) {
      if (complaintLower.includes(keyword)) {
        flags.push({
          level: 'ATTENTION',
          code: 'ATTENTION_SYMPTOM',
          reason: `Symptom requiring attention: "${keyword}"`,
          sourceField: 'chiefComplaint',
          sourceValue: data.chiefComplaint
        });
        break;
      }
    }
  }

  if (data.biomedicalAssessment?.allergies) {
    const allergyLower = data.biomedicalAssessment.allergies.toLowerCase();
    if (allergyLower.includes('severe') || allergyLower.includes('anaphylaxis')) {
      flags.push({
        level: 'URGENT',
        code: 'SEVERE_ALLERGY',
        reason: 'Severe allergy history noted',
        sourceField: 'allergies',
        sourceValue: data.biomedicalAssessment.allergies
      });
    } else if (data.biomedicalAssessment.allergies.length > 0) {
      flags.push({
        level: 'ATTENTION',
        code: 'ALLERGY_HISTORY',
        reason: 'Allergy history present - verify before prescribing',
        sourceField: 'allergies',
        sourceValue: data.biomedicalAssessment.allergies
      });
    }
  }

  if (flags.length === 0) {
    flags.push({
      level: 'NORMAL',
      code: 'NO_FLAGS',
      reason: 'No immediate safety concerns identified'
    });
  }

  return flags;
}
