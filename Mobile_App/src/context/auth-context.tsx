import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { Admin, apiRequest } from '@/lib/api';

type LoginResponse = {
  token: string;
  admin: Admin;
};

type AuthContextValue = {
  admin: Admin | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (mobile: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      token,
      isLoggedIn: Boolean(admin && token),
      login: async (mobile: string, password: string) => {
        const response = await apiRequest<LoginResponse>('/api/auth/admin/login', {
          method: 'POST',
          body: { mobile, password },
        });

        setAdmin(response.admin);
        setToken(response.token);
      },
      logout: async () => {
        if (token) {
          await apiRequest('/api/auth/admin/logout', { method: 'POST', token }).catch(() => null);
        }

        setAdmin(null);
        setToken(null);
      },
    }),
    [admin, token]
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
