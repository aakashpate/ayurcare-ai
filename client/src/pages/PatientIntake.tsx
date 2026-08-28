import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { setLanguage } from '../i18n';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Heart, Shield, Globe, User, MessageCircle, 
  ClipboardList, FileText, AlertTriangle, CheckCircle,
  ArrowRight, ArrowLeft, Mic, MicOff, Send, Loader2
} from 'lucide-react';

interface IntakeState {
  step: number;
  consentGiven: boolean;
  language: string;
  patientId: string | null;
  encounterId: string | null;
  fullName: string;
  age: number;
  gender: string;
  phone: string;
  chiefComplaint: string;
  chiefComplaintCategory: string;
  responses: Array<{ key: string; text: string; textHi?: string; value: string; source: string }>;
  biomedicalData: any;
  ayurvedicData: any;
  redFlags: any[];
}

const CHIEF_COMPLAINTS = [
  { key: 'joint_pain', en: 'Joint Pain', hi: 'जोड़ों में दर्द', category: 'musculoskeletal' },
  { key: 'fever', en: 'Fever', hi: 'बुखार', category: 'general' },
  { key: 'headache', en: 'Headache', hi: 'सिरदर्द', category: 'neurological' },
  { key: 'digestive', en: 'Digestive Problem', hi: 'पाचन संबंधी समस्या', category: 'digestive' },
  { key: 'respiratory', en: 'Breathing / Cough', hi: 'सांस / खांसी', category: 'respiratory' },
  { key: 'skin', en: 'Skin Problem', hi: 'त्वचा की समस्या', category: 'dermatological' },
  { key: 'fatigue', en: 'Fatigue / Weakness', hi: 'थकान / कमज़ोरी', category: 'general' },
  { key: 'other', en: 'Other', hi: 'अन्य', category: 'general' },
];

const ADAPTIVE_QUESTIONS: Record<string, Array<{ key: string; text: string; textHi: string; type: string; options?: string[]; optionsHi?: string[]; required: boolean }>> = {
  musculoskeletal: [
    { key: 'location', text: 'Where exactly is the pain?', textHi: 'दर्द ठीक कहाँ है?', type: 'select', options: ['Knee', 'Shoulder', 'Back', 'Wrist', 'Ankle', 'Hip', 'Other'], optionsHi: ['घुटना', 'कंधा', 'पीठ', 'कलाई', 'टखना', 'कूल्हा', 'अन्य'], required: true },
    { key: 'duration', text: 'How long have you had this pain?', textHi: 'आपको यह दर्द कितने समय से है?', type: 'select', options: ['Less than a week', '1-4 weeks', '1-3 months', 'More than 3 months'], optionsHi: ['1 सप्ताह से कम', '1-4 सप्ताह', '1-3 महीने', '3 महीने से अधिक'], required: true },
    { key: 'severity', text: 'Rate your pain (1 = mild, 10 = severe)', textHi: 'अपने दर्द को रेट करें (1 = हल्का, 10 = गंभीर)', type: 'select', options: ['1-3 (Mild)', '4-6 (Moderate)', '7-8 (Severe)', '9-10 (Very Severe)'], optionsHi: ['1-3 (हल्का)', '4-6 (मध्यम)', '7-8 (गंभीर)', '9-10 (बहुत गंभीर)'], required: true },
    { key: 'movement', text: 'Does movement make it worse?', textHi: 'क्या हिलने-डुलने से दर्द बढ़ता है?', type: 'boolean', required: false },
    { key: 'morning_stiffness', text: 'Do you feel stiffness in the morning?', textHi: 'क्या आपको सुबह अकड़न महसूस होती है?', type: 'boolean', required: false },
    { key: 'swelling', text: 'Is there any swelling?', textHi: 'क्या कहीं सूजन है?', type: 'boolean', required: false },
  ],
  digestive: [
    { key: 'onset', text: 'When did the problem start?', textHi: 'समस्या कब शुरू हुई?', type: 'select', options: ['Suddenly', 'Gradually over days', 'Gradually over weeks'], optionsHi: ['अचानक', 'दिनों में धीरे-धीरे', 'हफ्तों में धीरे-धीरे'], required: true },
    { key: 'relation_to_food', text: 'Is it related to food?', textHi: 'क्या यह भोजन से संबंधित है?', type: 'select', options: ['Worse after eating', 'Better after eating', 'No relation', 'Worse on empty stomach'], optionsHi: ['भोजन के बाद बदतर', 'भोजन के बाद बेहतर', 'कोई संबंध नहीं', 'खाली पेट बदतर'], required: true },
    { key: 'appetite', text: 'How is your appetite?', textHi: 'आपकी भूख कैसी है?', type: 'select', options: ['Normal', 'Reduced', 'Increased', 'No appetite'], optionsHi: ['सामान्य', 'कम', 'बढ़ी हुई', 'भूख नहीं'], required: true },
    { key: 'bowel', text: 'How are your bowel movements?', textHi: 'आपके पेट साफ़ होने का क्या हाल है?', type: 'select', options: ['Normal', 'Constipation', 'Loose stools', 'Alternating'], optionsHi: ['सामान्य', 'कब्ज', 'दस्त', 'बदलता रहता है'], required: true },
    { key: 'nausea', text: 'Do you feel nausea?', textHi: 'क्या आपको मतली महसूस होती है?', type: 'boolean', required: false },
    { key: 'burning', text: 'Any burning sensation?', textHi: 'क्या कोई जलन महसूस होती है?', type: 'boolean', required: false },
  ],
  respiratory: [
    { key: 'cough_type', text: 'What type of cough?', textHi: 'किस प्रकार की खांसी है?', type: 'select', options: ['Dry cough', 'With phlegm', 'Occasional'], optionsHi: ['सूखी खांसी', 'कफ के साथ', 'कभी-कभी'], required: true },
    { key: 'breathlessness', text: 'Do you feel breathless?', textHi: 'क्या आपको सांस फूलने की शिकायत है?', type: 'boolean', required: true },
    { key: 'fever', text: 'Do you have fever?', textHi: 'क्या आपको बुखार है?', type: 'boolean', required: false },
    { key: 'duration', text: 'How long have you had these symptoms?', textHi: 'ये लक्षण कितने समय से हैं?', type: 'select', options: ['1-3 days', '4-7 days', '1-2 weeks', 'More than 2 weeks'], optionsHi: ['1-3 दिन', '4-7 दिन', '1-2 सप्ताह', '2 सप्ताह से अधिक'], required: true },
  ],
  neurological: [
    { key: 'location', text: 'Where is the headache?', textHi: 'सिरदर्द कहाँ है?', type: 'select', options: ['Front', 'Back', 'One side', 'All over', 'Around eyes'], optionsHi: ['सामने', 'पीछे', 'एक तरफ', 'पूरे सिर में', 'आँखों के चारों ओर'], required: true },
    { key: 'severity', text: 'How severe is the pain?', textHi: 'दर्द कितना गंभीर है?', type: 'select', options: ['Mild', 'Moderate', 'Severe', 'Very Severe'], optionsHi: ['हल्का', 'मध्यम', 'गंभीर', 'बहुत गंभीर'], required: true },
    { key: 'associated', text: 'Any other symptoms?', textHi: 'क्या कोई अन्य लक्षण हैं?', type: 'select', options: ['Nausea', 'Vomiting', 'Light sensitivity', 'None'], optionsHi: ['मतली', 'उल्टी', 'रोशनी से परेशानी', 'कोई नहीं'], required: false },
    { key: 'duration', text: 'How long have you had this?', textHi: 'यह कितने समय से है?', type: 'select', options: ['Today', '1-3 days', 'More than 3 days', 'Recurring'], optionsHi: ['आज', '1-3 दिन', '3 दिन से अधिक', 'बार-बार होता है'], required: true },
  ],
  general: [
    { key: 'severity', text: 'How severe are your symptoms?', textHi: 'आपके लक्षण कितने गंभीर हैं?', type: 'select', options: ['Mild', 'Moderate', 'Severe'], optionsHi: ['हल्का', 'मध्यम', 'गंभीर'], required: true },
    { key: 'duration', text: 'How long have you been feeling this way?', textHi: 'आप कितने समय से ऐसा महसूस कर रहे हैं?', type: 'select', options: ['Today', 'A few days', 'More than a week', 'Several weeks'], optionsHi: ['आज', 'कुछ दिन', '1 सप्ताह से अधिक', 'कई सप्ताह'], required: true },
    { key: 'sleep', text: 'How is your sleep?', textHi: 'आपकी नींद कैसी है?', type: 'select', options: ['Normal', 'Disturbed', 'Insomnia', 'Excessive'], optionsHi: ['सामान्य', 'बाधित', 'अनिद्रा', 'अत्यधिक'], required: false },
    { key: 'appetite', text: 'How is your appetite?', textHi: 'आपकी भूख कैसी है?', type: 'select', options: ['Normal', 'Reduced', 'Increased'], optionsHi: ['सामान्य', 'कम', 'बढ़ी हुई'], required: false },
  ],
  dermatological: [
    { key: 'location', text: 'Where on the body?', textHi: 'शरीर के किस हिस्से पर?', type: 'select', options: ['Face', 'Arms', 'Legs', 'Torso', 'Scalp', 'Multiple areas'], optionsHi: ['चेहरा', 'बाँहें', 'पैर', 'धड़', 'सिर की त्वचा', 'कई जगह'], required: true },
    { key: 'type', text: 'What type of problem?', textHi: 'किस प्रकार की समस्या है?', type: 'select', options: ['Rash', 'Itching', 'Pimple/Bump', 'Dry patches', 'Discoloration'], optionsHi: ['दाने', 'खुजली', 'फुंसी/उभार', 'सूखे धब्बे', 'रंग बदलना'], required: true },
    { key: 'duration', text: 'How long?', textHi: 'कितने समय से?', type: 'select', options: ['Days', 'Weeks', 'Months', 'Years'], optionsHi: ['दिन', 'हफ्ते', 'महीने', 'साल'], required: true },
  ],
};

const AYUSH_QUESTIONS = [
  { key: 'agni', text: 'How is your digestion (Agni)?', textHi: 'आपकी पाचन शक्ति (अग्नि) कैसी है?', type: 'select', options: ['Strong — digest everything well', 'Variable — sometimes good, sometimes poor', 'Weak — food feels undigested', 'Hyperactive — very fast digestion'], optionsHi: ['मजबूत — सब अच्छी तरह पचता है', 'परिवर्तनशील — कभी अच्छा, कभी खराब', 'कमज़ोर — भोजन अपच लगता है', 'अतिसक्रिय — बहुत तेज़ पाचन'] },
  { key: 'ahara', text: 'Describe your eating habits', textHi: 'अपनी खाने की आदतें बताएं', type: 'select', options: ['Regular meals, moderate quantity', 'Irregular meals', 'Heavy meals, overeating', 'Light meals, small portions'], optionsHi: ['नियमित भोजन, मध्यम मात्रा', 'अनियमित भोजन', 'भारी भोजन, अधिक खाना', 'हल्का भोजन, कम मात्रा'] },
  { key: 'nidra', text: 'How is your sleep (Nidra)?', textHi: 'आपकी नींद (निद्रा) कैसी है?', type: 'select', options: ['7-8 hours, refreshed on waking', 'Less than 6 hours, difficult to fall asleep', 'More than 8 hours, still tired', 'Disturbed, wakes frequently'], optionsHi: ['7-8 घंटे, उठने पर ताज़गी', '6 घंटे से कम, नींद नहीं आती', '8 घंटे से अधिक, फिर भी थकान', 'बाधित, बार-बार जागना'] },
  { key: 'exercise', text: 'Your exercise capacity (Vyayama Shakti)?', textHi: 'आपकी व्यायाम क्षमता (व्यायाम शक्ति)?', type: 'select', options: ['High — can exercise vigorously', 'Moderate — light exercise tolerated', 'Low — minimal activity', 'Varies day to day'], optionsHi: ['उच्च — ज़ोरदार व्यायाम कर सकते हैं', 'मध्यम — हल्का व्यायाम सहनशील', 'कम — न्यूनतम गतिविधि', 'दिन-प्रतिदिन बदलता रहता है'] },
  { key: 'stress', text: 'Your mental stress level (Sattva)?', textHi: 'आपका मानसिक तनाव स्तर (सत्त्व)?', type: 'select', options: ['Calm, balanced mind', 'Moderate stress, manageable', 'High stress, anxious', 'Very high, overwhelmed'], optionsHi: ['शांत, संतुलित मन', 'मध्यम तनाव, संभाल सकते हैं', 'उच्च तनाव, चिंतित', 'बहुत अधिक, अभिभूत'] },
  { key: 'bmi', text: 'Your body build (Samhanana)?', textHi: 'आपका शरीर संरचना (संहनन)?', type: 'select', options: ['Thin, light frame', 'Medium build', 'Heavy, well-built'], optionsHi: ['पतला, हल्का ढांचा', 'मध्यम कद-काठी', 'भारी, मजबूत बनावट'] },
];

export default function PatientIntake() {
  const navigate = useNavigate();
  const [state, setState] = useState<IntakeState>({
    step: 0,
    consentGiven: false,
    language: 'en',
    patientId: null,
    encounterId: null,
    fullName: '',
    age: 30,
    gender: 'MALE',
    phone: '',
    chiefComplaint: '',
    chiefComplaintCategory: '',
    responses: [],
    biomedicalData: {},
    ayurvedicData: {},
    redFlags: [],
  });
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const recognitionRef = useRef<any>(null);

  const lang = state.language;
  const isHi = lang === 'hi';

  const updateState = (partial: Partial<IntakeState>) => {
    setState(prev => ({ ...prev, ...partial }));
  };

  // Step 0: Consent
  const renderConsent = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Shield className="mx-auto h-16 w-16 text-primary-500 mb-4" />
        <h2 className="text-2xl font-serif font-bold text-gray-900">
          {isHi ? 'सहमति और गोपनीयता' : 'Consent & Privacy'}
        </h2>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 space-y-4">
        <h3 className="font-medium text-primary-800">
          {isHi ? 'आपकी जानकारी का उपयोग' : 'How Your Information Will Be Used'}
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <span>{isHi ? 'आपकी स्वास्थ्य जानकारी आपके डॉक्टर के साथ साझा की जाएगी' : 'Your health information will be shared with your doctor'}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <span>{isHi ? 'AI जानकारी को व्यवस्थित करेगा, निदान नहीं करेगा' : 'AI will organize information, not diagnose'}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <span>{isHi ? 'डॉक्टर अंतिम निर्णय लेंगे' : 'The doctor makes all final decisions'}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <span>{isHi ? 'आपका डेटा सुरक्षित है और केवल चिकित्सा उद्देश्यों के लिए उपयोग किया जाएगा' : 'Your data is secure and used only for medical purposes'}</span>
          </li>
        </ul>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          {isHi 
            ? 'AI-जनित सारांश — चिकित्सक द्वारा समीक्षा आवश्यक'
            : 'AI-GENERATED SUMMARY — PHYSICIAN REVIEW REQUIRED'}
        </p>
      </div>

      <label className="flex items-start gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
        <input
          type="checkbox"
          checked={state.consentGiven}
          onChange={(e) => updateState({ consentGiven: e.target.checked })}
          className="mt-1 h-5 w-5 text-primary-600 rounded"
        />
        <span className="text-sm text-gray-700">
          {isHi 
            ? 'मैं अपनी स्वास्थ्य जानकारी के संग्रह और प्रसंस्करण के लिए सहमति देता हूं।'
            : 'I consent to the collection and processing of my health information for consultation purposes.'}
        </span>
      </label>

      <button
        onClick={() => updateState({ step: 1 })}
        disabled={!state.consentGiven}
        className="w-full btn-primary disabled:opacity-50 text-lg py-3"
      >
        {isHi ? 'आगे बढ़ें' : 'Continue'}
        <ArrowRight className="w-5 h-5 ml-2 inline" />
      </button>
    </div>
  );

  // Step 1: Language Selection
  const renderLanguage = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Globe className="mx-auto h-16 w-16 text-primary-500 mb-4" />
        <h2 className="text-2xl font-serif font-bold text-gray-900">
          {isHi ? 'भाषा चुनें' : 'Choose Your Language'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isHi ? 'अपनी पसंदीदा भाषा चुनें' : 'Select your preferred language'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => { updateState({ language: 'en' }); setLanguage('en'); }}
          className={`p-6 border-2 rounded-xl text-center transition-all ${
            state.language === 'en' 
              ? 'border-primary-500 bg-primary-50 shadow-md' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-3xl mb-2">🇬🇧</div>
          <div className="font-medium text-gray-900">English</div>
        </button>
        <button
          onClick={() => { updateState({ language: 'hi' }); setLanguage('hi'); }}
          className={`p-6 border-2 rounded-xl text-center transition-all ${
            state.language === 'hi' 
              ? 'border-primary-500 bg-primary-50 shadow-md' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-3xl mb-2">🇮🇳</div>
          <div className="font-medium text-gray-900">हिन्दी</div>
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={() => updateState({ step: 0 })} className="btn-secondary flex-1">
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          {isHi ? 'वापस' : 'Back'}
        </button>
        <button onClick={() => updateState({ step: 2 })} className="btn-primary flex-1">
          {isHi ? 'आगे बढ़ें' : 'Continue'}
          <ArrowRight className="w-4 h-4 ml-2 inline" />
        </button>
      </div>
    </div>
  );

  // Step 2: Patient Identification
  const renderIdentification = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="mx-auto h-16 w-16 text-primary-500 mb-4" />
        <h2 className="text-2xl font-serif font-bold text-gray-900">
          {isHi ? 'अपनी जानकारी दें' : 'Your Information'}
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isHi ? 'पूरा नाम *' : 'Full Name *'}
          </label>
          <input
            type="text"
            value={state.fullName}
            onChange={(e) => updateState({ fullName: e.target.value })}
            className="input-field"
            placeholder={isHi ? 'अपना पूरा नाम लिखें' : 'Enter your full name'}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isHi ? 'आयु *' : 'Age *'}
            </label>
            <input
              type="number"
              value={state.age}
              onChange={(e) => updateState({ age: parseInt(e.target.value) || 0 })}
              className="input-field"
              min="0"
              max="150"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isHi ? 'लिंग *' : 'Gender *'}
            </label>
            <select
              value={state.gender}
              onChange={(e) => updateState({ gender: e.target.value })}
              className="input-field"
            >
              <option value="MALE">{isHi ? 'पुरुष' : 'Male'}</option>
              <option value="FEMALE">{isHi ? 'महिला' : 'Female'}</option>
              <option value="OTHER">{isHi ? 'अन्य' : 'Other'}</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isHi ? 'फोन नंबर *' : 'Phone Number *'}
          </label>
          <input
            type="tel"
            value={state.phone}
            onChange={(e) => updateState({ phone: e.target.value })}
            className="input-field"
            placeholder="+91-XXXXXXXXXX"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => updateState({ step: 1 })} className="btn-secondary flex-1">
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          {isHi ? 'वापस' : 'Back'}
        </button>
        <button 
          onClick={() => updateState({ step: 3 })}
          disabled={!state.fullName.trim() || !state.phone.trim()}
          className="btn-primary flex-1 disabled:opacity-50"
        >
          {isHi ? 'आगे बढ़ें' : 'Continue'}
          <ArrowRight className="w-4 h-4 ml-2 inline" />
        </button>
      </div>
    </div>
  );

  // Step 3: Chief Complaint Selection
  const renderChiefComplaint = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <MessageCircle className="mx-auto h-16 w-16 text-primary-500 mb-4" />
        <h2 className="text-2xl font-serif font-bold text-gray-900">
          {isHi ? 'मुख्य शिकायत चुनें' : 'What Is Your Main Concern?'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isHi ? 'अपनी मुख्य स्वास्थ्य समस्या चुनें' : 'Select your primary health concern'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CHIEF_COMPLAINTS.map((cc) => (
          <button
            key={cc.key}
            onClick={() => updateState({ 
              chiefComplaint: isHi ? cc.hi : cc.en, 
              chiefComplaintCategory: cc.category,
              step: 4 
            })}
            className={`p-4 border-2 rounded-xl text-center transition-all hover:shadow-md ${
              state.chiefComplaintCategory === cc.category
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            <span className="text-sm font-medium text-gray-900">
              {isHi ? cc.hi : cc.en}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={() => updateState({ step: 2 })} className="btn-secondary flex-1">
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          {isHi ? 'वापस' : 'Back'}
        </button>
      </div>
    </div>
  );

  // Voice/Touch/Text input helper
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error(isHi ? 'आवाज़ इनपुट इस ब्राउज़र में उपलब्ध नहीं है' : 'Voice input not supported in this browser');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = isHi ? 'hi-IN' : 'en-IN';
    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onresult = (event: any) => {
      const text = event.results[event.resultIndex][0].transcript;
      setTranscript(text);
      if (event.results[event.resultIndex].isFinal) {
        setTextInput(text);
        setIsListening(false);
      }
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  // Step 4: Adaptive Interview
  const renderInterview = () => {
    const questions = ADAPTIVE_QUESTIONS[state.chiefComplaintCategory] || ADAPTIVE_QUESTIONS.general;
    const currentQ = questions[state.responses.length];

    if (!currentQ) {
      return (
        <div className="text-center py-12 space-y-4">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-serif font-bold text-gray-900">
            {isHi ? 'साक्षात्कार पूरा हुआ!' : 'Interview Complete!'}
          </h2>
          <p className="text-gray-600">
            {isHi ? 'अगला चरण: जैव-चिकित्सा इतिहास' : 'Next: Biomedical History'}
          </p>
          <button onClick={() => updateState({ step: 5 })} className="btn-primary text-lg px-8 py-3">
            {isHi ? 'आगे बढ़ें' : 'Continue'}
            <ArrowRight className="w-5 h-5 ml-2 inline" />
          </button>
        </div>
      );
    }

    const qText = isHi ? (currentQ.textHi || currentQ.text) : currentQ.text;
    const options = isHi ? (currentQ.optionsHi || currentQ.options) : currentQ.options;

    return (
      <div className="space-y-6">
        <div className="text-center mb-4">
          <div className="text-sm text-gray-500 mb-2">
            {isHi ? 'प्रश्न' : 'Question'} {state.responses.length + 1} / {questions.length}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all" 
              style={{ width: `${((state.responses.length) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{qText}</h3>

          {currentQ.type === 'select' && options && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    updateState({ responses: [...state.responses, { key: currentQ.key, text: currentQ.text, textHi: currentQ.textHi, value: opt, source: 'TEXT' }] });
                  }}
                  className="p-3 border-2 rounded-xl text-left hover:border-primary-400 hover:bg-primary-50 transition-all text-sm"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {currentQ.type === 'boolean' && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => updateState({ responses: [...state.responses, { key: currentQ.key, text: currentQ.text, textHi: currentQ.textHi, value: 'Yes', source: 'TEXT' }] })}
                className="p-4 border-2 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all font-medium"
              >
                {isHi ? 'हां' : 'Yes'}
              </button>
              <button
                onClick={() => updateState({ responses: [...state.responses, { key: currentQ.key, text: currentQ.text, textHi: currentQ.textHi, value: 'No', source: 'TEXT' }] })}
                className="p-4 border-2 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all font-medium"
              >
                {isHi ? 'नहीं' : 'No'}
              </button>
            </div>
          )}

          {/* Voice + Text Input */}
          <div className="border-t pt-4 mt-4 space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isListening ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
                {isHi ? 'बोलें' : 'Speak'}
              </button>
              {isListening && (
                <span className="flex items-center text-red-600 text-sm">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-2" />
                  {isHi ? 'सुन रहा है...' : 'Listening...'}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="input-field flex-1"
                placeholder={isHi ? 'टाइप करें...' : 'Type your answer...'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && textInput.trim()) {
                    updateState({ responses: [...state.responses, { key: currentQ.key, text: currentQ.text, textHi: currentQ.textHi, value: textInput.trim(), source: 'TEXT' }] });
                    setTextInput('');
                    setTranscript('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (textInput.trim()) {
                    updateState({ responses: [...state.responses, { key: currentQ.key, text: currentQ.text, textHi: currentQ.textHi, value: textInput.trim(), source: transcript ? 'VOICE' : 'TEXT' }] });
                    setTextInput('');
                    setTranscript('');
                  }
                }}
                disabled={!textInput.trim()}
                className="btn-primary disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <button onClick={() => updateState({ step: 3 })} className="btn-secondary">
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          {isHi ? 'वापस' : 'Back'}
        </button>
      </div>
    );
  };

  // Step 5: Biomedical History
  const renderBiomedical = () => {
    const [bio, setBio] = useState({
      pastMedical: '',
      pastSurgical: '',
      drugHistory: '',
      allergies: '',
      familyHistory: '',
      personalHistory: '',
    });

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <ClipboardList className="mx-auto h-12 w-12 text-primary-500 mb-3" />
          <h2 className="text-2xl font-serif font-bold text-gray-900">
            {isHi ? 'जैव-चिकित्सा इतिहास' : 'Biomedical History'}
          </h2>
        </div>

        <div className="space-y-4">
          {[
            { key: 'pastMedical', label: isHi ? 'पिछली चिकित्सीय स्थितियां' : 'Past Medical Conditions', placeholder: isHi ? 'जैसे: मधुमेह, उच्च रक्तचाप' : 'e.g., Diabetes, Hypertension' },
            { key: 'pastSurgical', label: isHi ? 'पिछली सर्जरी' : 'Past Surgical History', placeholder: isHi ? 'जैसे: अपेंडेक्टॉमी, घुटने की सर्जरी' : 'e.g., Appendectomy, Knee surgery' },
            { key: 'drugHistory', label: isHi ? 'वर्तमान दवाएं' : 'Current Medications', placeholder: isHi ? 'जैसे: मेटफॉर्मिन, एम्लोडिपिन' : 'e.g., Metformin, Amlodipine' },
            { key: 'allergies', label: isHi ? 'एलर्जी' : 'Allergies', placeholder: isHi ? 'जैसे: पेनिसिलिन, धूल' : 'e.g., Penicillin, Dust' },
            { key: 'familyHistory', label: isHi ? 'पारिवारिक इतिहास' : 'Family History', placeholder: isHi ? 'जैसे: माता-पिता को मधुमेह' : 'e.g., Parents with diabetes' },
            { key: 'personalHistory', label: isHi ? 'व्यक्तिगत इतिहास' : 'Personal History', placeholder: isHi ? 'जैसे: धूम्रपान, व्यायाम की आदतें' : 'e.g., Smoking, Exercise habits' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <textarea
                value={(bio as any)[key]}
                onChange={(e) => setBio({ ...bio, [key]: e.target.value })}
                className="input-field"
                rows={2}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => updateState({ step: 4 })} className="btn-secondary flex-1">
            <ArrowLeft className="w-4 h-4 mr-2 inline" />
            {isHi ? 'वापस' : 'Back'}
          </button>
          <button 
            onClick={() => { updateState({ biomedicalData: bio, step: 6 }); }}
            className="btn-primary flex-1"
          >
            {isHi ? 'आगे बढ़ें' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2 inline" />
          </button>
        </div>
      </div>
    );
  };

  // Step 6: Ayurveda Assessment
  const renderAyurveda = () => {
    const [answers, setAnswers] = useState<Record<string, string>>({});

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <Heart className="mx-auto h-12 w-12 text-primary-500 mb-3" />
          <h2 className="text-2xl font-serif font-bold text-gray-900">
            {isHi ? 'आयुर्वेदिक मूल्यांकन' : 'Ayurveda Assessment'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isHi ? 'अपने शरीर के प्रकार और जीवन शैली के बारे में बताएं' : 'Tell us about your body type and lifestyle'}
          </p>
        </div>

        <div className="space-y-4">
          {AYUSH_QUESTIONS.map((q) => {
            const qText = isHi ? (q.textHi || q.text) : q.text;
            const options = isHi ? (q.optionsHi || q.options) : q.options;
            return (
              <div key={q.key} className="bg-white border rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-3">{qText}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {options?.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswers({ ...answers, [q.key]: opt })}
                      className={`p-2 border-2 rounded-lg text-left text-sm transition-all ${
                        answers[q.key] === opt
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            {isHi 
              ? 'यह मूल्यांकन मार्गदर्शन के लिए है। डॉक्टर इसकी पुष्टि करेंगे।'
              : 'This assessment is for guidance. The doctor will confirm it.'}
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => updateState({ step: 5 })} className="btn-secondary flex-1">
            <ArrowLeft className="w-4 h-4 mr-2 inline" />
            {isHi ? 'वापस' : 'Back'}
          </button>
          <button 
            onClick={() => { updateState({ ayurvedicData: answers, step: 7 }); }}
            className="btn-primary flex-1"
          >
            {isHi ? 'आगे बढ़ें' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2 inline" />
          </button>
        </div>
      </div>
    );
  };

  // Step 7: Documents
  const renderDocuments = () => {
    const [uploaded, setUploaded] = useState<Array<{ name: string; type: string }>>([]);

    const handleUpload = (type: string) => {
      setUploaded([...uploaded, { name: `demo_${type.toLowerCase()}.pdf`, type }]);
      toast.success(isHi ? 'दस्तावेज़ अपलोड किया गया' : 'Document uploaded');
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <FileText className="mx-auto h-12 w-12 text-primary-500 mb-3" />
          <h2 className="text-2xl font-serif font-bold text-gray-900">
            {isHi ? 'पिछले दस्तावेज़' : 'Previous Documents'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isHi ? 'अपने पिछले मेडिकल दस्तावेज़ अपलोड करें' : 'Upload your previous medical documents'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { type: 'Prescription', icon: '💊', label: isHi ? 'प्रिस्क्रिप्शन' : 'Upload Prescription' },
            { type: 'Lab Report', icon: '🔬', label: isHi ? 'लैब रिपोर्ट' : 'Upload Lab Report' },
            { type: 'Discharge Summary', icon: '📋', label: isHi ? 'डिस्चार्ज सारांश' : 'Upload Discharge Summary' },
            { type: 'Other', icon: '📁', label: isHi ? 'अन्य' : 'Upload Other' },
          ].map(({ type, icon, label }) => (
            <button
              key={type}
              onClick={() => handleUpload(type)}
              className="p-4 border-2 border-dashed rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all text-center"
            >
              <div className="text-3xl mb-2">{icon}</div>
              <div className="text-sm font-medium text-gray-700">{label}</div>
            </button>
          ))}
        </div>

        {uploaded.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">{isHi ? 'अपलोड किए गए' : 'Uploaded'}</h3>
            {uploaded.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{doc.type}</p>
                  <p className="text-xs text-gray-500">{doc.name}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  DEMO EXTRACTION
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            {isHi 
              ? 'DEMO/SIMULATED — वास्तविक OCR एकीकरण भविष्य की योजना है'
              : 'DEMO/SIMULATED — Real OCR integration is a roadmap item'}
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => updateState({ step: 6 })} className="btn-secondary flex-1">
            <ArrowLeft className="w-4 h-4 mr-2 inline" />
            {isHi ? 'वापस' : 'Back'}
          </button>
          <button onClick={() => updateState({ step: 8 })} className="btn-primary flex-1">
            {isHi ? 'सारांश देखें' : 'View Summary'}
            <ArrowRight className="w-4 h-4 ml-2 inline" />
          </button>
        </div>
      </div>
    );
  };

  // Step 8: Summary (to be generated via API)
  const renderSummary = () => {
    const [summary, setSummary] = useState('');
    const [generating, setGenerating] = useState(false);
    const [editing, setEditing] = useState(false);

    const handleGenerate = async () => {
      setGenerating(true);
      try {
        // Create patient and encounter first
        const patientRes = await api.post('/patients', {
          fullName: state.fullName,
          age: state.age,
          gender: state.gender,
          phone: state.phone,
          consentGiven: true,
        });
        const patientId = patientRes.data.patient.id;
        updateState({ patientId });

        const encRes = await api.post('/encounters', {
          patientId,
          visitType: 'INITIAL',
          chiefComplaint: state.chiefComplaint,
          language: state.language,
        });
        const encounterId = encRes.data.encounter.id;
        updateState({ encounterId });

        // Save responses
        for (const r of state.responses) {
          await api.post(`/encounters/${encounterId}/responses`, {
            questionKey: r.key,
            questionText: isHi ? r.textHi || r.text : r.text,
            response: r.value,
            language: state.language,
            source: r.source,
          });
        }

        // Save biomedical
        await api.put(`/encounters/${encounterId}/biomedical`, {
          pastMedicalHistory: state.biomedicalData.pastMedical || '',
          medications: state.biomedicalData.drugHistory || '',
          allergies: state.biomedicalData.allergies || '',
          familyHistory: state.biomedicalData.familyHistory || '',
        });

        // Save ayurvedic
        await api.put(`/encounters/${encounterId}/ayurvedic`, {
          agni: state.ayurvedicData.agni || '',
          ahara: state.ayurvedicData.ahara || '',
          nidra: state.ayurvedicData.nidra || '',
        });

        // Generate summary
        const summaryRes = await api.post(`/encounters/${encounterId}/generate-summary`);
        setSummary(summaryRes.data.summary);

        // Check red flags
        const flagsRes = await api.post(`/encounters/${encounterId}/check-red-flags`);
        updateState({ redFlags: flagsRes.data.redFlags });

        toast.success(isHi ? 'सारांश तैयार!' : 'Summary generated!');
      } catch (error) {
        console.error(error);
        toast.error(isHi ? 'सारांश बनाने में विफल' : 'Failed to generate summary');
      } finally {
        setGenerating(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <FileText className="mx-auto h-12 w-12 text-primary-500 mb-3" />
          <h2 className="text-2xl font-serif font-bold text-gray-900">
            {isHi ? 'रोगी सारांश' : 'Patient Summary'}
          </h2>
        </div>

        {state.redFlags.length > 0 && state.redFlags[0].code !== 'NO_FLAGS' && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="font-bold text-red-800">
                  {isHi ? '⚠ प्राथमिकता अलर्ट' : '⚠ PRIORITY ALERT'}
                </p>
                <p className="text-sm text-red-700">
                  {isHi 
                    ? 'संभावित लाल झंडा पकड़ा गया। कृपया ट्रायज स्टाफ को सूचित करें।'
                    : 'Potential red flag detected. Please alert triage staff.'}
                </p>
              </div>
            </div>
            <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
              {isHi ? 'ट्रायज को सूचित करें' : 'Notify Triage'}
            </button>
          </div>
        )}

        {!summary ? (
          <div className="text-center py-8">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary text-lg px-8 py-3"
            >
              {generating ? (
                <Loader2 className="w-5 h-5 mr-2 inline animate-spin" />
              ) : (
                <FileText className="w-5 h-5 mr-2 inline" />
              )}
              {isHi ? 'सारांश जनरेट करें' : 'Generate Summary'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border rounded-xl p-4">
              {editing ? (
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full h-64 p-3 border rounded-lg font-mono text-sm"
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {summary}
                </pre>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setEditing(!editing)} className="btn-secondary flex-1">
                {editing ? (isHi ? 'सहेजें' : 'Save') : (isHi ? 'संपादित करें' : 'Edit')}
              </button>
              <button
                onClick={async () => {
                  if (state.encounterId) {
                    await api.patch(`/encounters/${state.encounterId}/summary`, { summary });
                    await api.post(`/encounters/${state.encounterId}/approve`);
                    toast.success(isHi ? 'अनुमोदित!' : 'Approved!');
                    setEditing(false);
                    updateState({ step: 9 });
                  }
                }}
                className="btn-primary flex-1"
              >
                {isHi ? 'पुष्टि करें और सहेजें' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        )}

        <button onClick={() => updateState({ step: 7 })} className="btn-secondary">
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          {isHi ? 'वापस' : 'Back'}
        </button>
      </div>
    );
  };

  // Step 9: Complete
  const renderComplete = () => (
    <div className="text-center py-12 space-y-6">
      <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
      <h2 className="text-3xl font-serif font-bold text-gray-900">
        {isHi ? 'पूरा हुआ!' : 'Intake Complete!'}
      </h2>
      <p className="text-gray-600 max-w-md mx-auto">
        {isHi 
          ? 'आपकी जानकारी आपके डॉक्टर को भेज दी गई है। कृपया अपने डॉक्टर से मिलें।'
          : 'Your information has been sent to your doctor. Please proceed to meet your doctor.'}
      </p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => navigate('/')} className="btn-primary">
          {isHi ? 'होम पेज' : 'Home'}
        </button>
        {state.patientId && (
          <button onClick={() => navigate(`/patients/${state.patientId}`)} className="btn-secondary">
            {isHi ? 'अपना रिकॉर्ड देखें' : 'View My Record'}
          </button>
        )}
      </div>
    </div>
  );

  const steps = [
    { label: isHi ? 'सहमति' : 'Consent', done: state.step > 0 },
    { label: isHi ? 'भाषा' : 'Language', done: state.step > 1 },
    { label: isHi ? 'पहचान' : 'Identity', done: state.step > 2 },
    { label: isHi ? 'शिकायत' : 'Complaint', done: state.step > 3 },
    { label: isHi ? 'साक्षात्कार' : 'Interview', done: state.step > 4 },
    { label: isHi ? 'इतिहास' : 'History', done: state.step > 5 },
    { label: isHi ? 'आयुर्वेद' : 'Ayurveda', done: state.step > 6 },
    { label: isHi ? 'दस्तावेज़' : 'Documents', done: state.step > 7 },
    { label: isHi ? 'सारांश' : 'Summary', done: state.step > 8 },
  ];

  const renderStep = () => {
    switch (state.step) {
      case 0: return renderConsent();
      case 1: return renderLanguage();
      case 2: return renderIdentification();
      case 3: return renderChiefComplaint();
      case 4: return renderInterview();
      case 5: return renderBiomedical();
      case 6: return renderAyurveda();
      case 7: return renderDocuments();
      case 8: return renderSummary();
      case 9: return renderComplete();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Progress Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between overflow-x-auto">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  state.step === i ? 'bg-primary-600 text-white' :
                  s.done ? 'bg-green-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {s.done ? '✓' : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-6 h-0.5 mx-1 ${s.done ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {renderStep()}
      </div>

      {/* Back to Home */}
      <div className="fixed bottom-4 left-4">
        <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-gray-700">
          ← {isHi ? 'होम' : 'Home'}
        </button>
      </div>
    </div>
  );
}
