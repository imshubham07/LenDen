import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { User, apiRequest } from '@/lib/api';

type LoginResponse = {
  token: string;
  user: User;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (mobile: string, password: string) => Promise<void>;
  signup: (name: string, mobile: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoggedIn: Boolean(user && token),
      login: async (mobile: string, password: string) => {
        const response = await apiRequest<LoginResponse>('/api/auth/login', {
          method: 'POST',
          body: { mobile, password },
        });

        setUser(response.user);
        setToken(response.token);
      },
      signup: async (name, mobile, password) => {
        const response = await apiRequest<LoginResponse>('/api/auth/signup', {
          method: 'POST', body: { name, mobile, password },
        });
        setUser(response.user);
        setToken(response.token);
      },
      logout: async () => {
        if (token) {
          await apiRequest('/api/auth/logout', { method: 'POST', token }).catch(() => null);
        }

        setUser(null);
        setToken(null);
      },
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
