import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isMockMode } from '../services/api';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Calendar, 
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { t, setLanguage, getLanguage } from '../i18n';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: t('dashboard.title'), href: '/', icon: LayoutDashboard },
    { name: t('intake.title'), href: '/new-case', icon: UserPlus },
    { name: t('patients.title'), href: '/patients', icon: Users },
    { name: t('followUps.title'), href: '/follow-ups', icon: Calendar },
    { name: t('settings.title'), href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-gray-900 transition-colors">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AC</span>
              </div>
              <span className="ml-2 text-lg font-serif font-bold text-gray-900 dark:text-white">{t('common.appName')}</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                isMockMode 
                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                  : 'bg-green-100 text-green-800 border border-green-200'
              }`}>
                {isMockMode ? 'DEMO' : 'LIVE'}
              </span>
              <button 
                className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Language & Dark Mode Toggles */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <button
                onClick={handleLanguageToggle}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg flex-1 justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                title={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
              >
                <Globe className="w-4 h-4" />
                {lang === 'en' ? 'हिन्दी' : 'English'}
              </button>
              <button
                onClick={() => setDark(!dark)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                title={dark ? 'Light Mode' : 'Dark Mode'}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                <span className="text-primary-700 dark:text-primary-400 font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title={t('auth.logout')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <span className="text-lg font-serif font-bold text-gray-900 dark:text-white">{t('common.appName')}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLanguageToggle}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                title={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
              >
                <Globe className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDark(!dark)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                title={dark ? 'Light Mode' : 'Dark Mode'}
              >
                {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
