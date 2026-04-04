import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Segmented } from 'antd';
import type { ThemeMode } from '@/shared/lib/theme';
import { useTheme } from '@/shared/lib/theme';

export function ThemeSwitch() {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <Segmented<ThemeMode>
      size="small"
      value={themeMode}
      onChange={setThemeMode}
      options={[
        {
          value: 'light',
          label: (
            <span title="Светлая тема" aria-label="Светлая тема">
              <SunOutlined />
            </span>
          ),
        },
        {
          value: 'dark',
          label: (
            <span title="Тёмная тема" aria-label="Тёмная тема">
              <MoonOutlined />
            </span>
          ),
        },
      ]}
    />
  );
}
