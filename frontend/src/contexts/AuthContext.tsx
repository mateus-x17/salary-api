import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { email: string; role: string, id: string, nome: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; role: string, id: string, nome: string } | null>(null);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      // Attempt to validate token by fetching profile
      api.getProfile()
        .then((profile) => {
          setIsAuthenticated(true);
          setUser({ email: profile.email, role: 'USER', id: profile.userId, nome: profile.nome });
        })
        .catch(() => {
          api.logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    const token = api.getToken()!;
    const payload = JSON.parse(atob(token.split('.')[1]));
    setIsAuthenticated(true);
    setUser({ email: payload.email, role: payload.role, id: payload.sub, nome: payload.name });
  };

  const logout = () => {
    api.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
