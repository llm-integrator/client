import { App as AntdApp, ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { BrowserRouter } from 'react-router-dom';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider locale={ruRU}>
      <AntdApp>
        <BrowserRouter>{children}</BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}
