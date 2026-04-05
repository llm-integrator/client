export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function normalizeBase(base: string): string {
  const t = base.trim();
  if (!t) return '';
  return t.endsWith('/') ? t.slice(0, -1) : t;
}

export function getRootApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL;
  if (typeof raw === 'string' && raw.trim() !== '') {
    return normalizeBase(raw);
  }
  return '/api';
}

export async function rootFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const base = getRootApiBaseUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const token = sessionStorage.getItem('root_session');
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    throw new ApiError(401, 'Требуется авторизация');
  }

  if (!res.ok) {
    const text = await res.text();
    let message = text || res.statusText;
    try {
      const j = JSON.parse(text) as { message?: string | string[] };
      if (typeof j.message === 'string') message = j.message;
      else if (Array.isArray(j.message)) message = j.message.join(', ');
    } catch {
      /* keep text */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  const ct = res.headers.get('content-type');
  if (!ct?.includes('application/json')) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
