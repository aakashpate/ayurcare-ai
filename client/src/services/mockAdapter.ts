import { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';

let patientCounter = 1000;
let encounterCounter = 1000;
let followUpCounter = 1000;

function genId(prefix: string, counter: number) {
  return `${prefix}-${String(counter).padStart(4, '0')}`;
}

function genPatientCode() {
  return `AYU-2026-${String(++patientCounter).padStart(4, '0')}`;
}

function delay(ms = 150) {
  return new Promise(r => setTimeout(r, ms));
}

const DEMO_PATIENTS: any[] = [];
const DEMO_ENCOUNTERS: Record<string, any> = {};

const INTERVIEW_QUESTIONS = [
  { key: 'chiefComplaint', text: 'What is your main health concern today?', type: 'text', required: true, category: 'Chief Complaint' },
  { key: 'duration', text: 'How long have you been experiencing this?', type: 'text', required: true, category: 'Chief Complaint' },
  { key: 'severity', text: 'On a scale of 1-10, how severe is your discomfort?', type: 'number', required: true, category: 'Chief Complaint' },
  { key: 'onset', text: 'When did this problem start? Was it sudden or gradual?', type: 'text', required: false, category: 'History' },
  { key: 'location', text: 'Where exactly do you feel the discomfort?', type: 'text', required: false, category: 'History' },
  { key: 'quality', text: 'How would you describe the nature of your discomfort?', type: 'select', options: ['Sharp', 'Dull', 'Aching', 'Burning', 'Throbbing', 'Cramping'], required: false, category: 'History' },
  { key: 'associatedSymptoms', text: 'Do you have any other symptoms? (nausea, fever, fatigue, etc.)', type: 'text', required: false, category: 'Associated Symptoms' },
  { key: 'aggravating', text: 'What makes the symptoms worse?', type: 'text', required: false, category: 'Aggravating Factors' },
  { key: 'relieving', text: 'What provides relief from the symptoms?', type: 'text', required: false, category: 'Relieving Factors' },
  { key: 'diet', text: 'Describe your typical daily diet.', type: 'text', required: false, category: 'Lifestyle' },
  { key: 'sleep', text: 'How is your sleep pattern?', type: 'text', required: false, category: 'Lifestyle' },
  { key: 'stress', text: 'What is your current stress level?', type: 'text', required: false, category: 'Lifestyle' },
  { key: 'bowelMovements', text: 'Describe your bowel movement pattern.', type: 'text', required: false, category: 'Ayurvedic Assessment' },
  { key: 'prakriti', text: 'Do you know your Ayurvedic body constitution?', type: 'select', options: ['Vata', 'Pitta', 'Kapha', 'Mixed', 'Unknown'], required: false, category: 'Ayurvedic Assessment' },
  { key: 'tongueCoating', text: 'Do you notice any coating on your tongue?', type: 'text', required: false, category: 'Ayurvedic Assessment' },
  { key: 'previousMedications', text: 'Are you currently taking any medications or supplements?', type: 'text', required: false, category: 'Medical History' },
  { key: 'allergies', text: 'Do you have any known allergies?', type: 'text', required: false, category: 'Medical History' },
  { key: 'familyHistory', text: 'Any significant health conditions in your family?', type: 'text', required: false, category: 'Medical History' },
];

function makeResponse<T>(data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };
}

function makeError(status: number, message: string) {
  return { response: { status, data: { message } } };
}

const mockAdapter: AxiosAdapter = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
  await delay(150);

  const method = (config.method || 'get').toUpperCase();
  const url = config.url || '';
  const data = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : undefined;
  const params = config.params;

  // POST /auth/login
  if (method === 'POST' && url === '/auth/login') {
    const DEMO: Record<string, any> = {
      'admin@ayurcare.ai': { id: '1', name: 'Admin User', email: 'admin@ayurcare.ai', role: 'admin' },
      'doctor@ayurcare.ai': { id: '2', name: 'Dr. Priya Sharma', email: 'doctor@ayurcare.ai', role: 'doctor' },
      'patient@ayurcare.ai': { id: '3', name: 'Rahul Kumar', email: 'patient@ayurcare.ai', role: 'patient' }
    };
    const user = DEMO[data?.email];
    if (!user || data?.password !== 'demo123') throw makeError(401, 'Invalid credentials');
    return makeResponse({ token: 'mock-' + Date.now(), user });
  }

  // GET /auth/me
  if (method === 'GET' && url === '/auth/me') {
    const raw = localStorage.getItem('mock-user');
    if (!raw) throw makeError(401, 'Not authenticated');
    return makeResponse({ user: JSON.parse(raw) });
  }

  // POST /patients
  if (method === 'POST' && url === '/patients') {
    const patient = {
      id: genId('pat', ++patientCounter),
      patientCode: genPatientCode(),
      fullName: data.fullName,
      age: data.age,
      gender: data.gender,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
      emergencyContact: data.emergencyContact || null,
      consentGiven: data.consentGiven || false,
      consentAt: data.consentGiven ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      encounters: [],
      documents: [],
      followUps: []
    };
    DEMO_PATIENTS.unshift(patient);
    return makeResponse({ patient });
  }

  // GET /patients/:id
  const patGet = url.match(/^\/patients\/([^/]+)$/);
  if (method === 'GET' && patGet) {
    const p = DEMO_PATIENTS.find(x => x.id === patGet[1]);
    if (!p) throw makeError(404, 'Patient not found');
    const encs = Object.values(DEMO_ENCOUNTERS).filter((e: any) => e.patientId === p.id);
    return makeResponse({ patient: { ...p, encounters: encs } });
  }

  // GET /patients
  if (method === 'GET' && url === '/patients') {
    const search = params?.search || '';
    const page = parseInt(params?.page) || 1;
    const limit = parseInt(params?.limit) || 20;
    let list = DEMO_PATIENTS;
    if (search) {
      const s = search.toLowerCase();
      list = DEMO_PATIENTS.filter(p => p.fullName.toLowerCase().includes(s) || p.patientCode.toLowerCase().includes(s));
    }
    return makeResponse({ patients: list.slice((page - 1) * limit, page * limit), pagination: { total: list.length, pages: Math.ceil(list.length / limit) } });
  }

  // POST /encounters
  if (method === 'POST' && url === '/encounters') {
    const enc = {
      id: genId('enc', ++encounterCounter),
      patientId: data.patientId,
      visitType: data.visitType || 'INITIAL',
      chiefComplaint: data.chiefComplaint || '',
      duration: data.duration || '',
      severity: data.severity || 5,
      status: 'IN_PROGRESS',
      generatedSummary: null,
      summaryApproved: false,
      interviewResponses: [],
      redFlags: [],
      vitals: null,
      biomedicalAssessment: null,
      ayurvedicAssessment: null,
      createdAt: new Date().toISOString()
    };
    DEMO_ENCOUNTERS[enc.id] = enc;
    return makeResponse({ encounter: enc });
  }

  // GET /encounters/:id/next-question
  const nqMatch = url.match(/^\/encounters\/([^/]+)\/next-question$/);
  if (method === 'GET' && nqMatch) {
    const enc = DEMO_ENCOUNTERS[nqMatch[1]];
    if (!enc) throw makeError(404, 'Encounter not found');
    const answered = enc.interviewResponses.map((r: any) => r.questionKey);
    const next = INTERVIEW_QUESTIONS.find(q => !answered.includes(q.key));
    return makeResponse({ question: next || null });
  }

  // POST /encounters/:id/responses
  const respMatch = url.match(/^\/encounters\/([^/]+)\/responses$/);
  if (method === 'POST' && respMatch) {
    const enc = DEMO_ENCOUNTERS[respMatch[1]];
    if (!enc) throw makeError(404, 'Encounter not found');
    enc.interviewResponses.push({ ...data, respondedAt: new Date().toISOString() });
    if (data.questionKey === 'chiefComplaint') enc.chiefComplaint = data.response;
    if (data.questionKey === 'duration') enc.duration = data.response;
    if (data.questionKey === 'severity') enc.severity = parseInt(data.response) || 5;
    return makeResponse({ success: true });
  }

  // PUT /encounters/:id/vitals
  const vitMatch = url.match(/^\/encounters\/([^/]+)\/vitals$/);
  if (method === 'PUT' && vitMatch) {
    const enc = DEMO_ENCOUNTERS[vitMatch[1]];
    if (!enc) throw makeError(404, 'Encounter not found');
    enc.vitals = { ...enc.vitals, ...data, recordedAt: new Date().toISOString() };
    return makeResponse({ success: true, vitals: enc.vitals });
  }

  // GET /encounters/:id
  const encGet = url.match(/^\/encounters\/([^/]+)$/);
  if (method === 'GET' && encGet) {
    const enc = DEMO_ENCOUNTERS[encGet[1]];
    if (!enc) throw makeError(404, 'Encounter not found');
    const pat = DEMO_PATIENTS.find(p => p.id === enc.patientId);
    return makeResponse({ encounter: { ...enc, patient: pat ? { id: pat.id, fullName: pat.fullName, patientCode: pat.patientCode, age: pat.age, gender: pat.gender, phone: pat.phone } : null } });
  }

  // POST /encounters/:id/generate-summary
  const gsMatch = url.match(/^\/encounters\/([^/]+)\/generate-summary$/);
  if (method === 'POST' && gsMatch) {
    const enc = DEMO_ENCOUNTERS[gsMatch[1]];
    if (!enc) throw makeError(404, 'Encounter not found');
    const resps = enc.interviewResponses.map((r: any) => `- ${r.questionText}: ${r.response}`).join('\n');
    enc.generatedSummary = `**Clinical Summary - ${enc.chiefComplaint || 'General Consultation'}**\n\n**Chief Complaint:** ${enc.chiefComplaint || 'Not specified'}\n**Duration:** ${enc.duration || 'Not specified'}\n**Severity:** ${enc.severity}/10\n\n**Patient Responses:**\n${resps || 'No interview responses recorded.'}\n\n**Assessment:**\nPatient presents with ${enc.chiefComplaint || 'symptoms'} lasting ${enc.duration || 'unknown duration'}. Based on interview responses, the condition requires further evaluation.\n\n**Recommendations:**\n1. Continue monitoring symptoms\n2. Maintain symptom diary\n3. Follow up in 2 weeks\n4. Consider relevant investigations`;
    enc.redFlags = enc.severity >= 8 ? [{ level: 'ATTENTION', message: 'High severity reported', detectedAt: new Date().toISOString() }] : [];
    enc.biomedicalAssessment = { findings: enc.chiefComplaint || 'No significant findings' };
    enc.ayurvedicAssessment = { prakriti: 'Mixed', vikriti: 'Pitta-Kapha imbalance suspected' };
    return makeResponse({ summary: enc.generatedSummary });
  }

  // PATCH /encounters/:id/summary
  const spMatch = url.match(/^\/encounters\/([^/]+)\/summary$/);
  if (method === 'PATCH' && spMatch) {
    const enc = DEMO_ENCOUNTERS[spMatch[1]];
    if (!enc) throw makeError(404, 'Encounter not found');
    enc.generatedSummary = data.summary;
    return makeResponse({ success: true });
  }

  // POST /encounters/:id/approve
  const apMatch = url.match(/^\/encounters\/([^/]+)\/approve$/);
  if (method === 'POST' && apMatch) {
    const enc = DEMO_ENCOUNTERS[apMatch[1]];
    if (!enc) throw makeError(404, 'Encounter not found');
    enc.status = 'APPROVED';
    enc.summaryApproved = true;
    return makeResponse({ success: true });
  }

  // POST /documents/upload
  if (method === 'POST' && url === '/documents/upload') {
    return makeResponse({ extraction: { text: 'OCR extraction complete with 92% confidence.', structuredData: { medications: ['Triphala Churna', 'Ashwagandha'], dosage: 'As directed', practitioner: 'Dr. Sharma' }, confidence: 0.92 } });
  }

  // GET /follow-ups/due
  if (method === 'GET' && url === '/follow-ups/due') {
    const fups = DEMO_PATIENTS.slice(0, 2).map((p, i) => ({
      id: genId('fu', ++followUpCounter),
      scheduledAt: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
      status: 'SCHEDULED',
      notes: i === 0 ? 'Follow-up for initial consultation' : 'Vitals review',
      patient: { id: p.id, patientCode: p.patientCode, fullName: p.fullName, phone: p.phone, age: p.age, gender: p.gender }
    }));
    return makeResponse({ followUps: fups });
  }

  // PATCH /follow-ups/:id
  const fuMatch = url.match(/^\/follow-ups\/([^/]+)$/);
  if (method === 'PATCH' && fuMatch) {
    return makeResponse({ success: true });
  }

  // GET /reports/:id/pdf
  const pdfMatch = url.match(/^\/reports\/([^/]+)\/pdf$/);
  if (method === 'GET' && pdfMatch) {
    const blob = new Blob(['AyurCare AI Clinical Report'], { type: 'application/pdf' });
    return makeResponse(blob);
  }

  throw makeError(404, 'Mock endpoint not found');
};

export default mockAdapter;
