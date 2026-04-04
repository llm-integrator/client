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
import type { InternalUserProfile, TwitchBotConnectionSnapshot } from '@/shared/api';
import {
  connectTwitchBot,
  disconnectTwitchBot,
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

type Props = {
  user: InternalUserProfile;
  onLogout: () => void;
};

export function TwitchBotSettings({ user, onLogout }: Props) {
  const [snapshot, setSnapshot] = useState<TwitchBotConnectionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        await refresh();
      } catch (error) {
        if (!cancelled) {
          const nextError =
            error instanceof Error ? error.message : 'Не удалось загрузить данные.';
          setLoadError(nextError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

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

  if (loading) {
    return <Card loading />;
  }

  if (loadError || !snapshot) {
    return (
      <Card>
        <Alert type="error" message={loadError ?? 'Не удалось загрузить данные.'} showIcon />
      </Card>
    );
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
    </Space>
  );
}
