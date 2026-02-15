export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
    token?: string | null;
}

export async function apiFetch(endpoint: string, options: FetchOptions = {}) {
    const { token, ...fetchOptions } = options;

    const headers = new Headers(fetchOptions.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    if (res.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    }

    return res;
}

export async function apiGet(endpoint: string, token?: string | null) {
    return apiFetch(endpoint, { method: 'GET', token });
}

export async function apiPost(endpoint: string, body: any, token?: string | null) {
    return apiFetch(endpoint, {
        method: 'POST',
        token,
        body: JSON.stringify(body),
    });
}
