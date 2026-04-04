import { Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InternalUserProfile } from '@/shared/api';
import { getMe } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { AuthProvider } from '@/shared/lib/auth';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<InternalUserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) navigate(ROUTES.login, { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <AuthProvider value={{ user, setUser }}>{children}</AuthProvider>
  );
}
