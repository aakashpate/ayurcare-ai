import { useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardList, HeartPulse, LogOut, ShieldCheck, Stethoscope } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Component as Background } from '@/components/ui/background-snippets';

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-emerald-950 text-white relative overflow-hidden">
      <Background />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.2),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.14),transparent_38%)]" />

      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-400 text-emerald-950 flex items-center justify-center font-bold">AC</div>
            <div>
              <p className="font-serif font-bold text-lg">AyurCare Patient Portal</p>
              <p className="text-xs text-emerald-200/70">Private health intake</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-emerald-100 hover:text-white">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 py-12 lg:py-20">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
          <section>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
              <HeartPulse className="w-4 h-4" />
              Patient account
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-tight">
              Welcome, {user?.name?.split(' ')[0]}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-emerald-100/70 leading-relaxed">
              Share your symptoms and health history before your appointment. Your information is sent securely to your doctor for review.
            </p>
            <button
              onClick={() => navigate('/patient-intake')}
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-emerald-400 px-6 py-3.5 font-semibold text-emerald-950 hover:bg-emerald-300 transition-colors"
            >
              Start health intake
              <ArrowRight className="w-5 h-5" />
            </button>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.07] backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-11 h-11 rounded-xl bg-sky-400/15 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-sky-300" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">How it works</h2>
                <p className="text-sm text-emerald-100/60">Three private, simple steps</p>
              </div>
            </div>
            <div className="space-y-5">
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <div><p className="font-medium">Tell us what you feel</p><p className="text-sm text-emerald-100/60 mt-1">Answer guided questions in English or Hindi.</p></div>
              </div>
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <div><p className="font-medium">Review your information</p><p className="text-sm text-emerald-100/60 mt-1">Confirm your details before securely submitting.</p></div>
              </div>
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <div><p className="font-medium">Meet your doctor</p><p className="text-sm text-emerald-100/60 mt-1">Your doctor reviews the intake and makes all clinical decisions.</p></div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-emerald-100/70"><ShieldCheck className="w-4 h-4 text-emerald-300" /> Secure data</div>
              <div className="flex items-center gap-2 text-emerald-100/70"><Stethoscope className="w-4 h-4 text-emerald-300" /> Doctor reviewed</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
