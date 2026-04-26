export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export type ApiUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'customer' | 'rider';
  email_verified: boolean;
  is_staff: boolean;
};

export type RiderSummary = {
  id: number;
  name: string;
  email: string;
  phone_number: string;
};

export type DeliverySummary = {
  tracking_code: string;
  service_type: string;
  service_type_label: string;
  status: string;
  status_label: string;
  eta_minutes: number;
  recipient_name: string;
  recipient_phone: string;
  pickup_address: string;
  dropoff_address: string;
  item_details: string;
  customer_notes: string;
  created_at: string;
  progress: number;
  checkpoints: Array<{
    label: string;
    detail: string;
    done: boolean;
  }>;
  rider: null | {
    id: number;
    name: string;
    email: string;
    phone_number: string;
  };
};

type RequestOptions = {
  method?: 'GET' | 'POST';
  token?: string | null;
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof payload.detail === 'string' ? payload.detail : 'Request failed.');
  }

  return payload as T;
}

export function getStoredToken() {
  return window.localStorage.getItem('raha-token');
}

export function setStoredToken(token: string) {
  window.localStorage.setItem('raha-token', token);
}

export function clearStoredToken() {
  window.localStorage.removeItem('raha-token');
}
