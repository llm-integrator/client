import { Layout, theme } from 'antd';
import { Navigate, Route, Routes } from 'react-router-dom';
import { BotSettingsPage } from '@/pages/bot-settings';
import { LoginPage } from '@/pages/login';
import { ROUTES } from '@/shared/config';
import { ThemeSwitch } from '@/shared/ui/theme-switch';

const { Content, Header } = Layout;

function AppHeader() {
  const { token } = theme.useToken();

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingInline: 24,
        color: token.colorTextLightSolid,
        fontWeight: 600,
      }}
    >
      <span>LLM Integrator</span>
      <ThemeSwitch />
    </Header>
  );
}

export function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />
      <Content style={{ padding: 24, maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <Routes>
          <Route path="/" element={<Navigate to={ROUTES.login} replace />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.settings} element={<BotSettingsPage />} />
          <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
        </Routes>
      </Content>
    </Layout>
  );
}
