import { useMemo } from 'react';

export interface AuthUser { id: number; email: string; role: string; }

function parseJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch { return null; }
}

export function useAuth(): { user: AuthUser | null; isAdmin: boolean; isViewer: boolean } {
  return useMemo(() => {
    if (typeof window === 'undefined') return { user: null, isAdmin: false, isViewer: false };
    const token = localStorage.getItem('access_token');
    if (!token) return { user: null, isAdmin: false, isViewer: false };
    const payload = parseJwt(token);
    if (!payload) return { user: null, isAdmin: false, isViewer: false };
    const user: AuthUser = { id: payload.sub, email: payload.email, role: payload.role ?? 'operator' };
    return { user, isAdmin: user.role === 'admin', isViewer: user.role === 'viewer' };
  }, []);
}
