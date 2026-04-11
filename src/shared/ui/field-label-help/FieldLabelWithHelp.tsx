import { InfoCircleOutlined } from '@ant-design/icons';
import { Popover, Space } from 'antd';
import type { ReactNode } from 'react';

type Props = {
  label: ReactNode;
  helpTitle: string;
  helpContent: ReactNode;
};

/**
 * Подпись поля с иконкой (i) и всплывающей справкой (как в админке для графиков).
 */
export function FieldLabelWithHelp({ label, helpTitle, helpContent }: Props) {
  return (
    <Space size={4} align="center" wrap>
      <span>{label}</span>
      <Popover title={helpTitle} content={helpContent} trigger="hover">
        <InfoCircleOutlined
          style={{ cursor: 'pointer' }}
          aria-label={`Справка: ${helpTitle}`}
          role="button"
          tabIndex={0}
        />
      </Popover>
    </Space>
  );
}
