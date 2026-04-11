import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Flex,
  Form,
  Input,
  InputNumber,
  Radio,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { InternalUserProfile, TwitchBotConnectionSnapshot } from '@/shared/api';
import {
  connectTwitchBot,
  disconnectTwitchBot,
  getTwitchBotState,
  updateBotAutoConnect,
  updateBotPrompt,
  updateBotSelfReminder,
} from '@/shared/api';
import { FieldLabelWithHelp } from '@/shared/ui/field-label-help';
import {
  DEFAULT_SELF_REMINDER_INTERVAL_SECONDS,
  DEFAULT_SELF_REMINDER_PROMPT,
  DEFAULT_SELF_REMINDER_TEXT,
} from '../lib/defaults';
import { help } from '../lib/twitchBotSettingsHelp';

const { Text } = Typography;

function parseTab(raw: string | null): 'connection' | 'llm' | 'behavior' {
  if (raw === 'llm' || raw === 'behavior') {
    return raw;
  }
  return 'connection';
}

const runtimeLabels: Record<TwitchBotConnectionSnapshot['runtimeStatus'], string> = {
  disconnected: 'Отключён',
  connected: 'Подключён к IRC',
  waiting_for_stream: 'Ожидание стрима',
  stream_offline: 'Стрим офлайн',
  error: 'Ошибка',
};

function formatFetchedAt(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('ru-RU');
}

function saveErrorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Произошла ошибка.';
}

function getReminderFormValues(snapshot: TwitchBotConnectionSnapshot) {
  return {
    selfReminderEnabled: snapshot.selfReminderEnabled ?? false,
    selfReminderIntervalSeconds:
      snapshot.selfReminderIntervalSeconds ?? DEFAULT_SELF_REMINDER_INTERVAL_SECONDS,
    selfReminderMode: (snapshot.selfReminderMode ?? 'text') as 'text' | 'llm_prompt',
    selfReminderText: snapshot.selfReminderText?.trim()
      ? snapshot.selfReminderText
      : DEFAULT_SELF_REMINDER_TEXT,
    selfReminderPrompt: snapshot.selfReminderPrompt?.trim()
      ? snapshot.selfReminderPrompt
      : DEFAULT_SELF_REMINDER_PROMPT,
  };
}

type Props = {
  user: InternalUserProfile;
  onLogout: () => void;
};

export function TwitchBotSettings({ user, onLogout }: Props) {
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseTab(searchParams.get('tab'));

  const [snapshot, setSnapshot] = useState<TwitchBotConnectionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [promptSaving, setPromptSaving] = useState(false);
  const [reminderSaving, setReminderSaving] = useState(false);
  const [promptForm] = Form.useForm<{ prompt: string }>();
  const [reminderForm] = Form.useForm<{
    selfReminderEnabled: boolean;
    selfReminderIntervalSeconds: number;
    selfReminderMode: 'text' | 'llm_prompt';
    selfReminderText: string;
    selfReminderPrompt: string;
  }>();

  const reminderEnabledWatch = Form.useWatch('selfReminderEnabled', reminderForm);
  const reminderModeWatch = Form.useWatch('selfReminderMode', reminderForm);

  const refresh = useCallback(async () => {
    const next = await getTwitchBotState();
    setSnapshot(next);
    promptForm.setFieldsValue({
      prompt: next.prompt,
    });
    reminderForm.setFieldsValue(getReminderFormValues(next));
  }, [promptForm, reminderForm]);

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

  const onTabChange = (key: string) => {
    const nextKey = parseTab(key);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', nextKey);
        return next;
      },
      { replace: true },
    );
  };

  const runAction = async (fn: () => Promise<TwitchBotConnectionSnapshot>) => {
    setActionLoading(true);
    try {
      const next = await fn();
      setSnapshot(next);
      promptForm.setFieldsValue({
        prompt: next.prompt,
      });
      reminderForm.setFieldsValue(getReminderFormValues(next));
    } finally {
      setActionLoading(false);
    }
  };

  const onSavePrompt = async () => {
    const values = await promptForm.validateFields(['prompt']);
    setPromptSaving(true);
    try {
      const next = await updateBotPrompt({ prompt: values.prompt });
      setSnapshot(next);
      reminderForm.setFieldsValue(getReminderFormValues(next));
      message.success('Промпт сохранён.');
    } catch (error) {
      message.error(`Не удалось сохранить: ${saveErrorText(error)}`);
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
      reminderForm.setFieldsValue(getReminderFormValues(next));
      message.success('Настройка автоподключения сохранена.');
    } catch (error) {
      message.error(`Не удалось сохранить: ${saveErrorText(error)}`);
    } finally {
      setActionLoading(false);
    }
  };

  const onSaveReminder = async () => {
    const values = await reminderForm.validateFields();
    setReminderSaving(true);
    try {
      const next = await updateBotSelfReminder({
        selfReminderEnabled: values.selfReminderEnabled,
        selfReminderIntervalSeconds: values.selfReminderIntervalSeconds,
        selfReminderMode: values.selfReminderMode,
        selfReminderText: values.selfReminderText ?? '',
        selfReminderPrompt: values.selfReminderPrompt ?? '',
      });
      setSnapshot(next);
      reminderForm.setFieldsValue(getReminderFormValues(next));
      promptForm.setFieldsValue({ prompt: next.prompt });
      message.success('Настройки напоминаний сохранены.');
    } catch (error) {
      message.error(`Не удалось сохранить: ${saveErrorText(error)}`);
    } finally {
      setReminderSaving(false);
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

      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        items={[
          {
            key: 'connection',
            label: 'Подключение',
            children: (
              <Card
                style={{ width: '100%' }}
                title={
                  <FieldLabelWithHelp
                    label="Состояние и подключение"
                    helpTitle={help.channelStatus.title}
                    helpContent={help.channelStatus.content}
                  />
                }
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Канал">
                      {snapshot.channelDisplayName} ({snapshot.channelLogin})
                    </Descriptions.Item>
                    <Descriptions.Item label="Статус">
                      {runtimeLabels[snapshot.runtimeStatus]}
                    </Descriptions.Item>
                    <Descriptions.Item label="Стрим">
                      {snapshot.streamLive ? 'В эфире' : 'Не в эфире'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Бот включён">
                      {snapshot.enabled ? 'Да' : 'Нет'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Метаданные трансляции">
                      {snapshot.broadcast
                        ? snapshot.broadcast.isLive
                          ? 'Получены для активного стрима'
                          : 'Последняя проверка: стрим офлайн'
                        : 'Ещё не загружены'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Название стрима">
                      {snapshot.broadcast?.title ?? '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Категория">
                      {snapshot.broadcast?.categoryName ?? '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Теги">
                      {snapshot.broadcast && snapshot.broadcast.tags.length > 0 ? (
                        <Space size={[4, 8]} wrap>
                          {snapshot.broadcast.tags.map((tag) => (
                            <Tag key={tag}>{tag}</Tag>
                          ))}
                        </Space>
                      ) : (
                        '—'
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Обновлено">
                      {formatFetchedAt(snapshot.broadcast?.fetchedAt)}
                    </Descriptions.Item>
                  </Descriptions>
                  <Space align="center" wrap>
                    <FieldLabelWithHelp
                      label="Действия"
                      helpTitle={help.connectActions.title}
                      helpContent={help.connectActions.content}
                    />
                    {snapshot.runtimeStatus !== 'connected' ? (
                      <Button
                        type="primary"
                        loading={actionLoading}
                        onClick={() => runAction(connectTwitchBot)}
                      >
                        Ручное подключение
                      </Button>
                    ) : null}
                    {snapshot.runtimeStatus === 'connected' ? (
                      <Button
                        danger
                        loading={actionLoading}
                        onClick={() => runAction(disconnectTwitchBot)}
                      >
                        Отключить
                      </Button>
                    ) : null}
                  </Space>
                  <Form layout="vertical" style={{ marginBottom: 0 }}>
                    <Form.Item
                      style={{ marginBottom: 0 }}
                      label={
                        <FieldLabelWithHelp
                          label="Автоподключение при старте стрима"
                          helpTitle={help.autoConnect.title}
                          helpContent={help.autoConnect.content}
                        />
                      }
                    >
                      <Switch
                        checked={snapshot.autoConnectOnStreamStart}
                        disabled={actionLoading}
                        onChange={onAutoConnectChange}
                      />
                    </Form.Item>
                  </Form>
                </Space>
              </Card>
            ),
          },
          {
            key: 'llm',
            label: 'LLM',
            children: (
              <Card title="Ответы модели">
                <Form form={promptForm} layout="vertical">
                  <Form.Item
                    name="prompt"
                    label={
                      <FieldLabelWithHelp
                        label="Промпт для LLM"
                        helpTitle={help.llmPrompt.title}
                        helpContent={help.llmPrompt.content}
                      />
                    }
                    rules={[{ required: true, message: 'Введите промпт' }]}
                  >
                    <Input.TextArea rows={8} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" onClick={onSavePrompt} loading={promptSaving}>
                      Сохранить промпт
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'behavior',
            label: 'Поведение бота',
            children: (
              <Card title="Напоминания о боте в чате">
                <Form form={reminderForm} layout="vertical">
                  <Form.Item
                    name="selfReminderEnabled"
                    valuePropName="checked"
                    label={
                      <FieldLabelWithHelp
                        label="Включить напоминания"
                        helpTitle={help.selfReminderEnabled.title}
                        helpContent={help.selfReminderEnabled.content}
                      />
                    }
                  >
                    <Switch />
                  </Form.Item>

                  {reminderEnabledWatch === true ? (
                    <>
                      <Form.Item
                        name="selfReminderIntervalSeconds"
                        label={
                          <FieldLabelWithHelp
                            label="Интервал (секунды)"
                            helpTitle={help.selfReminderInterval.title}
                            helpContent={help.selfReminderInterval.content}
                          />
                        }
                        rules={[
                          { required: true, message: 'Укажите интервал' },
                          {
                            type: 'number',
                            min: 60,
                            max: 86400,
                            message: 'От 60 до 86400 секунд',
                          },
                        ]}
                      >
                        <InputNumber
                          min={60}
                          max={86400}
                          style={{ width: '100%', maxWidth: 280 }}
                          addonAfter="сек"
                        />
                      </Form.Item>

                      <Form.Item
                        name="selfReminderMode"
                        label={
                          <FieldLabelWithHelp
                            label="Как отправлять сообщение"
                            helpTitle={help.selfReminderMode.title}
                            helpContent={help.selfReminderMode.content}
                          />
                        }
                        rules={[{ required: true, message: 'Выберите режим' }]}
                      >
                        <Radio.Group>
                          <Radio.Button value="text">Текст</Radio.Button>
                          <Radio.Button value="llm_prompt">Промпт для LLM</Radio.Button>
                        </Radio.Group>
                      </Form.Item>

                      {reminderModeWatch === 'text' ? (
                        <Form.Item
                          name="selfReminderText"
                          label={
                            <FieldLabelWithHelp
                              label="Текст сообщения"
                              helpTitle={help.selfReminderText.title}
                              helpContent={help.selfReminderText.content}
                            />
                          }
                          rules={[
                            {
                              required: true,
                              message: 'Введите текст напоминания',
                            },
                          ]}
                        >
                          <Input.TextArea rows={4} />
                        </Form.Item>
                      ) : null}

                      {reminderModeWatch === 'llm_prompt' ? (
                        <Form.Item
                          name="selfReminderPrompt"
                          label={
                            <FieldLabelWithHelp
                              label="Промпт для генерации"
                              helpTitle={help.selfReminderPrompt.title}
                              helpContent={help.selfReminderPrompt.content}
                            />
                          }
                          rules={[
                            {
                              required: true,
                              message: 'Введите инструкцию для модели',
                            },
                          ]}
                        >
                          <Input.TextArea rows={6} />
                        </Form.Item>
                      ) : null}
                    </>
                  ) : null}

                  <Form.Item>
                    <Button type="primary" onClick={onSaveReminder} loading={reminderSaving}>
                      Сохранить напоминания
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </Space>
  );
}
