import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import PatientIntake from './pages/PatientIntake';
import PatientDashboard from './pages/PatientDashboard';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import NewCase from './pages/NewCase';
import Interview from './pages/Interview';
import Vitals from './pages/Vitals';
import Documents from './pages/Documents';
import Review from './pages/Review';
import FollowUps from './pages/FollowUps';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';

function RoleRoute({ children, role, withLayout = false }: { children: React.ReactNode; role: 'doctor' | 'patient'; withLayout?: boolean }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    const destination = user.role === 'patient'
      ? '/patient-dashboard'
      : user.role === 'doctor'
        ? '/dashboard'
        : '/admin-login';
    return <Navigate to={destination} replace />;
  }

  return withLayout ? <Layout>{children}</Layout> : <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = localStorage.getItem('ayurcare-admin') === 'true';

  if (!isAdmin) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/patient-intake" element={<PatientIntake />} />
          <Route path="/patient-dashboard" element={
            <RoleRoute role="patient">
              <PatientDashboard />
            </RoleRoute>
          } />
          <Route path="/dashboard" element={
            <RoleRoute role="doctor" withLayout>
              <Dashboard />
            </RoleRoute>
          } />
          <Route path="/patients" element={
            <RoleRoute role="doctor" withLayout>
              <Patients />
            </RoleRoute>
          } />
          <Route path="/patients/:id" element={
            <RoleRoute role="doctor" withLayout>
              <PatientDetail />
            </RoleRoute>
          } />
          <Route path="/new-case" element={
            <RoleRoute role="doctor" withLayout>
              <NewCase />
            </RoleRoute>
          } />
          <Route path="/interview/:encounterId" element={
            <RoleRoute role="doctor" withLayout>
              <Interview />
            </RoleRoute>
          } />
          <Route path="/vitals/:encounterId" element={
            <RoleRoute role="doctor" withLayout>
              <Vitals />
            </RoleRoute>
          } />
          <Route path="/documents/:encounterId" element={
            <RoleRoute role="doctor" withLayout>
              <Documents />
            </RoleRoute>
          } />
          <Route path="/review/:encounterId" element={
            <RoleRoute role="doctor" withLayout>
              <Review />
            </RoleRoute>
          } />
          <Route path="/follow-ups" element={
            <RoleRoute role="doctor" withLayout>
              <FollowUps />
            </RoleRoute>
          } />
          <Route path="/settings" element={
            <RoleRoute role="doctor" withLayout>
              <Settings />
            </RoleRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
