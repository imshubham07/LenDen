import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = '4000';
const PRODUCTION_API_URL = 'https://lenden-ojfx.onrender.com';
const LOCALHOST_API_URL = `http://localhost:${API_PORT}`;

function getHostFromUri(uri?: string | null) {
  return uri?.replace(/^https?:\/\//, '').split(':')[0] ?? null;
}

function getExpoHostApiUrl() {
  const host = getHostFromUri(Constants.expoConfig?.hostUri)
    ?? getHostFromUri(Constants.expoGoConfig?.debuggerHost);
  return host ? `http://${host}:${API_PORT}` : null;
}

function getDefaultApiUrl() {
  if (!__DEV__) return PRODUCTION_API_URL;
  if (Platform.OS === 'web') return PRODUCTION_API_URL;
  return getExpoHostApiUrl() ?? (Platform.OS === 'android' ? `http://10.0.2.2:${API_PORT}` : LOCALHOST_API_URL);
}

export type User = {
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

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? getDefaultApiUrl();

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error(`Cannot reach backend at ${API_BASE_URL}`);
  }

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
