interface Question {
  key: string;
  text: string;
  textHi?: string;
  type: 'text' | 'select' | 'number' | 'boolean';
  options?: string[];
  optionsHi?: string[];
  required: boolean;
  category: 'biomedical' | 'ayurvedic' | 'general';
  priority: number;
}

interface QuestionTemplate extends Question {
  condition?: (answers: Record<string, string>) => boolean;
}

const questionTemplates: QuestionTemplate[] = [
  {
    key: 'symptom_location',
    text: 'Where exactly do you feel the discomfort?',
    textHi: 'आपको असुविधा ठीक कहाँ महसूस हो रही है?',
    type: 'text',
    required: true,
    category: 'biomedical',
    priority: 1
  },
  {
    key: 'symptom_duration',
    text: 'How long have you been experiencing this?',
    textHi: 'आप यह कितने समय से अनुभव कर रहे हैं?',
    type: 'select',
    options: ['Less than 24 hours', '1-3 days', '4-7 days', '1-2 weeks', 'More than 2 weeks', 'Chronic/Recurring'],
    optionsHi: ['24 घंटे से कम', '1-3 दिन', '4-7 दिन', '1-2 सप्ताह', '2 सप्ताह से अधिक', 'पुरानी/आवर्ती'],
    required: true,
    category: 'biomedical',
    priority: 2
  },
  {
    key: 'symptom_severity',
    text: 'On a scale of 1-10, how severe is the discomfort?',
    textHi: '1-10 के पैमाने पर, असुविधा कितनी गंभीर है?',
    type: 'number',
    required: true,
    category: 'biomedical',
    priority: 3
  },
  {
    key: 'nausea_vomiting',
    text: 'Are you experiencing nausea or vomiting?',
    textHi: 'क्या आपको मतली या उल्टी हो रही है?',
    type: 'boolean',
    required: false,
    category: 'biomedical',
    priority: 4
  },
  {
    key: 'fever',
    text: 'Do you have fever or chills?',
    textHi: 'क्या आपको बुखार या ठंड लग रही है?',
    type: 'boolean',
    required: false,
    category: 'biomedical',
    priority: 5
  },
  {
    key: 'appetite_changes',
    text: 'Have you noticed any changes in your appetite?',
    textHi: 'क्या आपकी भूख में कोई बदलाव आया है?',
    type: 'select',
    options: ['Normal', 'Increased', 'Decreased', 'No appetite'],
    optionsHi: ['सामान्य', 'बढ़ी हुई', 'घटी हुई', 'भूख नहीं है'],
    required: false,
    category: 'biomedical',
    priority: 6
  },
  {
    key: 'sleep_quality',
    text: 'How is your sleep quality recently?',
    textHi: 'हाल ही में आपकी नींद की गुणवत्ता कैसी है?',
    type: 'select',
    options: ['Normal', 'Insomnia', 'Excessive sleep', 'Disturbed', 'Restless'],
    optionsHi: ['सामान्य', 'अनिद्रा', 'अत्यधिक नींद', 'बाधित', 'बेचैन'],
    required: false,
    category: 'ayurvedic',
    priority: 7
  },
  {
    key: 'bowel_movements',
    text: 'How would you describe your bowel movements?',
    textHi: 'आप अपने मल त्याग का वर्णन कैसे करेंगे?',
    type: 'select',
    options: ['Normal', 'Constipation', 'Loose stools', 'Diarrhea', 'Irregular'],
    optionsHi: ['सामान्य', 'कब्ज', 'दस्त', 'पतले मल', 'अनियमित'],
    required: false,
    category: 'ayurvedic',
    priority: 8
  },
  {
    key: 'stress_level',
    text: 'How would you rate your stress level?',
    textHi: 'आप अपने तनाव के स्तर को कैसे आंकेंगे?',
    type: 'select',
    options: ['Low', 'Moderate', 'High', 'Very High'],
    optionsHi: ['कम', 'मध्यम', 'उच्च', 'बहुत उच्च'],
    required: false,
    category: 'ayurvedic',
    priority: 9
  },
  {
    key: 'energy_level',
    text: 'How would you describe your energy level?',
    textHi: 'आप अपने ऊर्जा स्तर का वर्णन कैसे करेंगे?',
    type: 'select',
    options: ['High', 'Normal', 'Low', 'Very Low', 'Fluctuating'],
    optionsHi: ['उच्च', 'सामान्य', 'कम', 'बहुत कम', 'उतार-चढ़ाव वाला'],
    required: false,
    category: 'ayurvedic',
    priority: 10
  }
];

const digestiveQuestions: QuestionTemplate[] = [
  {
    key: 'digestive_pain_type',
    text: 'What type of pain or discomfort do you feel?',
    textHi: 'आपको किस प्रकार का दर्द या असुविधा हो रही है?',
    type: 'select',
    options: ['Burning', 'Cramping', 'Bloating', 'Sharp', 'Dull ache', 'Pressure'],
    optionsHi: ['जलन', 'ऐंठन', 'सूजन', 'तेज दर्द', 'हल्का दर्द', 'दबाव'],
    required: true,
    category: 'biomedical',
    priority: 1,
    condition: (answers) => !!answers.symptom_location?.toLowerCase().includes('stomach') ||
      !!answers.symptom_location?.toLowerCase().includes('abdomen')
  },
  {
    key: 'bowel_frequency',
    text: 'How many times do you have bowel movements per day?',
    textHi: 'आप दिन में कितनी बार मल त्याग करते हैं?',
    type: 'number',
    required: false,
    category: 'biomedical',
    priority: 2,
    condition: (answers) => !!answers.bowel_movements && answers.bowel_movements !== 'Normal'
  },
  {
    key: 'stool_consistency',
    text: 'How would you describe the consistency of your stools?',
    textHi: 'आप अपने मल की स्थिरता का वर्णन कैसे करेंगे?',
    type: 'select',
    options: ['Hard', 'Loose', 'Watery', 'Mushy', 'Normal'],
    optionsHi: ['सख्त', 'पतला', 'पानी जैसा', 'मुलायम', 'सामान्य'],
    required: false,
    category: 'biomedical',
    priority: 3
  },
  {
    key: 'agni',
    text: 'How is your digestive fire (Agni)?',
    textHi: 'आपकी पाचन अग्नि (अग्नि) कैसी है?',
    type: 'select',
    options: ['Strong - Digests everything well', 'Variable - Sometimes good, sometimes poor', 'Weak - Often feels undigested', 'Hyperactive - Too strong'],
    optionsHi: ['मजबूत - सब कुछ अच्छी तरह पचता है', 'परिवर्तनशील - कभी अच्छी, कभी खराब', 'कमजोर - अक्सर अपच महसूस होता है', 'अतिसक्रिय - बहुत मजबूत'],
    required: false,
    category: 'ayurvedic',
    priority: 4
  },
  {
    key: 'ahara',
    text: 'Describe your eating habits:',
    textHi: 'अपनी खाने की आदतों का वर्णन करें:',
    type: 'select',
    options: ['Regular meals', 'Irregular meals', 'Heavy meals', 'Light meals', 'Mixed'],
    optionsHi: ['नियमित भोजन', 'अनियमित भोजन', 'भारी भोजन', 'हल्का भोजन', 'मिश्रित'],
    required: false,
    category: 'ayurvedic',
    priority: 5
  }
];

const respiratoryQuestions: QuestionTemplate[] = [
  {
    key: 'cough_type',
    text: 'Do you have a cough?',
    textHi: 'क्या आपको खांसी है?',
    type: 'select',
    options: ['No cough', 'Dry cough', 'Productive cough (with phlegm)', 'Occasional cough'],
    optionsHi: ['खांसी नहीं', 'सूखी खांसी', 'उत्पादक खांसी (कफ के साथ)', 'कभी-कभी खांसी'],
    required: true,
    category: 'biomedical',
    priority: 1,
    condition: (answers) => !!answers.symptom_location?.toLowerCase().includes('chest') ||
      !!answers.symptom_location?.toLowerCase().includes('breath')
  },
  {
    key: 'breathing_difficulty',
    text: 'Are you experiencing difficulty breathing?',
    textHi: 'क्या आपको सांस लेने में कठिनाई हो रही है?',
    type: 'boolean',
    required: true,
    category: 'biomedical',
    priority: 2
  },
  {
    key: 'sputum_color',
    text: 'If coughing up phlegm, what color is it?',
    textHi: 'अगर कफ आ रहा है, तो उसका रंग क्या है?',
    type: 'select',
    options: ['Clear', 'White', 'Yellow', 'Green', 'Blood-tinged'],
    optionsHi: ['साफ', 'सफेद', 'पीला', 'हरा', 'खून वाला'],
    required: false,
    category: 'biomedical',
    priority: 3
  }
];

const musculoskeletalQuestions: QuestionTemplate[] = [
  {
    key: 'joint_swelling',
    text: 'Is there any swelling in the affected area?',
    textHi: 'क्या प्रभावित क्षेत्र में कोई सूजन है?',
    type: 'boolean',
    required: true,
    category: 'biomedical',
    priority: 1,
    condition: (answers) => !!answers.symptom_location?.toLowerCase().includes('joint') ||
      !!answers.symptom_location?.toLowerCase().includes('knee') ||
      !!answers.symptom_location?.toLowerCase().includes('shoulder')
  },
  {
    key: 'movement_limitation',
    text: 'Is your movement limited due to this issue?',
    textHi: 'क्या इस समस्या के कारण आपकी गतिविधि सीमित है?',
    type: 'boolean',
    required: true,
    category: 'biomedical',
    priority: 2
  },
  {
    key: 'morning_stiffness',
    text: 'Do you experience morning stiffness?',
    textHi: 'क्या आपको सुबह की अकड़न होती है?',
    type: 'boolean',
    required: false,
    category: 'biomedical',
    priority: 3
  }
];

function getComplaintCategory(complaint: string): string {
  const lower = complaint.toLowerCase();
  
  if (lower.includes('stomach') || lower.includes('abdomen') || lower.includes('digest') || 
      lower.includes('nausea') || lower.includes('vomit') || lower.includes('diarrhea') ||
      lower.includes('constipation') || lower.includes('bloating')) {
    return 'digestive';
  }
  
  if (lower.includes('chest') || lower.includes('breath') || lower.includes('cough') ||
      lower.includes('cold') || lower.includes('throat') || lower.includes('lung')) {
    return 'respiratory';
  }
  
  if (lower.includes('joint') || lower.includes('bone') || lower.includes('muscle') ||
      lower.includes('back') || lower.includes('knee') || lower.includes('shoulder')) {
    return 'musculoskeletal';
  }
  
  if (lower.includes('head') || lower.includes('migraine') || lower.includes('dizziness')) {
    return 'neurological';
  }
  
  return 'general';
}

export function getNextQuestion(
  chiefComplaint: string,
  existingResponses: Array<{ key: string; value: string }>,
  language: string = 'en'
): Question | null {
  const answeredKeys = new Set(existingResponses.map(r => r.key));
  const answersMap: Record<string, string> = {};
  existingResponses.forEach(r => { answersMap[r.key] = r.value; });

  const complaintCategory = getComplaintCategory(chiefComplaint);
  
  let categoryQuestions: QuestionTemplate[] = [];
  
  switch (complaintCategory) {
    case 'digestive':
      categoryQuestions = [...digestiveQuestions];
      break;
    case 'respiratory':
      categoryQuestions = [...respiratoryQuestions];
      break;
    case 'musculoskeletal':
      categoryQuestions = [...musculoskeletalQuestions];
      break;
    default:
      categoryQuestions = [];
  }

  const allQuestions = [...questionTemplates, ...categoryQuestions];

  const filteredQuestions = allQuestions.filter(q => {
    if (answeredKeys.has(q.key)) return false;
    if (q.condition && !q.condition(answersMap)) return false;
    return true;
  });

  filteredQuestions.sort((a, b) => a.priority - b.priority);

  const next = filteredQuestions[0] || null;
  
  if (next && language === 'hi') {
    return {
      ...next,
      text: next.textHi || next.text,
      options: next.optionsHi || next.options
    };
  }
  
  return next;
}

export function getAllQuestionsForComplaint(chiefComplaint: string, language: string = 'en'): Question[] {
  const complaintCategory = getComplaintCategory(chiefComplaint);
  
  let categoryQuestions: QuestionTemplate[] = [];
  
  switch (complaintCategory) {
    case 'digestive':
      categoryQuestions = [...digestiveQuestions];
      break;
    case 'respiratory':
      categoryQuestions = [...respiratoryQuestions];
      break;
    case 'musculoskeletal':
      categoryQuestions = [...musculoskeletalQuestions];
      break;
    default:
      categoryQuestions = [];
  }

  const questions = [...questionTemplates, ...categoryQuestions].sort((a, b) => a.priority - b.priority);
  
  if (language === 'hi') {
    return questions.map(q => ({
      ...q,
      text: q.textHi || q.text,
      options: q.optionsHi || q.options
    }));
  }
  
  return questions;
}
