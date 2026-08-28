import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { t, getLanguage } from '../i18n';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Mic, 
  MicOff, 
  Send, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Check
} from 'lucide-react';

interface Question {
  key: string;
  text: string;
  type: 'text' | 'select' | 'number' | 'boolean';
  options?: string[];
  required: boolean;
  category: string;
}

interface Encounter {
  id: string;
  chiefComplaint: string;
  duration?: string;
  severity?: number;
  interviewResponses: Array<{
    questionKey: string;
    response: string;
  }>;
}

export default function Interview() {
  const { encounterId } = useParams<{ encounterId: string }>();
  const navigate = useNavigate();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showTranscriptPreview, setShowTranscriptPreview] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const fetchEncounter = async () => {
      try {
        const response = await api.get(`/encounters/${encounterId}`);
        setEncounter(response.data.encounter);
        
        const nextQuestionRes = await api.get(`/encounters/${encounterId}/next-question`);
        setCurrentQuestion(nextQuestionRes.data.question);
      } catch (error) {
        console.error('Failed to fetch encounter:', error);
        toast.error('Failed to load interview');
      } finally {
        setLoading(false);
      }
    };

    if (encounterId) {
      fetchEncounter();
    }
  }, [encounterId]);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice input is not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    
    const lang = getLanguage();
    recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);
      
      if (event.results[current].isFinal) {
        setResponse(transcriptText);
        setShowTranscriptPreview(true);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission denied');
      } else {
        toast.error('Voice input failed. Please try again or type your response.');
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const confirmTranscript = () => {
    setResponse(transcript);
    setShowTranscriptPreview(false);
    setTranscript('');
  };

  const editTranscript = () => {
    setShowTranscriptPreview(false);
    setTranscript('');
  };

  const handleSubmitResponse = async () => {
    if (!currentQuestion || !response.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const lang = getLanguage();
      const source = isListening || transcript ? 'VOICE' : 'TEXT';
      
      await api.post(`/encounters/${encounterId}/responses`, {
        questionKey: currentQuestion.key,
        questionText: currentQuestion.text,
        response: response.trim(),
        language: lang,
        source: source
      });

      setResponse('');
      setTranscript('');
      
      const nextQuestionRes = await api.get(`/encounters/${encounterId}/next-question`);
      setCurrentQuestion(nextQuestionRes.data.question);
      
      if (!nextQuestionRes.data.question) {
        toast.success('Interview completed!');
      }
    } catch (error) {
      toast.error('Failed to save response');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    navigate(`/vitals/${encounterId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!encounter) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900">Encounter not found</h2>
        <button onClick={() => navigate('/new-case')} className="mt-4 btn-primary">
          Start New Case
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            {t('interview.title')}
          </h1>
          <p className="text-sm text-gray-500">
            Chief Complaint: {encounter.chiefComplaint}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Responses: {encounter.interviewResponses.length}
        </div>
      </div>

      {/* Chief Complaint Display */}
      <div className="card bg-primary-50 border-primary-200">
        <h3 className="font-medium text-primary-800 mb-2">Chief Complaint</h3>
        <p className="text-primary-700">{encounter.chiefComplaint}</p>
        {encounter.duration && (
          <p className="text-sm text-primary-600 mt-1">Duration: {encounter.duration}</p>
        )}
        {encounter.severity && (
          <p className="text-sm text-primary-600">Severity: {encounter.severity}/10</p>
        )}
      </div>

      {/* Current Question */}
      {currentQuestion ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className={`badge ${
              currentQuestion.category === 'biomedical' ? 'bg-blue-100 text-blue-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {currentQuestion.category}
            </span>
            {currentQuestion.required && (
              <span className="text-sm text-red-600">{t('common.required')}</span>
            )}
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {currentQuestion.text}
          </h3>

          {currentQuestion.type === 'text' && (
            <div className="space-y-4">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Type your response..."
              />
              
              {/* Voice Input Button */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isListening 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-5 h-5 mr-2" />
                      {t('interview.stopListening')}
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      {t('interview.voiceInput')}
                    </>
                  )}
                </button>
                
                {isListening && (
                  <div className="flex items-center text-red-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-2" />
                    {t('interview.listening')}
                  </div>
                )}
              </div>

              {/* Transcript Preview */}
              {showTranscriptPreview && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">{t('interview.transcriptPreview')}</p>
                  <p className="text-gray-700 mb-3">{transcript}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={confirmTranscript}
                      className="btn-primary text-sm flex items-center"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {t('interview.confirmTranscript')}
                    </button>
                    <button
                      onClick={editTranscript}
                      className="btn-secondary text-sm"
                    >
                      {t('interview.editTranscript')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentQuestion.type === 'select' && currentQuestion.options && (
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => setResponse(option)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    response === option
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === 'number' && (
            <input
              type="number"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="input-field"
              min="1"
              max="10"
            />
          )}

          {currentQuestion.type === 'boolean' && (
            <div className="flex gap-4">
              <button
                onClick={() => setResponse('Yes')}
                className={`flex-1 p-4 rounded-lg border text-center font-medium transition-colors ${
                  response === 'Yes'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {t('common.yes')}
              </button>
              <button
                onClick={() => setResponse('No')}
                className={`flex-1 p-4 rounded-lg border text-center font-medium transition-colors ${
                  response === 'No'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {t('common.no')}
              </button>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmitResponse}
              disabled={!response.trim() || submitting}
              className="btn-primary flex items-center disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {t('common.submit')}
            </button>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('interview.noMoreQuestions')}
          </h3>
          <p className="text-gray-500 mb-6">
            You've completed the interview. You can now proceed to enter vitals.
          </p>
          <button onClick={handleFinish} className="btn-primary flex items-center mx-auto">
            {t('common.next')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}

      {/* Previous Responses */}
      {encounter.interviewResponses.length > 0 && (
        <div className="card">
          <h3 className="font-medium text-gray-900 mb-4">Previous Responses</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {encounter.interviewResponses.map((resp, index) => (
              <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs text-primary-700">{index + 1}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{resp.questionKey}</p>
                  <p className="text-gray-700">{resp.response}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button 
          onClick={() => navigate('/new-case')}
          className="btn-secondary flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </button>
        {!currentQuestion && (
          <button 
            onClick={handleFinish}
            className="btn-primary flex items-center"
          >
            {t('common.next')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
}
