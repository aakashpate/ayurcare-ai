import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { t, setLanguage, getLanguage } from '../i18n';
import toast from 'react-hot-toast';
import { Component as Background } from '@/components/ui/background-snippets';
import { Globe, Sun, Moon } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState(getLanguage());
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('ayurcare-dark') === 'true';
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ayurcare-dark', String(dark));
  }, [dark]);

  const handleLanguageToggle = () => {
    const newLang = lang === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
    setLang(newLang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const user = await login(email, password);
      if (user.role !== 'doctor') {
        logout();
        throw new Error('DOCTOR_LOGIN_ONLY');
      }
      navigate('/dashboard');
      toast.success(t('auth.loginSuccess') || 'Login successful!');
    } catch (error: any) {
      const code = error.response?.data?.code || error.message;
      toast.error(
        code === 'DOCTOR_PENDING_VERIFICATION'
          ? 'Your application is waiting for admin verification.'
          : code === 'DOCTOR_APPLICATION_REJECTED'
            ? 'Your doctor application was not approved. Contact AyurCare support.'
            : code === 'DOCTOR_LOGIN_ONLY'
              ? 'This sign-in page is for doctors only.'
              : t('auth.invalidCredentials')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123');
    setLoading(true);
    
    try {
      const user = await login(demoEmail, 'demo123');
      if (user.role !== 'doctor') {
        logout();
        throw new Error('DOCTOR_LOGIN_ONLY');
      }
      navigate('/dashboard');
      toast.success(t('auth.loginSuccess') || 'Demo login successful!');
    } catch {
      toast.error(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative bg-white dark:bg-gray-900 transition-colors">
      <Background />

      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={handleLanguageToggle}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors shadow-sm"
        >
          <Globe className="w-4 h-4" />
          {lang === 'en' ? 'हिन्दी' : 'English'}
        </button>
        <button
          onClick={() => setDark(!dark)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors shadow-sm"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">AC</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-serif font-bold text-gray-900 dark:text-white">
          Doctor sign in
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Access the clinical dashboard with your verified practitioner account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.email')}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.password')}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('common.loading') : t('auth.login')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {lang === 'hi' ? 'डेमो खाता' : 'Demo Account'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => handleDemoLogin('doctor@ayurcare.ai')}
                className="w-full btn-secondary text-sm"
              >
                Doctor Demo
              </button>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>{lang === 'hi' ? 'डेमो पासवर्ड: demo123' : 'Demo password: demo123'}</p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/doctor-register" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 block mb-3">
              New doctor? Create an account
            </Link>
            <Link to="/" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              ← {lang === 'hi' ? 'होम पेज' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
