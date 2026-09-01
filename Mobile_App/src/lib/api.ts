const DEFAULT_API_URL = 'http://localhost:4000';

export type Admin = {
  id: string;
  name: string;
  mobile: string;
};

export type BorrowerSummary = {
  id: string;
  name: string;
  fatherOrHusband: string;
  village: string;
  mobile: string;
  monthlyPercentage: number;
  totalGiven: number;
  totalPaid: number;
  outstandingPrincipal: number;
  createdAt: string;
};

type ApiOptions = {
  token?: string | null;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? 'Something went wrong');
  }

  return data as T;
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
