import { useState } from 'react';
import { t, setLanguage, getLanguage, getAvailableLanguages } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Save, Globe, User, Building } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [language, setLanguageState] = useState(getLanguage());
  const [clinicName, setClinicName] = useState('AyurCare Demo Clinic');
  const [clinicAddress, setClinicAddress] = useState('123 Wellness Street, New Delhi, India');
  const [clinicPhone, setClinicPhone] = useState('+91-11-12345678');

  const languages = getAvailableLanguages();

  const handleSaveLanguage = () => {
    setLanguage(language);
    toast.success('Language updated!');
  };

  const handleSaveClinic = () => {
    toast.success('Clinic information updated!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-serif font-bold text-gray-900">
        {t('settings.title')}
      </h1>

      {/* Language Settings */}
      <div className="card">
        <div className="flex items-center mb-4">
          <Globe className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-serif font-semibold text-gray-900">
            {t('settings.language')}
          </h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interface Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguageState(e.target.value)}
              className="input-field max-w-xs"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleSaveLanguage}
            className="btn-primary flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Language
          </button>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="card">
        <div className="flex items-center mb-4">
          <User className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-serif font-semibold text-gray-900">
            {t('settings.profile')}
          </h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                className="input-field mt-1 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field mt-1 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <input
                type="text"
                value={user?.role || ''}
                disabled
                className="input-field mt-1 bg-gray-50 capitalize"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Clinic Settings */}
      <div className="card">
        <div className="flex items-center mb-4">
          <Building className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-serif font-semibold text-gray-900">
            {t('settings.clinic')}
          </h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Clinic Name
            </label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="input-field mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              value={clinicAddress}
              onChange={(e) => setClinicAddress(e.target.value)}
              className="input-field mt-1"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              value={clinicPhone}
              onChange={(e) => setClinicPhone(e.target.value)}
              className="input-field mt-1"
            />
          </div>
          
          <button
            onClick={handleSaveClinic}
            className="btn-primary flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Clinic Information
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <h2 className="text-lg font-serif font-semibold text-gray-900 mb-4">
          About AyurCare AI
        </h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>Version:</strong> 1.0.0 (SIH 2026 Prototype)
          </p>
          <p>
            <strong>Problem Statement:</strong> SIH26047 — Patient Case-Taking Software
          </p>
          <p>
            <strong>Ministry:</strong> Ministry of Ayush, Smart India Hackathon 2026
          </p>
          <p className="mt-4 text-gray-500">
            AyurCare AI assists with information collection and clinical documentation. 
            It does not provide a final diagnosis or replace professional clinical judgment. 
            All generated summaries and alerts require practitioner review.
          </p>
        </div>
      </div>
    </div>
  );
}
