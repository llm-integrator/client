import { Card, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginWithTwitch } from '@/features/login-with-twitch';
import { ApiError, getMe } from '@/shared/api';
import { ROUTES } from '@/shared/config';

export function LoginPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getMe();
        if (!cancelled) navigate(ROUTES.settings, { replace: true });
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          /* stay on login */
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card>
      <LoginWithTwitch />
    </Card>
  );
}
