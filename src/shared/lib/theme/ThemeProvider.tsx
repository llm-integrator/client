import { App as AntdApp, ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext } from './theme-context';
import type { ThemeMode } from './types';
import { getInitialTheme, writeStoredTheme } from './storage';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => getInitialTheme());

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    writeStoredTheme(mode);
  }, []);

  const algorithm = themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm;

  const value = useMemo(
    () => ({ themeMode, setThemeMode }),
    [themeMode, setThemeMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider locale={ruRU} theme={{ algorithm }}>
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
