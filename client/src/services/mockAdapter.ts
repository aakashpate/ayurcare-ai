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

const DEMO_DOCTORS: any[] = [
  {
    id: 'DOC-001',
    fullName: 'Dr. Priya Sharma',
    email: 'dr.sharma@ayurcare.demo',
    licenseNo: 'AYU-2024-001',
    speciality: 'Kayachikitsa',
    hospital: 'AyurCare Central Hospital',
    verificationId: 'VER-AYU-2024-001',
    verified: true,
    verifiedAt: '2024-01-15T10:00:00Z',
    phone: '9876543210',
    createdAt: '2024-01-10T08:00:00Z'
  },
  {
    id: 'DOC-002',
    fullName: 'Dr. Rahul Verma',
    email: 'dr.verma@ayurcare.demo',
    licenseNo: 'AYU-2024-002',
    speciality: 'Panchakarma',
    hospital: 'AyurCare Central Hospital',
    verificationId: 'VER-AYU-2024-002',
    verified: false,
    verifiedAt: null,
    phone: '9876543211',
    createdAt: '2024-02-01T08:00:00Z'
  },
  {
    id: 'DOC-003',
    fullName: 'Dr. Anita Desai',
    email: 'dr.desai@ayurcare.demo',
    licenseNo: 'AYU-2024-003',
    speciality: 'Shalya Tantra',
    hospital: 'Community Health Center',
    verificationId: 'VER-AYU-2024-003',
    verified: false,
    verifiedAt: null,
    phone: '9876543212',
    createdAt: '2024-02-15T08:00:00Z'
  }
];

interface MockQuestion {
  key: string;
  text: string;
  textHi?: string;
  type: 'text' | 'select' | 'number' | 'boolean';
  options?: string[];
  optionsHi?: string[];
  required: boolean;
  category: string;
  priority: number;
  condition?: (answers: Record<string, string>) => boolean;
}

const baseQuestions: MockQuestion[] = [
  { key: 'symptom_location', text: 'Where exactly do you feel the discomfort?', textHi: 'आपको असुविधा ठीक कहाँ महसूस हो रही है?', type: 'text', required: true, category: 'biomedical', priority: 1 },
  { key: 'symptom_duration', text: 'How long have you been experiencing this?', textHi: 'आप यह कितने समय से अनुभव कर रहे हैं?', type: 'select', options: ['Less than 24 hours', '1-3 days', '4-7 days', '1-2 weeks', 'More than 2 weeks', 'Chronic/Recurring'], optionsHi: ['24 घंटे से कम', '1-3 दिन', '4-7 दिन', '1-2 सप्ताह', '2 सप्ताह से अधिक', 'पुरानी/आवर्ती'], required: true, category: 'biomedical', priority: 2 },
  { key: 'symptom_severity', text: 'On a scale of 1-10, how severe is the discomfort?', textHi: '1-10 के पैमाने पर, असुविधा कितनी गंभीर है?', type: 'number', required: true, category: 'biomedical', priority: 3 },
  { key: 'nausea_vomiting', text: 'Are you experiencing nausea or vomiting?', textHi: 'क्या आपको मतली या उल्टी हो रही है?', type: 'boolean', required: false, category: 'biomedical', priority: 4 },
  { key: 'fever', text: 'Do you have fever or chills?', textHi: 'क्या आपको बुखार या ठंड लग रही है?', type: 'boolean', required: false, category: 'biomedical', priority: 5 },
  { key: 'appetite_changes', text: 'Have you noticed any changes in your appetite?', textHi: 'क्या आपकी भूख में कोई बदलाव आया है?', type: 'select', options: ['Normal', 'Increased', 'Decreased', 'No appetite'], optionsHi: ['सामान्य', 'बढ़ी हुई', 'घटी हुई', 'भूख नहीं है'], required: false, category: 'biomedical', priority: 6 },
  { key: 'sleep_quality', text: 'How is your sleep quality recently?', textHi: 'हाल ही में आपकी नींद की गुणवत्ता कैसी है?', type: 'select', options: ['Normal', 'Insomnia', 'Excessive sleep', 'Disturbed', 'Restless'], optionsHi: ['सामान्य', 'अनिद्रा', 'अत्यधिक नींद', 'बाधित', 'बेचैन'], required: false, category: 'ayurvedic', priority: 7 },
  { key: 'bowel_movements', text: 'How would you describe your bowel movements?', textHi: 'आप अपने मल त्याग का वर्णन कैसे करेंगे?', type: 'select', options: ['Normal', 'Constipation', 'Loose stools', 'Diarrhea', 'Irregular'], optionsHi: ['सामान्य', 'कब्ज', 'दस्त', 'पतले मल', 'अनियमित'], required: false, category: 'ayurvedic', priority: 8 },
  { key: 'stress_level', text: 'How would you rate your stress level?', textHi: 'आप अपने तनाव के स्तर को कैसे आंकेंगे?', type: 'select', options: ['Low', 'Moderate', 'High', 'Very High'], optionsHi: ['कम', 'मध्यम', 'उच्च', 'बहुत उच्च'], required: false, category: 'ayurvedic', priority: 9 },
  { key: 'energy_level', text: 'How would you describe your energy level?', textHi: 'आप अपने ऊर्जा स्तर का वर्णन कैसे करेंगे?', type: 'select', options: ['High', 'Normal', 'Low', 'Very Low', 'Fluctuating'], optionsHi: ['उच्च', 'सामान्य', 'कम', 'बहुत कम', 'उतार-चढ़ाव वाला'], required: false, category: 'ayurvedic', priority: 10 }
];

const digestiveQuestions: MockQuestion[] = [
  { key: 'digestive_pain_type', text: 'What type of pain or discomfort do you feel?', textHi: 'आपको किस प्रकार का दर्द या असुविधा हो रही है?', type: 'select', options: ['Burning', 'Cramping', 'Bloating', 'Sharp', 'Dull ache', 'Pressure'], optionsHi: ['जलन', 'ऐंठन', 'सूजन', 'तेज दर्द', 'हल्का दर्द', 'दबाव'], required: true, category: 'biomedical', priority: 1, condition: (answers) => !!answers.symptom_location?.toLowerCase().includes('stomach') || !!answers.symptom_location?.toLowerCase().includes('abdomen') },
  { key: 'bowel_frequency', text: 'How many times do you have bowel movements per day?', textHi: 'आप दिन में कितनी बार मल त्याग करते हैं?', type: 'number', required: false, category: 'biomedical', priority: 2, condition: (answers) => !!answers.bowel_movements && answers.bowel_movements !== 'Normal' },
  { key: 'stool_consistency', text: 'How would you describe the consistency of your stools?', textHi: 'आप अपने मल की स्थिरता का वर्णन कैसे करेंगे?', type: 'select', options: ['Hard', 'Loose', 'Watery', 'Mushy', 'Normal'], optionsHi: ['सख्त', 'पतला', 'पानी जैसा', 'मुलायम', 'सामान्य'], required: false, category: 'biomedical', priority: 3 },
  { key: 'agni', text: 'How is your digestive fire (Agni)?', textHi: 'आपकी पाचन अग्नि (अग्नि) कैसी है?', type: 'select', options: ['Strong - Digests everything well', 'Variable - Sometimes good, sometimes poor', 'Weak - Often feels undigested', 'Hyperactive - Too strong'], optionsHi: ['मजबूत - सब कुछ अच्छी तरह पचता है', 'परिवर्तनशील - कभी अच्छी, कभी खराब', 'कमजोर - अक्सर अपच महसूस होता है', 'अतिसक्रिय - बहुत मजबूत'], required: false, category: 'ayurvedic', priority: 4 },
  { key: 'ahara', text: 'Describe your eating habits:', textHi: 'अपनी खाने की आदतों का वर्णन करें:', type: 'select', options: ['Regular meals', 'Irregular meals', 'Heavy meals', 'Light meals', 'Mixed'], optionsHi: ['नियमित भोजन', 'अनियमित भोजन', 'भारी भोजन', 'हल्का भोजन', 'मिश्रित'], required: false, category: 'ayurvedic', priority: 5 }
];

const respiratoryQuestions: MockQuestion[] = [
  { key: 'cough_type', text: 'Do you have a cough?', textHi: 'क्या आपको खांसी है?', type: 'select', options: ['No cough', 'Dry cough', 'Productive cough (with phlegm)', 'Occasional cough'], optionsHi: ['खांसी नहीं', 'सूखी खांसी', 'उत्पादक खांसी (कफ के साथ)', 'कभी-कभी खांसी'], required: true, category: 'biomedical', priority: 1, condition: (answers) => !!answers.symptom_location?.toLowerCase().includes('chest') || !!answers.symptom_location?.toLowerCase().includes('breath') },
  { key: 'breathing_difficulty', text: 'Are you experiencing difficulty breathing?', textHi: 'क्या आपको सांस लेने में कठिनाई हो रही है?', type: 'boolean', required: true, category: 'biomedical', priority: 2 },
  { key: 'sputum_color', text: 'If coughing up phlegm, what color is it?', textHi: 'अगर कफ आ रहा है, तो उसका रंग क्या है?', type: 'select', options: ['Clear', 'White', 'Yellow', 'Green', 'Blood-tinged'], optionsHi: ['साफ', 'सफेद', 'पीला', 'हरा', 'खून वाला'], required: false, category: 'biomedical', priority: 3 }
];

const musculoskeletalQuestions: MockQuestion[] = [
  { key: 'joint_swelling', text: 'Is there any swelling in the affected area?', textHi: 'क्या प्रभावित क्षेत्र में कोई सूजन है?', type: 'boolean', required: true, category: 'biomedical', priority: 1, condition: (answers) => !!answers.symptom_location?.toLowerCase().includes('joint') || !!answers.symptom_location?.toLowerCase().includes('knee') || !!answers.symptom_location?.toLowerCase().includes('shoulder') },
  { key: 'movement_limitation', text: 'Is your movement limited due to this issue?', textHi: 'क्या इस समस्या के कारण आपकी गतिविधि सीमित है?', type: 'boolean', required: true, category: 'biomedical', priority: 2 },
  { key: 'morning_stiffness', text: 'Do you experience morning stiffness?', textHi: 'क्या आपको सुबह की अकड़न होती है?', type: 'boolean', required: false, category: 'biomedical', priority: 3 }
];

function getComplaintCategory(complaint: string): string {
  const lower = complaint.toLowerCase();
  if (lower.includes('stomach') || lower.includes('abdomen') || lower.includes('digest') || lower.includes('nausea') || lower.includes('vomit') || lower.includes('diarrhea') || lower.includes('constipation') || lower.includes('bloating') || lower.includes('पेट') || lower.includes('पाचन')) return 'digestive';
  if (lower.includes('chest') || lower.includes('breath') || lower.includes('cough') || lower.includes('cold') || lower.includes('throat') || lower.includes('lung') || lower.includes('सांस') || lower.includes('खांसी')) return 'respiratory';
  if (lower.includes('joint') || lower.includes('bone') || lower.includes('muscle') || lower.includes('back') || lower.includes('knee') || lower.includes('shoulder') || lower.includes('जोड़') || lower.includes('पीठ')) return 'musculoskeletal';
  if (lower.includes('head') || lower.includes('migraine') || lower.includes('dizziness') || lower.includes('सिर') || lower.includes('चक्कर')) return 'neurological';
  return 'general';
}

const URGENT_KEYWORDS = ['chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious', 'seizure', 'stroke', 'heart attack', 'anaphylaxis', 'severe allergic', 'high fever', 'severe headache', 'stiff neck', 'confusion'];
const ATTENTION_KEYWORDS = ['persistent', 'worsening', 'chronic', 'recurrent', 'multiple', 'family history', 'previous surgery', 'medication'];

function generateMockRedFlags(data: { severity?: number; chiefComplaint?: string; vitals?: any; biomedicalAssessment?: any }): Array<{ level: string; code: string; reason: string }> {
  const flags: Array<{ level: string; code: string; reason: string }> = [];

  if (data.severity && data.severity >= 8) {
    flags.push({ level: 'URGENT', code: 'HIGH_SEVERITY', reason: `Patient reported high symptom severity (${data.severity}/10)` });
  } else if (data.severity && data.severity >= 6) {
    flags.push({ level: 'ATTENTION', code: 'MODERATE_SEVERITY', reason: `Patient reported moderate symptom severity (${data.severity}/10)` });
  }

  if (data.vitals) {
    if (data.vitals.systolicBP && data.vitals.systolicBP > 180) {
      flags.push({ level: 'URGENT', code: 'HYPERTENSIVE_CRISIS', reason: `Extremely high systolic blood pressure: ${data.vitals.systolicBP} mmHg` });
    } else if (data.vitals.systolicBP && data.vitals.systolicBP > 140) {
      flags.push({ level: 'ATTENTION', code: 'HIGH_BP', reason: `Elevated systolic blood pressure: ${data.vitals.systolicBP} mmHg` });
    }
    if (data.vitals.spo2 && data.vitals.spo2 < 90) {
      flags.push({ level: 'URGENT', code: 'LOW_SPO2', reason: `Critically low oxygen saturation: ${data.vitals.spo2}%` });
    } else if (data.vitals.spo2 && data.vitals.spo2 < 94) {
      flags.push({ level: 'ATTENTION', code: 'LOW_SPO2_ATTENTION', reason: `Low oxygen saturation: ${data.vitals.spo2}%` });
    }
    if (data.vitals.temperature && data.vitals.temperature > 39.5) {
      flags.push({ level: 'URGENT', code: 'HIGH_FEVER', reason: `High fever detected: ${data.vitals.temperature}°C` });
    } else if (data.vitals.temperature && data.vitals.temperature > 38) {
      flags.push({ level: 'ATTENTION', code: 'FEVER', reason: `Fever detected: ${data.vitals.temperature}°C` });
    }
    if (data.vitals.pulse && (data.vitals.pulse > 120 || data.vitals.pulse < 50)) {
      flags.push({ level: 'ATTENTION', code: 'ABNORMAL_PULSE', reason: `Abnormal pulse rate: ${data.vitals.pulse} bpm` });
    }
  }

  if (data.chiefComplaint) {
    const complaintLower = data.chiefComplaint.toLowerCase();
    for (const keyword of URGENT_KEYWORDS) {
      if (complaintLower.includes(keyword)) {
        flags.push({ level: 'URGENT', code: 'URGENT_SYMPTOM', reason: `Concerning symptom mentioned: "${keyword}"` });
        break;
      }
    }
    for (const keyword of ATTENTION_KEYWORDS) {
      if (complaintLower.includes(keyword)) {
        flags.push({ level: 'ATTENTION', code: 'ATTENTION_SYMPTOM', reason: `Symptom requiring attention: "${keyword}"` });
        break;
      }
    }
  }

  if (data.biomedicalAssessment?.allergies) {
    const allergyLower = data.biomedicalAssessment.allergies.toLowerCase();
    if (allergyLower.includes('severe') || allergyLower.includes('anaphylaxis')) {
      flags.push({ level: 'URGENT', code: 'SEVERE_ALLERGY', reason: 'Severe allergy history noted' });
    } else if (data.biomedicalAssessment.allergies.length > 0) {
      flags.push({ level: 'ATTENTION', code: 'ALLERGY_HISTORY', reason: 'Allergy history present - verify before prescribing' });
    }
  }

  if (flags.length === 0) {
    flags.push({ level: 'NORMAL', code: 'NO_FLAGS', reason: 'No immediate safety concerns identified' });
  }

  return flags;
}

function getAdaptiveNextQuestion(chiefComplaint: string, answeredKeys: Set<string>, answersMap: Record<string, string>, language: string): MockQuestion | null {
  const category = getComplaintCategory(chiefComplaint);
  let categoryQuestions: MockQuestion[] = [];
  switch (category) {
    case 'digestive': categoryQuestions = digestiveQuestions; break;
    case 'respiratory': categoryQuestions = respiratoryQuestions; break;
    case 'musculoskeletal': categoryQuestions = musculoskeletalQuestions; break;
    default: categoryQuestions = [];
  }
  const allQuestions = [...baseQuestions, ...categoryQuestions];
  const filtered = allQuestions.filter(q => {
    if (answeredKeys.has(q.key)) return false;
    if (q.condition && !q.condition(answersMap)) return false;
    return true;
  });
  filtered.sort((a, b) => a.priority - b.priority);
  const next = filtered[0] || null;
  if (next && language === 'hi') {
    return { ...next, text: next.textHi || next.text, options: next.optionsHi || next.options };
  }
  return next;
}

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
      language: data.language || 'en',
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
    const answered = new Set<string>(enc.interviewResponses.map((r: any) => r.questionKey));
    const answersMap: Record<string, string> = {};
    enc.interviewResponses.forEach((r: any) => { answersMap[r.questionKey] = r.response; });
    const language = enc.language || 'en';
    const next = getAdaptiveNextQuestion(enc.chiefComplaint || '', answered, answersMap, language);
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

  // PUT /encounters/:id/biomedical
  const bioMatch = url.match(/^\/encounters\/([^/]+)\/biomedical$/);
  if (method === 'PUT' && bioMatch) {
    const enc = DEMO_ENCOUNTERS[bioMatch[1]];
    if (!enc) throw makeError(404, 'Encounter not found');
    enc.biomedicalAssessment = { ...enc.biomedicalAssessment, ...data };
    return makeResponse({ success: true, biomedical: enc.biomedicalAssessment });
  }

  // PUT /encounters/:id/ayurvedic
  const ayuMatch = url.match(/^\/encounters\/([^/]+)\/ayurvedic$/);
  if (method === 'PUT' && ayuMatch) {
    const enc = DEMO_ENCOUNTERS[ayuMatch[1]];
    if (!enc) throw makeError(404, 'Encounter not found');
    enc.ayurvedicAssessment = { ...enc.ayurvedicAssessment, ...data };
    return makeResponse({ success: true, ayurvedic: enc.ayurvedicAssessment });
  }

  // POST /encounters/:id/check-red-flags
  const rfMatch = url.match(/^\/encounters\/([^/]+)\/check-red-flags$/);
  if (method === 'POST' && rfMatch) {
    const enc = DEMO_ENCOUNTERS[rfMatch[1]];
    if (!enc) throw makeError(404, 'Encounter not found');
    const flags = generateMockRedFlags({
      severity: enc.severity,
      chiefComplaint: enc.chiefComplaint,
      vitals: enc.vitals,
      biomedicalAssessment: enc.biomedicalAssessment
    });
    enc.redFlags = flags;
    return makeResponse({ redFlags: flags });
  }

  // GET /encounters/:id
  const encGet = url.match(/^\/encounters\/([^/]+)$/);
  if (method === 'GET' && encGet) {
    const enc = DEMO_ENCOUNTERS[encGet[1]];
    if (!enc) throw makeError(404, 'Encounter not found');
    const pat = DEMO_PATIENTS.find(p => p.id === enc.patientId);
    return makeResponse({ encounter: { ...enc, patient: pat ? { id: pat.id, fullName: pat.fullName, patientCode: pat.patientCode, age: pat.age, gender: pat.gender, phone: pat.phone, email: pat.email } : null } });
  }

  // POST /encounters/:id/generate-summary
  const gsMatch = url.match(/^\/encounters\/([^/]+)\/generate-summary$/);
  if (method === 'POST' && gsMatch) {
    const enc = DEMO_ENCOUNTERS[gsMatch[1]];
    if (!enc) throw makeError(404, 'Encounter not found');
    const pat = DEMO_PATIENTS.find(p => p.id === enc.patientId);
    const resps = enc.interviewResponses.map((r: any) => `- ${r.questionText}: ${r.response}`).join('\n');
    
    const flags = generateMockRedFlags({
      severity: enc.severity,
      chiefComplaint: enc.chiefComplaint,
      vitals: enc.vitals,
      biomedicalAssessment: enc.biomedicalAssessment
    });
    
    enc.redFlags = flags;
    
    const sections: string[] = [];
    sections.push(`## AI-GENERATED CLINICAL SUMMARY`);
    sections.push(`**REVIEW REQUIRED BY QUALIFIED PRACTITIONER**\n`);
    sections.push(`### Patient Information`);
    sections.push(`- Name: ${pat?.fullName || 'Unknown'}`);
    sections.push(`- Age: ${pat?.age || 'Unknown'} years`);
    sections.push(`- Gender: ${pat?.gender || 'Unknown'}`);
    sections.push(`- Patient ID: ${pat?.patientCode || 'N/A'}`);
    sections.push(`- Visit Date: ${new Date().toLocaleDateString()}\n`);
    
    if (enc.chiefComplaint) {
      sections.push(`### Chief Complaint`);
      sections.push(`${enc.chiefComplaint}`);
      if (enc.duration) sections.push(`Duration: ${enc.duration}`);
      if (enc.severity) sections.push(`Severity: ${enc.severity}/10`);
      sections.push('');
    }
    
    if (resps) {
      sections.push(`### History of Present Illness`);
      sections.push(resps);
      sections.push('');
    }
    
    if (enc.vitals) {
      sections.push(`### Vital Signs`);
      const v = enc.vitals;
      if (v.systolicBP && v.diastolicBP) sections.push(`BP: ${v.systolicBP}/${v.diastolicBP} mmHg`);
      if (v.pulse) sections.push(`Pulse: ${v.pulse} bpm`);
      if (v.temperature) sections.push(`Temperature: ${v.temperature}°C`);
      if (v.spo2) sections.push(`SpO2: ${v.spo2}%`);
      if (v.weight) sections.push(`Weight: ${v.weight} kg`);
      if (v.height) sections.push(`Height: ${v.height} cm`);
      sections.push('');
    }
    
    if (enc.biomedicalAssessment) {
      sections.push(`### Biomedical Assessment`);
      const b = enc.biomedicalAssessment;
      if (b.pastMedicalHistory) sections.push(`Past Medical: ${b.pastMedicalHistory}`);
      if (b.pastSurgicalHistory) sections.push(`Past Surgical: ${b.pastSurgicalHistory}`);
      if (b.medications) sections.push(`Medications: ${b.medications}`);
      if (b.allergies) sections.push(`Allergies: ${b.allergies}`);
      if (b.familyHistory) sections.push(`Family History: ${b.familyHistory}`);
      if (b.personalHistory) sections.push(`Personal History: ${b.personalHistory}`);
      sections.push('');
    }
    
    if (enc.ayurvedicAssessment) {
      sections.push(`### Ayurvedic Assessment`);
      const a = enc.ayurvedicAssessment;
      if (a.agni) sections.push(`Agni: ${a.agni}`);
      if (a.ahara) sections.push(`Ahara: ${a.ahara}`);
      if (a.nidra) sections.push(`Nidra: ${a.nidra}`);
      if (a.exercise) sections.push(`Vyayama Shakti: ${a.exercise}`);
      if (a.stress) sections.push(`Sattva: ${a.stress}`);
      if (a.bmi) sections.push(`Samhanana: ${a.bmi}`);
      sections.push('');
    }
    
    if (flags.length > 0) {
      sections.push(`### Safety Flags`);
      for (const flag of flags) {
        sections.push(`- [${flag.level}] ${flag.reason}`);
      }
      sections.push('');
    }
    
    sections.push(`### Missing Information`);
    const missing: string[] = [];
    if (!enc.vitals) missing.push('Vital signs not yet recorded');
    if (enc.interviewResponses.length < 3) missing.push('Limited interview responses collected');
    if (!enc.biomedicalAssessment) missing.push('Biomedical assessment not completed');
    if (missing.length > 0) {
      for (const m of missing) sections.push(`- ${m}`);
    } else {
      sections.push('- No significant missing information');
    }
    sections.push('');
    
    sections.push(`---`);
    sections.push(`*AI GENERATED — PHYSICIAN REVIEW REQUIRED*`);
    sections.push(`*This summary was AI-generated and requires review by a qualified healthcare practitioner.*`);
    
    enc.generatedSummary = sections.join('\n');
    enc.biomedicalAssessment = enc.biomedicalAssessment || { findings: enc.chiefComplaint || 'No significant findings' };
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
    return makeResponse({ extraction: { text: '[DEMO OCR EXTRACTION] This is simulated extraction from the uploaded document.\n\nIn a production environment, this would contain the actual text extracted using OCR technology.', structuredData: { medications: ['Triphala Churna', 'Ashwagandha'], dosage: 'As directed', practitioner: 'Dr. Sharma' }, confidence: 0.92, isMock: true } });
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

  // GET /admin/doctors
  if (method === 'GET' && url === '/admin/doctors') {
    return makeResponse({ doctors: DEMO_DOCTORS });
  }

  // GET /admin/doctors/pending
  if (method === 'GET' && url === '/admin/doctors/pending') {
    const pending = DEMO_DOCTORS.filter(d => !d.verified);
    return makeResponse({ doctors: pending });
  }

  // PATCH /admin/doctors/:id/verify
  const verifyMatch = url.match(/^\/admin\/doctors\/([^/]+)\/verify$/);
  if (method === 'PATCH' && verifyMatch) {
    const doc = DEMO_DOCTORS.find(d => d.id === verifyMatch[1]);
    if (!doc) throw makeError(404, 'Doctor not found');
    doc.verified = true;
    doc.verifiedAt = new Date().toISOString();
    return makeResponse({ success: true, doctor: doc });
  }

  // PATCH /admin/doctors/:id/reject
  const rejectMatch = url.match(/^\/admin\/doctors\/([^/]+)\/reject$/);
  if (method === 'PATCH' && rejectMatch) {
    const docIdx = DEMO_DOCTORS.findIndex(d => d.id === rejectMatch[1]);
    if (docIdx === -1) throw makeError(404, 'Doctor not found');
    DEMO_DOCTORS.splice(docIdx, 1);
    return makeResponse({ success: true });
  }

  throw makeError(404, 'Mock endpoint not found');
};

export default mockAdapter;
