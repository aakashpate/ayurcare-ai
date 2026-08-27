import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'admin@ayurcare.ai': {
    password: 'demo123',
    user: { id: '1', name: 'Admin User', email: 'admin@ayurcare.ai', role: 'admin' }
  },
  'doctor@ayurcare.ai': {
    password: 'demo123',
    user: { id: '2', name: 'Dr. Priya Sharma', email: 'doctor@ayurcare.ai', role: 'doctor' }
  },
  'patient@ayurcare.ai': {
    password: 'demo123',
    user: { id: '3', name: 'Rahul Kumar', email: 'patient@ayurcare.ai', role: 'patient' }
  }
};

const isMockMode = !import.meta.env.VITE_API_URL;

function mockLogin(email: string, password: string): { token: string; user: User } {
  const entry = DEMO_USERS[email];
  if (!entry || entry.password !== password) {
    throw new Error('Invalid credentials');
  }
  return { token: 'mock-token-' + Date.now(), user: entry.user };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        if (isMockMode) {
          const mockUserRaw = localStorage.getItem('mock-user');
          if (mockUserRaw) {
            setUser(JSON.parse(mockUserRaw));
            setToken(storedToken);
          } else {
            localStorage.removeItem('token');
          }
        } else {
          try {
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            const response = await api.get('/auth/me');
            setUser(response.data.user);
            setToken(storedToken);
          } catch {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    if (isMockMode) {
      const result = mockLogin(email, password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('mock-user', JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
      return;
    }

    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = response.data;
    
    localStorage.setItem('token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('mock-user');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
