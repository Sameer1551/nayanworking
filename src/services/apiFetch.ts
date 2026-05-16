/**
 * apiFetch — a thin wrapper around fetch that:
 *   1. Automatically injects the stored bearer token from localStorage.
 *   2. Intercepts 401/403 responses and redirects to the home page with a
 *      session-expired message, clearing the stale session.
 *
 * Use this instead of raw fetch() for any authenticated supplier API call.
 */

const TOKEN_KEY = 'auth_token';

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('auth_user');
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    console.warn(`apiFetch: received ${response.status} from ${url} — session expired or insufficient permissions.`);
    clearSession();
    // Dispatch an event so any listener (e.g. App.tsx) can react without a hard redirect
    window.dispatchEvent(new CustomEvent('authSessionExpired', {
      detail: { status: response.status, url }
    }));
  }

  return response;
}
