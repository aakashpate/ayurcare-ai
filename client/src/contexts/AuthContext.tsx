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
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isMockMode = !import.meta.env.VITE_API_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          if (isMockMode) {
            const mockUser = localStorage.getItem('mock-user');
            if (mockUser) {
              const storedUser = JSON.parse(mockUser) as User;
              if (storedUser.role === 'admin') {
                localStorage.removeItem('token');
                localStorage.removeItem('mock-user');
                setToken(null);
              } else {
                setUser(storedUser);
                setToken(storedToken);
              }
            } else {
              localStorage.removeItem('token');
            }
          } else {
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            const response = await api.get('/auth/me');
            if (response.data.user.role === 'admin') {
              localStorage.removeItem('token');
              delete api.defaults.headers.common['Authorization'];
              setToken(null);
            } else {
              setUser(response.data.user);
              setToken(storedToken);
            }
          }
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('mock-user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = response.data;

    if (userData.role === 'admin') {
      throw new Error('ADMIN_ACCESS_REQUIRES_ADMIN_PORTAL');
    }
    
    localStorage.setItem('token', newToken);
    if (isMockMode) {
      localStorage.setItem('mock-user', JSON.stringify(userData));
    } else {
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    }
    
    setToken(newToken);
    setUser(userData);
    return userData;
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
