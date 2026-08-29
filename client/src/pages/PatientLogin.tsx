import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, HeartPulse, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Component as Background } from '@/components/ui/background-snippets';

export default function PatientLogin() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    try {
      const user = await login(loginEmail, loginPassword);
      if (user.role !== 'patient') {
        logout();
        throw new Error('This sign-in page is for patients only.');
      }
      navigate('/patient-dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid patient credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950 text-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <Background />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.22),transparent_38%)]" />
      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-emerald-200/70 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to welcome page
        </Link>
        <div className="rounded-3xl border border-white/10 bg-white/[0.08] backdrop-blur-xl p-8 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-400 text-emerald-950 flex items-center justify-center mb-5">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-serif font-bold">Patient sign in</h1>
          <p className="text-emerald-100/60 mt-2">Access your private intake and submitted health records.</p>

          <form onSubmit={e => { e.preventDefault(); signIn(email, password); }} className="space-y-4 mt-7">
            <label className="block">
              <span className="text-sm text-emerald-100/80">Email</span>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-200/40" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-emerald-400 outline-none" placeholder="you@example.com" />
              </div>
            </label>
            <label className="block">
              <span className="text-sm text-emerald-100/80">Password</span>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-200/40" />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-white focus:border-emerald-400 outline-none" />
              </div>
            </label>
            <button disabled={loading} className="w-full rounded-xl bg-emerald-400 py-3 font-semibold text-emerald-950 hover:bg-emerald-300 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <button onClick={() => signIn('patient@ayurcare.ai', 'demo123')} disabled={loading} className="w-full mt-3 rounded-xl border border-white/15 py-3 text-sm font-medium hover:bg-white/10">
            Use patient demo
          </button>
          <p className="text-center text-xs text-emerald-100/40 mt-3">patient@ayurcare.ai / demo123</p>
        </div>
      </div>
    </div>
  );
}
