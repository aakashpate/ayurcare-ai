import { useNavigate } from 'react-router-dom';
import { User, Stethoscope, Shield, Heart } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-cream-50 to-primary-100 flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-8 text-center px-4">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center shadow-lg">
            <Heart className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-3">
          AyurCare AI
        </h1>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          AI-Assisted Patient Case-Taking Platform for AYUSH Healthcare
        </p>
      </div>

      {/* Mode Selection */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-lg space-y-6">
          {/* Patient Mode */}
          <button
            onClick={() => navigate('/patient-intake')}
            className="w-full bg-white rounded-2xl shadow-lg border-2 border-primary-200 hover:border-primary-400 hover:shadow-xl transition-all p-8 text-left group"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <User className="w-8 h-8 text-primary-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">
                  Patient
                </h2>
                <p className="text-gray-600">
                  Complete your health history before meeting your doctor
                </p>
              </div>
              <div className="text-primary-400 group-hover:text-primary-600 transition-colors">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Doctor Mode */}
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:border-gray-400 hover:shadow-xl transition-all p-8 text-left group"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Stethoscope className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">
                  Doctor
                </h2>
                <p className="text-gray-600">
                  Access the clinical dashboard and patient records
                </p>
              </div>
              <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 pt-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>Secure & Confidential</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>AYUSH Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
