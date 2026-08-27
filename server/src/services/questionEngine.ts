interface Question {
  key: string;
  text: string;
  type: 'text' | 'select' | 'number' | 'boolean';
  options?: string[];
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
    type: 'text',
    required: true,
    category: 'biomedical',
    priority: 1
  },
  {
    key: 'symptom_duration',
    text: 'How long have you been experiencing this?',
    type: 'select',
    options: ['Less than 24 hours', '1-3 days', '4-7 days', '1-2 weeks', 'More than 2 weeks', 'Chronic/Recurring'],
    required: true,
    category: 'biomedical',
    priority: 2
  },
  {
    key: 'symptom_severity',
    text: 'On a scale of 1-10, how severe is the discomfort?',
    type: 'number',
    required: true,
    category: 'biomedical',
    priority: 3
  },
  {
    key: 'nausea_vomiting',
    text: 'Are you experiencing nausea or vomiting?',
    type: 'boolean',
    required: false,
    category: 'biomedical',
    priority: 4
  },
  {
    key: 'fever',
    text: 'Do you have fever or chills?',
    type: 'boolean',
    required: false,
    category: 'biomedical',
    priority: 5
  },
  {
    key: 'appetite_changes',
    text: 'Have you noticed any changes in your appetite?',
    type: 'select',
    options: ['Normal', 'Increased', 'Decreased', 'No appetite'],
    required: false,
    category: 'biomedical',
    priority: 6
  },
  {
    key: 'sleep_quality',
    text: 'How is your sleep quality recently?',
    type: 'select',
    options: ['Normal', 'Insomnia', 'Excessive sleep', 'Disturbed', 'Restless'],
    required: false,
    category: 'ayurvedic',
    priority: 7
  },
  {
    key: 'bowel_movements',
    text: 'How would you describe your bowel movements?',
    type: 'select',
    options: ['Normal', 'Constipation', 'Loose stools', 'Diarrhea', 'Irregular'],
    required: false,
    category: 'ayurvedic',
    priority: 8
  },
  {
    key: 'stress_level',
    text: 'How would you rate your stress level?',
    type: 'select',
    options: ['Low', 'Moderate', 'High', 'Very High'],
    required: false,
    category: 'ayurvedic',
    priority: 9
  },
  {
    key: 'energy_level',
    text: 'How would you describe your energy level?',
    type: 'select',
    options: ['High', 'Normal', 'Low', 'Very Low', 'Fluctuating'],
    required: false,
    category: 'ayurvedic',
    priority: 10
  }
];

const digestiveQuestions: QuestionTemplate[] = [
  {
    key: 'digestive_pain_type',
    text: 'What type of pain or discomfort do you feel?',
    type: 'select',
    options: ['Burning', 'Cramping', 'Bloating', 'Sharp', 'Dull ache', 'Pressure'],
    required: true,
    category: 'biomedical',
    priority: 1,
    condition: (answers) => !!answers.symptom_location?.toLowerCase().includes('stomach') ||
      !!answers.symptom_location?.toLowerCase().includes('abdomen')
  },
  {
    key: 'bowel_frequency',
    text: 'How many times do you have bowel movements per day?',
    type: 'number',
    required: false,
    category: 'biomedical',
    priority: 2,
    condition: (answers) => !!answers.bowel_movements && answers.bowel_movements !== 'Normal'
  },
  {
    key: 'stool_consistency',
    text: 'How would you describe the consistency of your stools?',
    type: 'select',
    options: ['Hard', 'Loose', 'Watery', 'Mushy', 'Normal'],
    required: false,
    category: 'biomedical',
    priority: 3
  },
  {
    key: 'agni',
    text: 'How is your digestive fire (Agni)?',
    type: 'select',
    options: ['Strong - Digests everything well', 'Variable - Sometimes good, sometimes poor', 'Weak - Often feels undigested', 'Hyperactive - Too strong'],
    required: false,
    category: 'ayurvedic',
    priority: 4
  },
  {
    key: 'ahara',
    text: 'Describe your eating habits:',
    type: 'select',
    options: ['Regular meals', 'Irregular meals', 'Heavy meals', 'Light meals', 'Mixed'],
    required: false,
    category: 'ayurvedic',
    priority: 5
  }
];

const respiratoryQuestions: QuestionTemplate[] = [
  {
    key: 'cough_type',
    text: 'Do you have a cough?',
    type: 'select',
    options: ['No cough', 'Dry cough', 'Productive cough (with phlegm)', 'Occasional cough'],
    required: true,
    category: 'biomedical',
    priority: 1,
    condition: (answers) => !!answers.symptom_location?.toLowerCase().includes('chest') ||
      !!answers.symptom_location?.toLowerCase().includes('breath')
  },
  {
    key: 'breathing_difficulty',
    text: 'Are you experiencing difficulty breathing?',
    type: 'boolean',
    required: true,
    category: 'biomedical',
    priority: 2
  },
  {
    key: 'sputum_color',
    text: 'If coughing up phlegm, what color is it?',
    type: 'select',
    options: ['Clear', 'White', 'Yellow', 'Green', 'Blood-tinged'],
    required: false,
    category: 'biomedical',
    priority: 3
  }
];

const musculoskeletalQuestions: QuestionTemplate[] = [
  {
    key: 'joint_swelling',
    text: 'Is there any swelling in the affected area?',
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
    type: 'boolean',
    required: true,
    category: 'biomedical',
    priority: 2
  },
  {
    key: 'morning_stiffness',
    text: 'Do you experience morning stiffness?',
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
  existingResponses: Array<{ key: string; value: string }>
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

  return filteredQuestions[0] || null;
}

export function getAllQuestionsForComplaint(chiefComplaint: string): Question[] {
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

  return [...questionTemplates, ...categoryQuestions].sort((a, b) => a.priority - b.priority);
}
