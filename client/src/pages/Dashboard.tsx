import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../i18n';
import api from '../services/api';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  Plus,
  ArrowRight,
  Activity
} from 'lucide-react';

interface DashboardStats {
  totalPatients: number;
  todayCases: number;
  followUpsDue: number;
  urgentReviews: number;
}

interface RecentPatient {
  id: string;
  patientCode: string;
  fullName: string;
  age: number;
  gender: string;
  encounters: Array<{
    chiefComplaint: string;
    status: string;
    createdAt: string;
  }>;
  followUps: Array<{
    scheduledAt: string;
  }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayCases: 0,
    followUpsDue: 0,
    urgentReviews: 0
  });
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [patientsRes, followUpsRes] = await Promise.all([
          api.get('/patients?limit=5'),
          api.get('/follow-ups/due')
        ]);

        const patients = patientsRes.data.patients;
        
        setStats({
          totalPatients: patientsRes.data.pagination.total,
          todayCases: patients.filter((p: RecentPatient) => {
            const today = new Date().toDateString();
            return p.encounters[0]?.createdAt && 
                   new Date(p.encounters[0].createdAt).toDateString() === today;
          }).length,
          followUpsDue: followUpsRes.data.followUps.length,
          urgentReviews: patients.filter((p: RecentPatient) => 
            p.encounters[0]?.status === 'IN_PROGRESS'
          ).length
        });

        setRecentPatients(patients.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const statCards = [
    { name: t('dashboard.totalPatients'), value: stats.totalPatients, icon: Users, color: 'bg-primary-500' },
    { name: t('dashboard.todayCases'), value: stats.todayCases, icon: Activity, color: 'bg-blue-500' },
    { name: t('dashboard.followUpsDue'), value: stats.followUpsDue, icon: Calendar, color: 'bg-yellow-500' },
    { name: t('dashboard.urgentReviews'), value: stats.urgentReviews, icon: AlertTriangle, color: 'bg-red-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            {t('dashboard.greeting')
              .replace('{timeOfDay}', getTimeOfDay())
              .replace('{name}', user?.name?.split(' ')[0] || '')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <Link
          to="/new-case"
          className="mt-4 sm:mt-0 inline-flex items-center btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('dashboard.newCase')}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Patients */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-semibold text-gray-900">
            {t('dashboard.recentPatients')}
          </h2>
          <Link to="/patients" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
            {t('dashboard.viewAll')}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('patients.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('patients.patientId')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('patients.age')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complaint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('patients.status')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-medium">
                          {patient.fullName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <Link 
                          to={`/patients/${patient.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600"
                        >
                          {patient.fullName}
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.patientCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.age}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {patient.encounters[0]?.chiefComplaint || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${
                      patient.encounters[0]?.status === 'APPROVED' ? 'badge-normal' :
                      patient.encounters[0]?.status === 'IN_PROGRESS' ? 'badge-attention' :
                      'badge-normal'
                    }`}>
                      {patient.encounters[0]?.status || 'New'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              AyurCare AI assists with information collection and clinical documentation. 
              It does not provide a final diagnosis or replace professional clinical judgment. 
              All generated summaries and alerts require practitioner review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
