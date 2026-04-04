const SESSION_KEY = 'root_session';

export function getSessionToken(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function setSessionToken(token: string): void {
  sessionStorage.setItem(SESSION_KEY, token);
}

export function clearSessionToken(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Reads the session token from the URL hash after an OAuth redirect
 * (`#root_session=<token>`), stores it in sessionStorage, and clears
 * the hash from the address bar so the token is not visible or bookmarkable.
 */
export function consumeOAuthSessionFromHash(): void {
  const hash = window.location.hash;
  if (!hash.startsWith('#')) {
    return;
  }

  const params = new URLSearchParams(hash.slice(1));
  const token = params.get(SESSION_KEY);
  if (!token) {
    return;
  }

  setSessionToken(token);
  history.replaceState(null, '', window.location.pathname + window.location.search);
}
