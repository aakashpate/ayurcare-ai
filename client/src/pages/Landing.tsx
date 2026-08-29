import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Stethoscope, Shield, Heart, Globe, Sun, Moon } from 'lucide-react';
import { Component as Background } from '@/components/ui/background-snippets';
import { setLanguage, getLanguage } from '../i18n';

export default function Landing() {
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

  return (
    <div className="min-h-screen flex flex-col relative bg-white dark:bg-gray-900 transition-colors">
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

      {/* Header */}
      <div className="pt-16 pb-8 text-center px-4">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center shadow-lg">
            <Heart className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-white mb-3">
          {lang === 'hi' ? 'आयुरकेयर एआई' : 'AyurCare AI'}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          {lang === 'hi'
            ? 'AYUSH स्वास्थ्य सेवा के लिए AI-सहायक रोगी मामला लेने का मंच'
            : 'AI-Assisted Patient Case-Taking Platform for AYUSH Healthcare'}
        </p>
      </div>

      {/* Mode Selection */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-lg space-y-6">
          {/* Patient Mode */}
          <button
            onClick={() => navigate('/patient-intake')}
            className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-primary-200 dark:border-primary-700 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-xl transition-all p-8 text-left group"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-2xl flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors">
                <User className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-1">
                  {lang === 'hi' ? 'रोगी' : 'Patient'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {lang === 'hi'
                    ? 'अपने डॉक्टर से मिलने से पहले अपना स्वास्थ्य इतिहास पूरा करें'
                    : 'Complete your health history before meeting your doctor'}
                </p>
              </div>
              <div className="text-primary-400 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Doctor Mode */}
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-xl transition-all p-8 text-left group"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                <Stethoscope className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-1">
                  {lang === 'hi' ? 'डॉक्टर' : 'Doctor'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {lang === 'hi'
                    ? 'क्लिनिकल डैशबोर्ड और रोगी रिकॉर्ड तक पहुंचें'
                    : 'Access the clinical dashboard and patient records'}
                </p>
              </div>
              <div className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Admin Mode */}
          <button
            onClick={() => navigate('/admin-login')}
            className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-red-200 dark:border-red-900/60 hover:border-red-400 dark:hover:border-red-500 hover:shadow-xl transition-all p-8 text-left group"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-2xl flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
                <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-1">
                  {lang === 'hi' ? 'एडमिन' : 'Admin'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {lang === 'hi'
                    ? 'केवल डॉक्टर पंजीकरण और सत्यापन के लिए सुरक्षित प्रवेश'
                    : 'Secure access for doctor registration review and verification'}
                </p>
              </div>
              <div className="text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 pt-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>{lang === 'hi' ? 'सुरक्षित और गोपनीय' : 'Secure & Confidential'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{lang === 'hi' ? 'AYUSH अनुपालित' : 'AYUSH Compliant'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
