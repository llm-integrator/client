import { Button, Typography, message } from 'antd';
import { useState } from 'react';
import { startTwitchAuth } from '@/shared/api';
import { ROUTES } from '@/shared/config';

const { Title, Paragraph } = Typography;

export function LoginWithTwitch() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const returnTo = `${window.location.origin}${ROUTES.settings}`;
      const { authorizeUrl } = await startTwitchAuth(returnTo);
      window.location.href = authorizeUrl;
    } catch {
      message.error('Не удалось начать вход. Проверьте доступность API.');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Вход
      </Title>
      <Paragraph type="secondary">
        Войдите через Twitch, чтобы управлять ботом на канале.
      </Paragraph>
      <Button type="primary" size="large" loading={loading} onClick={handleLogin} block>
        Войти через Twitch
      </Button>
    </div>
  );
}
