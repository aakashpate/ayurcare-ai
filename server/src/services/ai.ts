interface ClinicalData {
  patient: {
    fullName: string;
    age: number;
    gender: string;
  };
  chiefComplaint?: string | null;
  duration?: string | null;
  severity?: number | null;
  biomedicalAssessment?: any;
  ayurvedicAssessment?: any;
  vitals?: any;
  interviewResponses?: Array<{
    questionKey: string;
    questionText: string;
    response: string;
  }>;
  redFlags?: Array<{
    level: string;
    reason: string;
  }>;
}

interface AIProvider {
  generateClinicalSummary(data: ClinicalData): Promise<string>;
  normalizePatientResponse(text: string, language: string): Promise<string>;
  classifyComplaint(complaint: string): Promise<string[]>;
  translatePatientText(text: string, from: string, to: string): Promise<string>;
}

class MockAIProvider implements AIProvider {
  async generateClinicalSummary(data: ClinicalData): Promise<string> {
    const sections: string[] = [];

    sections.push(`## AI-GENERATED CLINICAL SUMMARY`);
    sections.push(`**REVIEW REQUIRED BY QUALIFIED PRACTITIONER**\n`);

    sections.push(`### Patient Information`);
    sections.push(`- Name: ${data.patient.fullName}`);
    sections.push(`- Age: ${data.patient.age} years`);
    sections.push(`- Gender: ${data.patient.gender}`);
    sections.push(`- Visit Date: ${new Date().toLocaleDateString()}\n`);

    if (data.chiefComplaint) {
      sections.push(`### Chief Complaint`);
      sections.push(`${data.chiefComplaint}`);
      if (data.duration) sections.push(`Duration: ${data.duration}`);
      if (data.severity) sections.push(`Severity: ${data.severity}/10`);
      sections.push('');
    }

    if (data.interviewResponses && data.interviewResponses.length > 0) {
      sections.push(`### History of Present Illness`);
      for (const resp of data.interviewResponses) {
        sections.push(`- ${resp.questionText}: ${resp.response}`);
      }
      sections.push('');
    }

    if (data.biomedicalAssessment) {
      sections.push(`### Biomedical Assessment`);
      const b = data.biomedicalAssessment;
      if (b.pastMedicalHistory) sections.push(`Past History: ${b.pastMedicalHistory}`);
      if (b.medications) sections.push(`Current Medications: ${b.medications}`);
      if (b.allergies) sections.push(`Allergies: ${b.allergies}`);
      if (b.familyHistory) sections.push(`Family History: ${b.familyHistory}`);
      if (b.examinationFindings) sections.push(`Examination: ${b.examinationFindings}`);
      sections.push('');
    }

    if (data.vitals) {
      sections.push(`### Vital Signs`);
      const v = data.vitals;
      if (v.systolicBP && v.diastolicBP) sections.push(`BP: ${v.systolicBP}/${v.diastolicBP} mmHg`);
      if (v.pulse) sections.push(`Pulse: ${v.pulse} bpm`);
      if (v.temperature) sections.push(`Temperature: ${v.temperature}°C`);
      if (v.weight) sections.push(`Weight: ${v.weight} kg`);
      if (v.spo2) sections.push(`SpO2: ${v.spo2}%`);
      sections.push('');
    }

    if (data.redFlags && data.redFlags.length > 0) {
      sections.push(`### Safety Flags`);
      for (const flag of data.redFlags) {
        sections.push(`- [${flag.level}] ${flag.reason}`);
      }
      sections.push('');
    }

    sections.push(`### Missing Information`);
    const missing: string[] = [];
    if (!data.vitals) missing.push('Vital signs not yet recorded');
    if (!data.interviewResponses || data.interviewResponses.length < 3) missing.push('Limited interview responses collected');
    if (!data.biomedicalAssessment) missing.push('Biomedical assessment not completed');
    if (missing.length > 0) {
      for (const m of missing) sections.push(`- ${m}`);
    } else {
      sections.push('- No significant missing information');
    }
    sections.push('');

    sections.push(`---`);
    sections.push(`*AI GENERATED — PHYSICIAN REVIEW REQUIRED*`);
    sections.push(`*This summary was AI-generated and requires review by a qualified healthcare practitioner.*`);

    return sections.join('\n');
  }

  async normalizePatientResponse(text: string, _language: string): Promise<string> {
    return text.trim();
  }

  async classifyComplaint(complaint: string): Promise<string[]> {
    const categories: string[] = [];
    const lower = complaint.toLowerCase();

    if (lower.includes('head') || lower.includes('migraine')) categories.push('neurological');
    if (lower.includes('chest') || lower.includes('heart')) categories.push('cardiovascular');
    if (lower.includes('stomach') || lower.includes('abdomen') || lower.includes('digest')) categories.push('gastrointestinal');
    if (lower.includes('joint') || lower.includes('bone') || lower.includes('muscle')) categories.push('musculoskeletal');
    if (lower.includes('skin') || lower.includes('rash')) categories.push('dermatological');
    if (lower.includes('breath') || lower.includes('cough') || lower.includes('lung')) categories.push('respiratory');
    if (lower.includes('fever') || lower.includes('infection')) categories.push('infectious');

    return categories.length > 0 ? categories : ['general'];
  }

  async translatePatientText(text: string, _from: string, _to: string): Promise<string> {
    return `[Translated] ${text}`;
  }
}

class OpenAIProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateClinicalSummary(data: ClinicalData): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a clinical documentation assistant for AYUSH healthcare. Summarize the provided patient encounter data in a structured format. Do NOT diagnose, prescribe, recommend treatments, or make speculative conclusions about dosha/vikriti. Mark missing information explicitly. All output requires clinician review. Always include "AI GENERATED — PHYSICIAN REVIEW REQUIRED" at the top.`
            },
            {
              role: 'user',
              content: `Generate a clinical summary for this encounter:\n${JSON.stringify(data, null, 2)}`
            }
          ],
          temperature: 0.3
        })
      });

      const result = await response.json() as any;
      return result.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('AI service unavailable');
    }
  }

  async normalizePatientResponse(text: string, _language: string): Promise<string> {
    return text.trim();
  }

  async classifyComplaint(complaint: string): Promise<string[]> {
    const categories: string[] = [];
    const lower = complaint.toLowerCase();

    if (lower.includes('head') || lower.includes('migraine')) categories.push('neurological');
    if (lower.includes('chest') || lower.includes('heart')) categories.push('cardiovascular');
    if (lower.includes('stomach') || lower.includes('abdomen') || lower.includes('digest')) categories.push('gastrointestinal');
    if (lower.includes('joint') || lower.includes('bone') || lower.includes('muscle')) categories.push('musculoskeletal');
    if (lower.includes('skin') || lower.includes('rash')) categories.push('dermatological');
    if (lower.includes('breath') || lower.includes('cough') || lower.includes('lung')) categories.push('respiratory');
    if (lower.includes('fever') || lower.includes('infection')) categories.push('infectious');

    return categories.length > 0 ? categories : ['general'];
  }

  async translatePatientText(text: string, _from: string, _to: string): Promise<string> {
    return text;
  }
}

let aiProvider: AIProvider;

export function getAIProvider(): AIProvider {
  if (!aiProvider) {
    const provider = process.env.AI_PROVIDER || 'mock';
    const apiKey = process.env.OPENAI_API_KEY;

    if (provider === 'openai' && apiKey) {
      aiProvider = new OpenAIProvider(apiKey);
    } else {
      aiProvider = new MockAIProvider();
    }
  }
  return aiProvider;
}

export async function generateClinicalSummary(data: ClinicalData): Promise<string> {
  const provider = getAIProvider();
  return provider.generateClinicalSummary(data);
}

export async function normalizePatientResponse(text: string, language: string): Promise<string> {
  const provider = getAIProvider();
  return provider.normalizePatientResponse(text, language);
}

export async function classifyComplaint(complaint: string): Promise<string[]> {
  const provider = getAIProvider();
  return provider.classifyComplaint(complaint);
}

export async function translatePatientText(text: string, from: string, to: string): Promise<string> {
  const provider = getAIProvider();
  return provider.translatePatientText(text, from, to);
}
