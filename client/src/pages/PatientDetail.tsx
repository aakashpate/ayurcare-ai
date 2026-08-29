import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Activity,
  Clock,
  AlertTriangle,
  Printer,
  QrCode,
  Link as LinkIcon,
  TrendingDown,
  TrendingUp,
  Minus,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Heart,
  X,
  Download
} from 'lucide-react';

interface InterviewResponse {
  questionKey: string;
  questionText: string;
  response: string;
  language?: string;
  source?: string;
}

interface BiomedicalAssessment {
  pastMedicalHistory?: string;
  pastSurgicalHistory?: string;
  allergies?: string;
  medications?: string;
  familyHistory?: string;
  personalHistory?: string;
  examinationFindings?: string;
}

interface AyurvedicAssessment {
  prakriti?: string;
  vikriti?: string;
  agni?: string;
  ahara?: string;
  nidra?: string;
  exercise?: string;
  stress?: string;
  bmi?: string;
  bowelPattern?: string;
}

interface Vitals {
  systolicBP?: number;
  diastolicBP?: number;
  pulse?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  spo2?: number;
}

interface Encounter {
  id: string;
  chiefComplaint: string;
  status: string;
  createdAt: string;
  severity?: number;
  duration?: string;
  generatedSummary?: string;
  summaryApproved: boolean;
  vitals?: Vitals;
  interviewResponses: InterviewResponse[];
  biomedicalAssessment?: BiomedicalAssessment;
  ayurvedicAssessment?: AyurvedicAssessment;
  redFlags: Array<{
    level: string;
    reason: string;
  }>;
  doctorNote?: string;
}

interface FollowUp {
  id: string;
  encounterId: string;
  scheduledAt: string;
  status: string;
  message?: string;
}

interface Patient {
  id: string;
  patientCode: string;
  fullName: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  consentGiven: boolean;
  consentAt?: string;
  createdAt: string;
  encounters: Encounter[];
  documents: Array<{
    id: string;
    filename: string;
    uploadedAt: string;
  }>;
  followUps: FollowUp[];
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedEncounter, setExpandedEncounter] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [followUpDrafts, setFollowUpDrafts] = useState<Record<string, { date: string; time: string; message: string }>>({});
  const [savingSession, setSavingSession] = useState<string | null>(null);

  const generateQR = useCallback(async () => {
    if (!patient) return;
    const latestEncounter = patient.encounters?.[0];
    const payload = {
      id: patient.id,
      patientCode: patient.patientCode,
      name: patient.fullName,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      chiefComplaint: latestEncounter?.chiefComplaint || '',
      visitDate: latestEncounter?.createdAt || patient.createdAt,
      generatedAt: new Date().toISOString()
    };
    const dataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
    setQrDataUrl(dataUrl);
  }, [patient]);

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `patient-qr-${patient?.patientCode || 'unknown'}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await api.get(`/patients/${id}`);
        setPatient(response.data.patient);
      } catch (error) {
        console.error('Failed to fetch patient:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPatient();
    }
  }, [id]);

  const handleExportPDF = async (encounterId: string) => {
    try {
      const response = await api.get(`/reports/${encounterId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `patient-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const toggleEncounter = (encounterId: string) => {
    const encounter = patient?.encounters.find(item => item.id === encounterId);
    const followUp = patient?.followUps.find(item => item.encounterId === encounterId);
    setNoteDrafts(prev => ({ ...prev, [encounterId]: prev[encounterId] ?? encounter?.doctorNote ?? '' }));
    if (!followUpDrafts[encounterId]) {
      const scheduled = followUp ? new Date(followUp.scheduledAt) : null;
      setFollowUpDrafts(prev => ({
        ...prev,
        [encounterId]: {
          date: scheduled ? scheduled.toISOString().slice(0, 10) : '',
          time: scheduled ? scheduled.toTimeString().slice(0, 5) : '',
          message: followUp?.message || ''
        }
      }));
    }
    setExpandedEncounter(expandedEncounter === encounterId ? null : encounterId);
  };

  const saveDoctorNote = async (encounterId: string) => {
    setSavingSession(encounterId);
    try {
      const response = await api.patch(`/encounters/${encounterId}`, { doctorNote: noteDrafts[encounterId] || '' });
      setPatient(prev => prev ? { ...prev, encounters: prev.encounters.map(item => item.id === encounterId ? { ...item, doctorNote: response.data.encounter.doctorNote } : item) } : prev);
      toast.success('Doctor note saved');
    } catch {
      toast.error('Could not save doctor note');
    } finally {
      setSavingSession(null);
    }
  };

  const saveFollowUp = async (encounterId: string) => {
    if (!patient) return;
    const draft = followUpDrafts[encounterId];
    if (!draft?.date || !draft.time) return toast.error('Choose both a follow-up date and time');
    setSavingSession(encounterId);
    try {
      const existing = patient.followUps.find(item => item.encounterId === encounterId);
      const payload = { scheduledAt: new Date(`${draft.date}T${draft.time}`).toISOString(), message: draft.message };
      const response = existing
        ? await api.patch(`/follow-ups/${existing.id}`, payload)
        : await api.post('/follow-ups', { ...payload, patientId: patient.id, encounterId });
      const saved = response.data.followUp;
      setPatient(prev => prev ? { ...prev, followUps: existing ? prev.followUps.map(item => item.id === saved.id ? saved : item) : [...prev.followUps, saved] } : prev);
      toast.success(existing ? 'Follow-up updated and patient notified' : 'Follow-up scheduled and patient notified');
    } catch {
      toast.error('Could not save follow-up');
    } finally {
      setSavingSession(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900">Patient not found</h2>
        <Link to="/patients" className="mt-4 btn-primary inline-block">
          Back to Patients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Link to="/patients" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900">
              {patient.fullName}
            </h1>
            <p className="text-sm text-gray-500">{patient.patientCode}</p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button
            onClick={() => { setQrModalOpen(true); generateQR(); }}
            className="btn-secondary flex items-center"
          >
            <QrCode className="w-4 h-4 mr-2" />
            QR Code
          </button>
          <Link to={`/new-case?patientId=${patient.id}`} className="btn-primary flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            New Visit
          </Link>
        </div>
      </div>

      {/* Patient Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-serif font-semibold text-gray-900 mb-4">Patient Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Age</p>
              <p className="font-medium">{patient.age} years</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium capitalize">{patient.gender.toLowerCase()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{patient.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{patient.email || '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{patient.address || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Emergency Contact</p>
              <p className="font-medium">{patient.emergencyContact || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Consent</p>
              <p className={`font-medium ${patient.consentGiven ? 'text-green-600' : 'text-red-600'}`}>
                {patient.consentGiven ? 'Given' : 'Not Given'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-serif font-semibold text-gray-900 mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total Visits</span>
              <span className="font-semibold">{patient.encounters.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Documents</span>
              <span className="font-semibold">{patient.documents.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Follow-ups</span>
              <span className="font-semibold">{patient.followUps.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Member Since</span>
              <span className="font-semibold">
                {new Date(patient.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <h2 className="text-lg font-serif font-semibold text-gray-900 mb-6">Visit Timeline & History</h2>
        
        {patient.encounters.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No visits yet</p>
            <Link to={`/new-case?patientId=${patient.id}`} className="mt-4 btn-primary inline-block">
              Start First Visit
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {patient.encounters.map((encounter, index) => (
              <div key={encounter.id} className="relative">
                {index !== patient.encounters.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200" />
                )}
                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    encounter.status === 'APPROVED' ? 'bg-green-100' :
                    encounter.status === 'IN_PROGRESS' ? 'bg-yellow-100' :
                    'bg-gray-100'
                  }`}>
                    {encounter.status === 'APPROVED' ? (
                      <Activity className="w-4 h-4 text-green-600" />
                    ) : encounter.status === 'IN_PROGRESS' ? (
                      <Clock className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {encounter.chiefComplaint || 'Visit'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(encounter.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${
                          encounter.status === 'APPROVED' ? 'badge-normal' :
                          encounter.status === 'IN_PROGRESS' ? 'badge-attention' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {encounter.status}
                        </span>
                        <button
                          onClick={() => handleExportPDF(encounter.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Export PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleEncounter(encounter.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          title={expandedEncounter === encounter.id ? 'Collapse' : 'Expand'}
                        >
                          {expandedEncounter === encounter.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {encounter.redFlags.length > 0 && (
                      <div className="mt-2">
                        {encounter.redFlags.map((flag, flagIndex) => (
                          <div 
                            key={flagIndex}
                            className={`inline-flex items-center text-xs px-2 py-1 rounded-full mr-2 ${
                              flag.level === 'URGENT' ? 'bg-red-100 text-red-800' :
                              flag.level === 'ATTENTION' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {flag.reason}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expanded Encounter Details */}
                    {expandedEncounter === encounter.id && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        {/* Vitals */}
                        {encounter.vitals && (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                              <Activity className="w-4 h-4 mr-2" />
                              Vital Signs
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                              {encounter.vitals.systolicBP && encounter.vitals.diastolicBP && (
                                <div>
                                  <span className="text-gray-500">Blood Pressure:</span>
                                  <span className="ml-1 font-medium">{encounter.vitals.systolicBP}/{encounter.vitals.diastolicBP} mmHg</span>
                                </div>
                              )}
                              {encounter.vitals.pulse && (
                                <div>
                                  <span className="text-gray-500">Pulse:</span>
                                  <span className="ml-1 font-medium">{encounter.vitals.pulse} bpm</span>
                                </div>
                              )}
                              {encounter.vitals.temperature && (
                                <div>
                                  <span className="text-gray-500">Temperature:</span>
                                  <span className="ml-1 font-medium">{encounter.vitals.temperature}°C</span>
                                </div>
                              )}
                              {encounter.vitals.spo2 && (
                                <div>
                                  <span className="text-gray-500">SpO2:</span>
                                  <span className="ml-1 font-medium">{encounter.vitals.spo2}%</span>
                                </div>
                              )}
                              {encounter.vitals.weight && (
                                <div>
                                  <span className="text-gray-500">Weight:</span>
                                  <span className="ml-1 font-medium">{encounter.vitals.weight} kg</span>
                                </div>
                              )}
                              {encounter.vitals.height && (
                                <div>
                                  <span className="text-gray-500">Height:</span>
                                  <span className="ml-1 font-medium">{encounter.vitals.height} cm</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Interview Responses */}
                        {encounter.interviewResponses && encounter.interviewResponses.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <ClipboardList className="w-4 h-4 mr-2" />
                              Interview Responses ({encounter.interviewResponses.length})
                            </h4>
                            <div className="space-y-2">
                              {encounter.interviewResponses.map((resp, idx) => (
                                <div key={idx} className="text-sm border-b border-gray-200 pb-2 last:border-0">
                                  <span className="font-medium text-gray-700">{resp.questionText}:</span>
                                  <span className="ml-1 text-gray-600">{resp.response}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Biomedical Assessment */}
                        {encounter.biomedicalAssessment && (
                          <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="font-medium text-green-900 mb-2 flex items-center">
                              <FileText className="w-4 h-4 mr-2" />
                              Biomedical Assessment
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              {encounter.biomedicalAssessment.pastMedicalHistory && (
                                <div>
                                  <span className="text-gray-500">Past Medical:</span>
                                  <p className="mt-1 text-gray-700">{encounter.biomedicalAssessment.pastMedicalHistory}</p>
                                </div>
                              )}
                              {encounter.biomedicalAssessment.pastSurgicalHistory && (
                                <div>
                                  <span className="text-gray-500">Past Surgical:</span>
                                  <p className="mt-1 text-gray-700">{encounter.biomedicalAssessment.pastSurgicalHistory}</p>
                                </div>
                              )}
                              {encounter.biomedicalAssessment.medications && (
                                <div>
                                  <span className="text-gray-500">Current Medications:</span>
                                  <p className="mt-1 text-gray-700">{encounter.biomedicalAssessment.medications}</p>
                                </div>
                              )}
                              {encounter.biomedicalAssessment.allergies && (
                                <div>
                                  <span className="text-gray-500">Allergies:</span>
                                  <p className="mt-1 text-gray-700">{encounter.biomedicalAssessment.allergies}</p>
                                </div>
                              )}
                              {encounter.biomedicalAssessment.familyHistory && (
                                <div>
                                  <span className="text-gray-500">Family History:</span>
                                  <p className="mt-1 text-gray-700">{encounter.biomedicalAssessment.familyHistory}</p>
                                </div>
                              )}
                              {encounter.biomedicalAssessment.personalHistory && (
                                <div>
                                  <span className="text-gray-500">Personal History:</span>
                                  <p className="mt-1 text-gray-700">{encounter.biomedicalAssessment.personalHistory}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Ayurvedic Assessment */}
                        {encounter.ayurvedicAssessment && (
                          <div className="bg-orange-50 rounded-lg p-4">
                            <h4 className="font-medium text-orange-900 mb-2 flex items-center">
                              <Heart className="w-4 h-4 mr-2" />
                              Ayurvedic Assessment
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              {encounter.ayurvedicAssessment.agni && (
                                <div>
                                  <span className="text-gray-500">Agni (Digestive Fire):</span>
                                  <p className="mt-1 text-gray-700">{encounter.ayurvedicAssessment.agni}</p>
                                </div>
                              )}
                              {encounter.ayurvedicAssessment.ahara && (
                                <div>
                                  <span className="text-gray-500">Ahara (Diet):</span>
                                  <p className="mt-1 text-gray-700">{encounter.ayurvedicAssessment.ahara}</p>
                                </div>
                              )}
                              {encounter.ayurvedicAssessment.nidra && (
                                <div>
                                  <span className="text-gray-500">Nidra (Sleep):</span>
                                  <p className="mt-1 text-gray-700">{encounter.ayurvedicAssessment.nidra}</p>
                                </div>
                              )}
                              {encounter.ayurvedicAssessment.exercise && (
                                <div>
                                  <span className="text-gray-500">Vyayama Shakti (Exercise):</span>
                                  <p className="mt-1 text-gray-700">{encounter.ayurvedicAssessment.exercise}</p>
                                </div>
                              )}
                              {encounter.ayurvedicAssessment.stress && (
                                <div>
                                  <span className="text-gray-500">Sattva (Mental Stress):</span>
                                  <p className="mt-1 text-gray-700">{encounter.ayurvedicAssessment.stress}</p>
                                </div>
                              )}
                              {encounter.ayurvedicAssessment.bmi && (
                                <div>
                                  <span className="text-gray-500">Samhanana (Body Build):</span>
                                  <p className="mt-1 text-gray-700">{encounter.ayurvedicAssessment.bmi}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* AI Summary */}
                        {encounter.generatedSummary && (
                          <div className="bg-purple-50 rounded-lg p-4">
                            <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                              <FileText className="w-4 h-4 mr-2" />
                              AI Generated Summary
                              {encounter.summaryApproved && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Approved</span>
                              )}
                            </h4>
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-white p-3 rounded border">
                              {encounter.generatedSummary}
                            </pre>
                          </div>
                        )}

                        {/* Doctor note and patient follow-up */}
                        <div className="grid lg:grid-cols-2 gap-4">
                          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                            <h4 className="font-medium text-blue-900">Doctor note for this session</h4>
                            <p className="text-xs text-blue-700 mt-1">This note will be visible to the patient.</p>
                            <textarea
                              value={noteDrafts[encounter.id] ?? encounter.doctorNote ?? ''}
                              onChange={event => setNoteDrafts(prev => ({ ...prev, [encounter.id]: event.target.value }))}
                              className="mt-3 w-full min-h-28 rounded-lg border border-blue-200 bg-white p-3 text-sm outline-none focus:border-blue-500"
                              placeholder="Add advice, observations, or instructions..."
                            />
                            <button onClick={() => saveDoctorNote(encounter.id)} disabled={savingSession === encounter.id} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Save doctor note</button>
                          </div>

                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <h4 className="font-medium text-amber-900">Schedule or change follow-up</h4>
                            <p className="text-xs text-amber-700 mt-1">The selected date, time, and message will appear in the patient portal.</p>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              <input type="date" value={followUpDrafts[encounter.id]?.date || ''} onChange={event => setFollowUpDrafts(prev => ({ ...prev, [encounter.id]: { date: event.target.value, time: prev[encounter.id]?.time || '', message: prev[encounter.id]?.message || '' } }))} className="rounded-lg border border-amber-200 bg-white p-2.5 text-sm" />
                              <input type="time" value={followUpDrafts[encounter.id]?.time || ''} onChange={event => setFollowUpDrafts(prev => ({ ...prev, [encounter.id]: { date: prev[encounter.id]?.date || '', time: event.target.value, message: prev[encounter.id]?.message || '' } }))} className="rounded-lg border border-amber-200 bg-white p-2.5 text-sm" />
                            </div>
                            <textarea value={followUpDrafts[encounter.id]?.message || ''} onChange={event => setFollowUpDrafts(prev => ({ ...prev, [encounter.id]: { date: prev[encounter.id]?.date || '', time: prev[encounter.id]?.time || '', message: event.target.value } }))} className="mt-3 w-full min-h-20 rounded-lg border border-amber-200 bg-white p-3 text-sm" placeholder="Message for the patient..." />
                            <button onClick={() => saveFollowUp(encounter.id)} disabled={savingSession === encounter.id} className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">Save follow-up and notify patient</button>
                          </div>
                        </div>

                        {/* Action Links */}
                        <div className="flex gap-2">
                          <Link 
                            to={`/review/${encounter.id}`}
                            className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                          >
                            View Full Details →
                          </Link>
                          {encounter.status === 'IN_PROGRESS' && (
                            <Link 
                              to={`/vitals/${encounter.id}`}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center ml-4"
                            >
                              Record Vitals →
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Follow-ups */}
      {patient.followUps.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-serif font-semibold text-gray-900 mb-4">Follow-ups</h2>
          <div className="space-y-3">
            {patient.followUps.map((followUp) => (
              <div 
                key={followUp.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {new Date(followUp.scheduledAt).toLocaleString()}
                  </p>
                  {followUp.message && (
                    <p className="text-sm text-gray-500">{followUp.message}</p>
                  )}
                </div>
                <span className={`badge ${
                  followUp.status === 'COMPLETED' ? 'badge-normal' :
                  followUp.status === 'SCHEDULED' ? 'badge-attention' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {followUp.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Severity Trend */}
      {patient.encounters.length > 1 && (
        <div className="card">
          <h2 className="text-lg font-serif font-semibold text-gray-900 mb-4">Severity Trend</h2>
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {patient.encounters.filter(e => e.severity).map((encounter, index) => {
              const prevEncounter = patient.encounters[index + 1];
              const trend = prevEncounter?.severity 
                ? encounter.severity! - prevEncounter.severity 
                : 0;
              return (
                <div key={encounter.id} className="flex items-center gap-2">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      encounter.severity! >= 8 ? 'text-red-600' :
                      encounter.severity! >= 5 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {encounter.severity}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(encounter.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  {index < patient.encounters.length - 1 && (
                    <div className="flex items-center text-gray-400">
                      {trend < 0 ? <TrendingDown className="w-5 h-5 text-green-500" /> :
                       trend > 0 ? <TrendingUp className="w-5 h-5 text-red-500" /> :
                       <Minus className="w-5 h-5" />}
                      <span className="text-xs ml-1">{trend > 0 ? '+' : ''}{trend}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Documents */}
      {patient.documents.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-serif font-semibold text-gray-900 mb-4">Medical Documents</h2>
          <div className="space-y-2">
            {patient.documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{doc.filename}</p>
                  <p className="text-xs text-gray-500">
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  DEMO EXTRACTION
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABHA/HIS Integration (Prototype) */}
      <div className="card border-2 border-dashed border-gray-300">
        <div className="flex items-center gap-3 mb-4">
          <LinkIcon className="w-6 h-6 text-blue-500" />
          <h2 className="text-lg font-serif font-semibold text-gray-900">Integration Status</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-yellow-400 rounded-full" />
            <div>
              <p className="font-medium text-sm">ABHA (Ayushman Bharat Health Account)</p>
              <p className="text-xs text-gray-500">Prototype Integration — Not connected to production ABDM</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-3 h-3 bg-yellow-400 rounded-full" />
            <div>
              <p className="font-medium text-sm">Hospital Information System (HIS)</p>
              <p className="text-xs text-gray-500">Prototype Integration — Conceptual data flow demonstrated</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="text-xs text-blue-700">
              <strong>Data Flow:</strong> Patient → Structured Clinical Data → Doctor Confirmation → ABHA/ABDM → HIS
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setQrModalOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white">Patient QR Code</h3>
              <button onClick={() => setQrModalOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {qrDataUrl ? (
              <div className="flex flex-col items-center gap-4">
                <img src={qrDataUrl} alt="Patient QR Code" className="rounded-lg border" />
                <p className="text-xs text-gray-500 text-center">
                  Scan to view: {patient?.fullName} ({patient?.patientCode})
                </p>
                <button onClick={handleDownloadQR} className="btn-primary flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download QR
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-400">Generating...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
