import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { t } from '../i18n';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  Loader2,
  Edit,
  Save,
  X
} from 'lucide-react';

interface Encounter {
  id: string;
  patient: {
    fullName: string;
    patientCode: string;
    age: number;
    gender: string;
  };
  chiefComplaint: string;
  duration?: string;
  severity?: number;
  status: string;
  generatedSummary?: string;
  summaryApproved: boolean;
  biomedicalAssessment?: {
    pastMedicalHistory?: string;
    allergies?: string;
    medications?: string;
    familyHistory?: string;
    examinationFindings?: string;
  };
  ayurvedicAssessment?: {
    prakriti?: string;
    vikriti?: string;
    agni?: string;
    ahara?: string;
    nidra?: string;
    bowelPattern?: string;
  };
  vitals?: {
    systolicBP?: number;
    diastolicBP?: number;
    pulse?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    spo2?: number;
  };
  redFlags: Array<{
    level: string;
    reason: string;
  }>;
  interviewResponses: Array<{
    questionKey: string;
    questionText: string;
    response: string;
  }>;
}

export default function Review() {
  const { encounterId } = useParams<{ encounterId: string }>();
  const navigate = useNavigate();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    const fetchEncounter = async () => {
      try {
        const response = await api.get(`/encounters/${encounterId}`);
        setEncounter(response.data.encounter);
        setSummaryText(response.data.encounter.generatedSummary || '');
      } catch (error) {
        console.error('Failed to fetch encounter:', error);
        toast.error('Failed to load encounter');
      } finally {
        setLoading(false);
      }
    };

    if (encounterId) {
      fetchEncounter();
    }
  }, [encounterId]);

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const response = await api.post(`/encounters/${encounterId}/generate-summary`);
      setEncounter(prev => prev ? { ...prev, generatedSummary: response.data.summary } : null);
      setSummaryText(response.data.summary);
      toast.success('Summary generated!');
    } catch (error) {
      toast.error('Failed to generate summary');
      console.error(error);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleSaveSummary = async () => {
    try {
      await api.patch(`/encounters/${encounterId}/summary`, { summary: summaryText });
      setEncounter(prev => prev ? { ...prev, generatedSummary: summaryText } : null);
      setEditingSummary(false);
      toast.success('Summary updated!');
    } catch (error) {
      toast.error('Failed to save summary');
      console.error(error);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.post(`/encounters/${encounterId}/approve`);
      setEncounter(prev => prev ? { ...prev, summaryApproved: true, status: 'APPROVED' } : null);
      toast.success('Case approved!');
    } catch (error) {
      toast.error('Failed to approve case');
      console.error(error);
    } finally {
      setApproving(false);
    }
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            {t('review.title')}
          </h1>
          <p className="text-sm text-gray-500">
            {encounter.patient.fullName} • {encounter.patient.patientCode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {encounter.summaryApproved && (
            <span className="badge badge-normal flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Approved
            </span>
          )}
        </div>
      </div>

      {/* AI Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          <div className="ml-3">
            <p className="text-sm text-yellow-700 font-medium">
              {t('review.aiDisclaimer')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Info */}
        <div className="card">
          <h2 className="text-lg font-serif font-semibold text-gray-900 mb-4">
            Patient Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{encounter.patient.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Patient ID</span>
              <span className="font-mono">{encounter.patient.patientCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Age</span>
              <span className="font-medium">{encounter.patient.age} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Gender</span>
              <span className="font-medium capitalize">{encounter.patient.gender.toLowerCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Visit Date</span>
              <span className="font-medium">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Chief Complaint */}
        <div className="card">
          <h2 className="text-lg font-serif font-semibold text-gray-900 mb-4">
            Chief Complaint
          </h2>
          <p className="text-gray-700">{encounter.chiefComplaint}</p>
          {encounter.duration && (
            <p className="text-sm text-gray-500 mt-2">Duration: {encounter.duration}</p>
          )}
          {encounter.severity && (
            <p className="text-sm text-gray-500">Severity: {encounter.severity}/10</p>
          )}
        </div>

        {/* Vitals */}
        {encounter.vitals && (
          <div className="card">
            <h2 className="text-lg font-serif font-semibold text-gray-900 mb-4">
              {t('review.biomedical')} - Vitals
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {encounter.vitals.systolicBP && encounter.vitals.diastolicBP && (
                <div>
                  <p className="text-sm text-gray-500">Blood Pressure</p>
                  <p className="font-medium">
                    {encounter.vitals.systolicBP}/{encounter.vitals.diastolicBP} mmHg
                  </p>
                </div>
              )}
              {encounter.vitals.pulse && (
                <div>
                  <p className="text-sm text-gray-500">Pulse</p>
                  <p className="font-medium">{encounter.vitals.pulse} bpm</p>
                </div>
              )}
              {encounter.vitals.temperature && (
                <div>
                  <p className="text-sm text-gray-500">Temperature</p>
                  <p className="font-medium">{encounter.vitals.temperature}°C</p>
                </div>
              )}
              {encounter.vitals.spo2 && (
                <div>
                  <p className="text-sm text-gray-500">SpO2</p>
                  <p className="font-medium">{encounter.vitals.spo2}%</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Red Flags */}
        {encounter.redFlags.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-serif font-semibold text-gray-900 mb-4">
              {t('review.redFlags')}
            </h2>
            <div className="space-y-3">
              {encounter.redFlags.map((flag, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg ${
                    flag.level === 'URGENT' ? 'bg-red-50 border border-red-200' :
                    flag.level === 'ATTENTION' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-green-50 border border-green-200'
                  }`}
                >
                  <div className="flex items-center">
                    <AlertTriangle className={`w-4 h-4 mr-2 ${
                      flag.level === 'URGENT' ? 'text-red-600' :
                      flag.level === 'ATTENTION' ? 'text-yellow-600' :
                      'text-green-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      flag.level === 'URGENT' ? 'text-red-800' :
                      flag.level === 'ATTENTION' ? 'text-yellow-800' :
                      'text-green-800'
                    }`}>
                      {flag.level}
                    </span>
                  </div>
                  <p className="text-sm mt-1 text-gray-700">{flag.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-semibold text-gray-900">
            {t('review.aiSummary')}
          </h2>
          <div className="flex items-center gap-2">
            {!encounter.generatedSummary && (
              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className="btn-primary flex items-center"
              >
                {generatingSummary ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {t('review.generateSummary')}
              </button>
            )}
            {encounter.generatedSummary && !editingSummary && (
              <button
                onClick={() => setEditingSummary(true)}
                className="btn-secondary flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                {t('review.editSummary')}
              </button>
            )}
          </div>
        </div>

        {encounter.generatedSummary ? (
          editingSummary ? (
            <div className="space-y-4">
              <textarea
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingSummary(false);
                    setSummaryText(encounter.generatedSummary || '');
                  }}
                  className="btn-secondary flex items-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveSummary}
                  className="btn-primary flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {encounter.generatedSummary}
              </pre>
            </div>
          )
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No summary generated yet. Click the button above to generate one.</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button 
          onClick={() => navigate(`/documents/${encounterId}`)}
          className="btn-secondary flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/patients')}
            className="btn-secondary"
          >
            {t('review.requestMoreInfo')}
          </button>
          <button 
            onClick={handleApprove}
            disabled={approving || encounter.summaryApproved}
            className="btn-primary flex items-center disabled:opacity-50"
          >
            {approving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {t('review.approveCase')}
          </button>
        </div>
      </div>
    </div>
  );
}
