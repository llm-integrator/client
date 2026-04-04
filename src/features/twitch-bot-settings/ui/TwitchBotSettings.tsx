import {
  Alert,
  Button,
  Card,
  Descriptions,
  Flex,
  Form,
  Input,
  Space,
  Switch,
  Typography,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import type {
  InternalUserProfile,
  LlmUsageCalendarMonthSummary,
  TwitchBotConnectionSnapshot,
} from '@/shared/api';
import {
  connectTwitchBot,
  disconnectTwitchBot,
  getLlmUsageCalendarMonth,
  getTwitchBotState,
  updateBotAutoConnect,
  updateBotPrompt,
} from '@/shared/api';

const { Text } = Typography;

const runtimeLabels: Record<TwitchBotConnectionSnapshot['runtimeStatus'], string> = {
  disconnected: 'Отключён',
  connected: 'Подключён к IRC',
  waiting_for_stream: 'Ожидание стрима',
  stream_offline: 'Стрим офлайн',
  error: 'Ошибка',
};

const tokenFormatter = new Intl.NumberFormat('ru-RU');
const usdFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 4,
  maximumFractionDigits: 6,
});

function formatTokens(value: number): string {
  return tokenFormatter.format(value);
}

function formatUsd(value: number): string {
  return usdFormatter.format(value);
}

function formatUtcDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

type Props = {
  user: InternalUserProfile;
  onLogout: () => void;
};

export function TwitchBotSettings({ user, onLogout }: Props) {
  const [snapshot, setSnapshot] = useState<TwitchBotConnectionSnapshot | null>(null);
  const [usageSummary, setUsageSummary] = useState<LlmUsageCalendarMonthSummary | null>(
    null,
  );
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [promptSaving, setPromptSaving] = useState(false);
  const [form] = Form.useForm<{ prompt: string }>();

  const refresh = useCallback(async () => {
    const next = await getTwitchBotState();
    setSnapshot(next);
    form.setFieldsValue({
      prompt: next.prompt,
    });
  }, [form]);

  const refreshUsage = useCallback(async () => {
    setUsageError(null);
    const next = await getLlmUsageCalendarMonth();
    setUsageSummary(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setUsageLoading(true);
        await Promise.all([refresh(), refreshUsage()]);
      } catch (error) {
        if (!cancelled) {
          const nextError =
            error instanceof Error ? error.message : 'Не удалось загрузить данные.';
          setUsageError(nextError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setUsageLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh, refreshUsage]);

  const runAction = async (fn: () => Promise<TwitchBotConnectionSnapshot>) => {
    setActionLoading(true);
    try {
      const next = await fn();
      setSnapshot(next);
      form.setFieldsValue({
        prompt: next.prompt,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const onSavePrompt = async () => {
    const values = await form.validateFields(['prompt']);
    setPromptSaving(true);
    try {
      const next = await updateBotPrompt({ prompt: values.prompt });
      setSnapshot(next);
    } finally {
      setPromptSaving(false);
    }
  };

  const onAutoConnectChange = async (checked: boolean) => {
    setActionLoading(true);
    try {
      const next = await updateBotAutoConnect({
        autoConnectOnStreamStart: checked,
      });
      setSnapshot(next);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !snapshot) {
    return <Card loading />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Flex align="center" gap={16} justify="space-between" wrap="wrap">
          <Flex align="center" gap={12}>
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt=""
                width={48}
                height={48}
                style={{ borderRadius: '50%' }}
              />
            ) : null}
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {user.displayName}
              </Typography.Title>
              <Text type="secondary">{user.login}</Text>
            </div>
          </Flex>
          <Button onClick={onLogout}>Выйти</Button>
        </Flex>
      </Card>

      {snapshot.lastError ? (
        <Alert type="error" message={snapshot.lastError} showIcon />
      ) : null}

      <Card title="Состояние бота">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Канал">
            {snapshot.channelDisplayName} ({snapshot.channelLogin})
          </Descriptions.Item>
          <Descriptions.Item label="Статус">{runtimeLabels[snapshot.runtimeStatus]}</Descriptions.Item>
          <Descriptions.Item label="Стрим">
            {snapshot.streamLive ? 'В эфире' : 'Не в эфире'}
          </Descriptions.Item>
          <Descriptions.Item label="Бот включён">{snapshot.enabled ? 'Да' : 'Нет'}</Descriptions.Item>
        </Descriptions>
        <Space style={{ marginTop: 16 }}>
          <Button
            type="primary"
            loading={actionLoading}
            onClick={() => runAction(connectTwitchBot)}
          >
            Подключить
          </Button>
          <Button
            danger
            loading={actionLoading}
            onClick={() => runAction(disconnectTwitchBot)}
          >
            Отключить
          </Button>
        </Space>
      </Card>

      <Card title="Промпт и автоподключение">
        <Form form={form} layout="vertical">
          <Form.Item
            name="prompt"
            label="Промпт для LLM"
            rules={[{ required: true, message: 'Введите промпт' }]}
          >
            <Input.TextArea rows={6} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={onSavePrompt} loading={promptSaving}>
              Сохранить промпт
            </Button>
          </Form.Item>
          <Form.Item label="Автоподключение при старте стрима">
            <Switch
              checked={snapshot.autoConnectOnStreamStart}
              disabled={actionLoading}
              onChange={onAutoConnectChange}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card title="Расход LLM за текущий месяц (UTC)" loading={usageLoading}>
        {usageError ? (
          <Alert type="error" message={usageError} showIcon />
        ) : usageSummary ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Период">
              {formatUtcDate(usageSummary.period.start)} -{' '}
              {formatUtcDate(usageSummary.period.endExclusive)} (не включая конец)
            </Descriptions.Item>
            <Descriptions.Item label="Запросов">
              {formatTokens(usageSummary.requestCount)}
            </Descriptions.Item>
            <Descriptions.Item label="Prompt tokens">
              {formatTokens(usageSummary.totals.promptTokens)}
            </Descriptions.Item>
            <Descriptions.Item label="Completion tokens">
              {formatTokens(usageSummary.totals.completionTokens)}
            </Descriptions.Item>
            <Descriptions.Item label="Всего токенов">
              {formatTokens(usageSummary.totals.totalTokens)}
            </Descriptions.Item>
            <Descriptions.Item label="Себестоимость провайдера">
              {formatUsd(usageSummary.totals.providerCostUsd)}
            </Descriptions.Item>
            <Descriptions.Item label="Стоимость с маржой">
              {formatUsd(usageSummary.totals.billableCostUsd)}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Card>
    </Space>
  );
}
