import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../i18n';
import api from '../services/api';
import { Search, Plus, UserPlus, Users } from 'lucide-react';

interface Patient {
  id: string;
  patientCode: string;
  fullName: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  createdAt: string;
  encounters: Array<{
    chiefComplaint: string;
    status: string;
    createdAt: string;
  }>;
  followUps: Array<{
    scheduledAt: string;
  }>;
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const response = await api.get('/patients', {
          params: { search, page, limit: 10 }
        });
        setPatients(response.data.patients);
        setTotalPages(response.data.pagination.pages);
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [search, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-serif font-bold text-gray-900">
          {t('patients.title')}
        </h1>
        <Link
          to="/new-case"
          className="mt-4 sm:mt-0 inline-flex items-center btn-primary"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          {t('patients.newPatient')}
        </Link>
      </div>

      {/* Search */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('patients.search')}
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary">
            {t('common.search')}
          </button>
        </form>
      </div>

      {/* Patient List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="spinner"></div>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('common.noResults')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search ? 'Try a different search term' : 'Get started by creating a new patient'}
            </p>
            <div className="mt-6">
              <Link to="/new-case" className="btn-primary inline-flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                {t('patients.newPatient')}
              </Link>
            </div>
          </div>
        ) : (
          <>
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
                      {t('patients.gender')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('patients.phone')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('patients.lastVisit')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('patients.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {patient.patientCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.age}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {patient.gender.toLowerCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.encounters[0]?.createdAt 
                          ? new Date(patient.encounters[0].createdAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.followUps.length > 0 ? (
                          <span className="badge badge-attention">
                            Follow-up Due
                          </span>
                        ) : patient.encounters[0]?.status === 'APPROVED' ? (
                          <span className="badge badge-normal">
                            Completed
                          </span>
                        ) : patient.encounters[0]?.status === 'IN_PROGRESS' ? (
                          <span className="badge badge-attention">
                            In Progress
                          </span>
                        ) : (
                          <span className="badge bg-gray-100 text-gray-800">
                            New
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
