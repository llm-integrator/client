import { Layout } from 'antd';
import { Navigate, Route, Routes } from 'react-router-dom';
import { BotSettingsPage } from '@/pages/bot-settings';
import { LoginPage } from '@/pages/login';
import { ROUTES } from '@/shared/config';

const { Content, Header } = Layout;

export function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          color: '#fff',
          fontWeight: 600,
        }}
      >
        LLM Integrator
      </Header>
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
