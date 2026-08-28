import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../i18n';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/dashboard');
      toast.success('Login successful!');
    } catch (error) {
      toast.error(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123');
    setLoading(true);
    
    try {
      await login(demoEmail, 'demo123');
      navigate('/dashboard');
      toast.success('Demo login successful!');
    } catch (error) {
      toast.error(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">AC</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-serif font-bold text-gray-900">
          {t('auth.loginTitle')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('auth.loginSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@ayurcare.ai')}
                className="w-full btn-secondary text-sm"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('doctor@ayurcare.ai')}
                className="w-full btn-secondary text-sm"
              >
                Doctor
              </button>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            <p>Demo password: demo123</p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-primary-600 hover:text-primary-700">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
