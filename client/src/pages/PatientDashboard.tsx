import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, ClipboardList, FileText, HeartPulse, History, LogOut, Plus, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Component as Background } from '@/components/ui/background-snippets';

interface Encounter {
  id: string;
  chiefComplaint: string;
  status: string;
  createdAt: string;
  generatedSummary?: string;
  doctorNote?: string;
  doctor?: { fullName: string; speciality: string; hospital: string };
  followUps?: Array<{ id: string; scheduledAt: string; status: string; message?: string; doctorName?: string }>;
  biomedicalAssessment?: Record<string, string>;
  ayurvedicAssessment?: Record<string, string>;
}

interface PatientRecord {
  id: string;
  patientCode: string;
  fullName: string;
  age: number;
  gender: string;
  phone: string;
  encounters: Encounter[];
}

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/patients/me')
      .then(response => setRecords(response.data.records || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/patient-login');
  };

  const encounters = records.flatMap(record => record.encounters.map(encounter => ({ ...encounter, patient: record })));
  const hasRecords = encounters.length > 0;
  const patientName = records[0]?.fullName || user?.name || 'Patient';

  return (
    <div className="min-h-screen bg-emerald-950 text-white relative overflow-hidden">
      <Background />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.2),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.14),transparent_38%)]" />

      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 min-h-20 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-400 text-emerald-950 flex items-center justify-center font-bold">AC</div>
            <div><p className="font-serif font-bold text-lg">AyurCare Patient Portal</p><p className="text-xs text-emerald-200/70">Private health records</p></div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-emerald-100 hover:text-white"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 py-12 lg:py-16">
        {loading ? (
          <div className="min-h-[420px] flex items-center justify-center"><div className="spinner" /></div>
        ) : !hasRecords ? (
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
            <section>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200"><HeartPulse className="w-4 h-4" /> Patient account</span>
              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-tight">Welcome to AyurCare</h1>
              <p className="mt-5 max-w-xl text-lg text-emerald-100/70 leading-relaxed">Start your first private health intake. Once submitted, this page will become your personal record dashboard.</p>
              <button onClick={() => navigate('/patient-intake')} className="mt-8 inline-flex items-center gap-3 rounded-xl bg-emerald-400 px-6 py-3.5 font-semibold text-emerald-950 hover:bg-emerald-300">Start health intake <ArrowRight className="w-5 h-5" /></button>
            </section>
            <section className="rounded-3xl border border-white/10 bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-7"><div className="w-11 h-11 rounded-xl bg-sky-400/15 flex items-center justify-center"><ClipboardList className="w-5 h-5 text-sky-300" /></div><div><h2 className="font-semibold text-lg">Your first visit</h2><p className="text-sm text-emerald-100/60">Three private, simple steps</p></div></div>
              <div className="space-y-5">
                {['Tell us what you feel', 'Review your information', 'Send it securely to your doctor'].map((text, index) => <div key={text} className="flex gap-4"><span className="w-8 h-8 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center text-sm font-bold flex-shrink-0">{index + 1}</span><p className="font-medium pt-1">{text}</p></div>)}
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4 text-sm"><div className="flex items-center gap-2 text-emerald-100/70"><ShieldCheck className="w-4 h-4 text-emerald-300" /> Secure data</div><div className="flex items-center gap-2 text-emerald-100/70"><Stethoscope className="w-4 h-4 text-emerald-300" /> Doctor reviewed</div></div>
            </section>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
              <div>
                <span className="text-emerald-300 text-sm font-medium">Your health record</span>
                <h1 className="text-4xl sm:text-5xl font-serif font-bold mt-2">Welcome, {patientName}</h1>
                <p className="text-emerald-100/60 mt-2">Your submitted information is collected below for you and your doctor.</p>
              </div>
              <button onClick={() => navigate('/patient-intake')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-emerald-950 hover:bg-emerald-300"><Plus className="w-5 h-5" /> Update symptoms</button>
            </section>

            <section className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5"><UserRound className="w-5 h-5 text-emerald-300" /><p className="text-2xl font-bold mt-4">{records[0]?.patientCode}</p><p className="text-sm text-emerald-100/50 mt-1">Patient ID</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5"><History className="w-5 h-5 text-sky-300" /><p className="text-2xl font-bold mt-4">{encounters.length}</p><p className="text-sm text-emerald-100/50 mt-1">Submitted intakes</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5"><CalendarDays className="w-5 h-5 text-amber-300" /><p className="text-2xl font-bold mt-4">{records[0]?.age}</p><p className="text-sm text-emerald-100/50 mt-1">Age on record</p></div>
            </section>

            <section>
              <h2 className="text-xl font-serif font-bold mb-4">My submitted records</h2>
              <div className="space-y-4">
                {encounters.map(encounter => (
                  <article key={encounter.id} className="rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div><p className="text-xs uppercase tracking-wider text-emerald-300">Chief complaint</p><h3 className="text-xl font-semibold mt-1">{encounter.chiefComplaint || 'General health intake'}</h3><p className="text-sm text-emerald-100/50 mt-2">Submitted {new Date(encounter.createdAt).toLocaleString()}</p>{encounter.doctor && <p className="text-sm text-sky-200 mt-1">Shared with {encounter.doctor.fullName} · {encounter.doctor.speciality}</p>}</div>
                      <span className="self-start rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-200">{encounter.status}</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mt-5">
                      <div className="rounded-xl bg-black/15 p-4"><p className="flex items-center gap-2 text-sm font-medium"><FileText className="w-4 h-4 text-sky-300" /> Medical history</p><p className="text-sm text-emerald-100/60 mt-2">{encounter.biomedicalAssessment?.pastMedicalHistory || 'No past medical history entered'}</p><p className="text-sm text-emerald-100/60 mt-1">Allergies: {encounter.biomedicalAssessment?.allergies || 'None entered'}</p></div>
                      <div className="rounded-xl bg-black/15 p-4"><p className="flex items-center gap-2 text-sm font-medium"><HeartPulse className="w-4 h-4 text-emerald-300" /> Ayurvedic information</p><p className="text-sm text-emerald-100/60 mt-2">Agni: {encounter.ayurvedicAssessment?.agni || 'Not entered'}</p><p className="text-sm text-emerald-100/60 mt-1">Nidra: {encounter.ayurvedicAssessment?.nidra || 'Not entered'}</p></div>
                     </div>
                    {encounter.doctorNote && <div className="mt-4 rounded-xl border border-sky-300/20 bg-sky-400/10 p-4"><p className="text-sm font-medium text-sky-200">Doctor note</p><p className="text-sm text-emerald-50/75 mt-2 whitespace-pre-wrap">{encounter.doctorNote}</p></div>}
                    {encounter.followUps?.map(followUp => <div key={followUp.id} className="mt-4 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-amber-200"><CalendarDays className="w-4 h-4" /> Follow-up appointment</p><p className="text-lg font-medium mt-2">{new Date(followUp.scheduledAt).toLocaleString()}</p>{followUp.message && <p className="text-sm text-emerald-50/70 mt-2">{followUp.message}</p>}<span className="inline-flex mt-3 rounded-full bg-amber-300/15 px-2.5 py-1 text-xs text-amber-100">{followUp.status}</span></div>)}
                    {encounter.generatedSummary && <details className="mt-4 rounded-xl bg-black/15 p-4"><summary className="cursor-pointer text-sm font-medium">View submitted summary</summary><pre className="mt-3 whitespace-pre-wrap text-xs text-emerald-100/60 font-sans">{encounter.generatedSummary}</pre></details>}
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
