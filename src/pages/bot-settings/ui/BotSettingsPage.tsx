import { useNavigate } from 'react-router-dom';
import { RequireAuth } from '@/features/auth-guard';
import { TwitchBotSettings } from '@/features/twitch-bot-settings';
import { clearSessionToken, logout } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { useSession } from '@/shared/lib/auth';

function BotSettingsContent() {
  const { user } = useSession();
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      await logout();
    } catch {
      clearSessionToken();
    }
    navigate(ROUTES.login, { replace: true });
  };

  return <TwitchBotSettings user={user} onLogout={onLogout} />;
}

export function BotSettingsPage() {
  return (
    <RequireAuth>
      <BotSettingsContent />
    </RequireAuth>
  );
}
