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
  Modal,
  Radio,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  InternalUserProfile,
  TwitchBotConnectionSnapshot,
  UserBalanceQuery,
  UserBalanceSummary,
  UserLlmPreset,
} from '@/shared/api';
import {
  connectTwitchBot,
  disconnectTwitchBot,
  getCurrentUserBalance,
  getCurrentUserLlmPresets,
  getTwitchBotState,
  updateBotAutoConnect,
  updateBotPrompt,
  updateBotSelfReminder,
  updateCurrentUserLlmPreset,
} from '@/shared/api';
import { FieldLabelWithHelp } from '@/shared/ui/field-label-help';
import {
  DEFAULT_SELF_REMINDER_INTERVAL_SECONDS,
  DEFAULT_SELF_REMINDER_PROMPT,
  DEFAULT_SELF_REMINDER_SKIPPED_MESSAGES_THRESHOLD,
  DEFAULT_SELF_REMINDER_TEXT,
} from '../lib/defaults';
import { help } from '../lib/twitchBotSettingsHelp';
import { AccountBalanceTab } from './AccountBalanceTab';

const { Text } = Typography;

type ReminderFormValues = {
  selfReminderEnabled: boolean;
  selfReminderIntervalSeconds: number;
  selfReminderSkippedMessagesThreshold: number;
  selfReminderMode: 'text' | 'llm_prompt';
  selfReminderText: string;
  selfReminderPrompt: string;
};

type PresetFilter = 'all' | 'free' | 'paid';

function parseTab(raw: string | null): 'connection' | 'llm' | 'behavior' | 'account' {
  if (raw === 'llm' || raw === 'behavior' || raw === 'account') {
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

function formatRoundedUsd(value: string): string {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(2)} USD` : `${value} USD`;
}

function normalizeSelfReminderMode(
  mode: TwitchBotConnectionSnapshot['selfReminderMode'] | undefined,
): ReminderFormValues['selfReminderMode'] {
  return mode === 'llm_prompt' ? 'llm_prompt' : 'text';
}

function getReminderFormValues(
  snapshot: TwitchBotConnectionSnapshot,
): ReminderFormValues {
  return {
    selfReminderEnabled: snapshot.selfReminderEnabled ?? false,
    selfReminderIntervalSeconds:
      snapshot.selfReminderIntervalSeconds ?? DEFAULT_SELF_REMINDER_INTERVAL_SECONDS,
    selfReminderSkippedMessagesThreshold:
      snapshot.selfReminderSkippedMessagesThreshold ??
      DEFAULT_SELF_REMINDER_SKIPPED_MESSAGES_THRESHOLD,
    selfReminderMode: normalizeSelfReminderMode(snapshot.selfReminderMode),
    selfReminderText: snapshot.selfReminderText?.trim()
      ? snapshot.selfReminderText
      : DEFAULT_SELF_REMINDER_TEXT,
    selfReminderPrompt: snapshot.selfReminderPrompt?.trim()
      ? snapshot.selfReminderPrompt
      : DEFAULT_SELF_REMINDER_PROMPT,
  };
}

function matchesPresetFilter(preset: UserLlmPreset, filter: PresetFilter): boolean {
  if (filter === 'all') {
    return true;
  }
  return filter === 'free' ? preset.isFree : !preset.isFree;
}

function getPresetFilter(value: string): PresetFilter | null {
  if (value === 'all' || value === 'free' || value === 'paid') {
    return value;
  }
  return null;
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
  const [balanceSummary, setBalanceSummary] = useState<UserBalanceSummary | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [currentLlmPreset, setCurrentLlmPreset] = useState<UserLlmPreset | null>(null);
  const [llmPresets, setLlmPresets] = useState<UserLlmPreset[]>([]);
  const [presetLoading, setPresetLoading] = useState(false);
  const [presetLoadError, setPresetLoadError] = useState<string | null>(null);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [presetSaving, setPresetSaving] = useState(false);
  const [presetDraftId, setPresetDraftId] = useState<string | null>(null);
  const [presetFilter, setPresetFilter] = useState<PresetFilter>('all');
  const [promptForm] = Form.useForm<{ prompt: string }>();
  const [reminderForm] = Form.useForm<ReminderFormValues>();
  const lastLlmPresetRef = useRef<UserLlmPreset | null>(null);

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

  const loadBalance = useCallback(async (params: UserBalanceQuery) => {
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const next = await getCurrentUserBalance(params);
      setBalanceSummary(next);
    } catch (error) {
      setBalanceError(
        error instanceof Error ? error.message : 'Не удалось загрузить баланс.',
      );
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const loadLlmPresets = useCallback(async () => {
    setPresetLoading(true);
    setPresetLoadError(null);
    try {
      const next = await getCurrentUserLlmPresets();
      const previous = lastLlmPresetRef.current;
      if (previous && !previous.isFree && next.currentPreset.isFree) {
        message.info('Баланс исчерпан — выбран бесплатный пресет.');
      }
      lastLlmPresetRef.current = next.currentPreset;
      setCurrentLlmPreset(next.currentPreset);
      setLlmPresets(next.items);
    } catch (error) {
      setPresetLoadError(
        error instanceof Error ? error.message : 'Не удалось загрузить пресеты.',
      );
    } finally {
      setPresetLoading(false);
    }
  }, [message]);

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

  useEffect(() => {
    void loadBalance({ page: 1, pageSize: 20 });
  }, [loadBalance]);

  useEffect(() => {
    if (activeTab === 'llm') {
      void loadLlmPresets();
    }
  }, [activeTab, loadLlmPresets]);

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
        selfReminderSkippedMessagesThreshold:
          values.selfReminderSkippedMessagesThreshold,
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

  const openPresetModal = () => {
    if (!currentLlmPreset) {
      return;
    }
    setPresetDraftId(currentLlmPreset.id);
    setPresetFilter('all');
    setPresetModalOpen(true);
  };

  const saveLlmPreset = async () => {
    if (!presetDraftId) {
      return;
    }
    setPresetSaving(true);
    try {
      const next = await updateCurrentUserLlmPreset({ presetId: presetDraftId });
      lastLlmPresetRef.current = next;
      setCurrentLlmPreset(next);
      setPresetModalOpen(false);
      message.success('Пресет LLM сохранён.');
    } catch (error) {
      message.error(`Не удалось сохранить пресет: ${saveErrorText(error)}`);
    } finally {
      setPresetSaving(false);
    }
  };

  const visibleLlmPresets = llmPresets.filter((preset) =>
    matchesPresetFilter(preset, presetFilter),
  );

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
              <Space align="center" size={8} wrap>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {user.displayName}
                </Typography.Title>
                {balanceSummary ? (
                  <Tag color={balanceSummary.balanceUsd.startsWith('-') ? 'volcano' : 'green'}>
                    Баланс: {formatRoundedUsd(balanceSummary.balanceUsd)}
                  </Tag>
                ) : balanceLoading ? (
                  <Text type="secondary">Баланс загружается…</Text>
                ) : (
                  <Text type="secondary">Баланс недоступен</Text>
                )}
              </Space>
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
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card
                  title="Выбранный пресет"
                  loading={presetLoading}
                  extra={
                    <Button disabled={!currentLlmPreset} onClick={openPresetModal}>
                      Изменить
                    </Button>
                  }
                >
                  {presetLoadError ? (
                    <Alert type="warning" message={presetLoadError} showIcon />
                  ) : currentLlmPreset ? (
                    <Space direction="vertical" size={4}>
                      <Text strong>{currentLlmPreset.name}</Text>
                      <Text type="secondary">{currentLlmPreset.model}</Text>
                      {currentLlmPreset.description ? (
                        <Text type="secondary">{currentLlmPreset.description}</Text>
                      ) : null}
                    </Space>
                  ) : (
                    <Text type="secondary">Пресет пока недоступен.</Text>
                  )}
                </Card>

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
              </Space>
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
                        name="selfReminderSkippedMessagesThreshold"
                        label={
                          <FieldLabelWithHelp
                            label="Пропустить сообщений перед повтором"
                            helpTitle={help.selfReminderSkippedMessagesThreshold.title}
                            helpContent={help.selfReminderSkippedMessagesThreshold.content}
                          />
                        }
                        rules={[
                          { required: true, message: 'Укажите количество сообщений' },
                          {
                            type: 'number',
                            min: 0,
                            max: 1000,
                            message: 'От 0 до 1000 сообщений',
                          },
                        ]}
                        extra="0 — учитывать только интервал"
                      >
                        <InputNumber
                          min={0}
                          max={1000}
                          style={{ width: '100%', maxWidth: 280 }}
                          addonAfter="сообщ."
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
          {
            key: 'account',
            label: 'Счёт',
            children: (
              <AccountBalanceTab
                summary={balanceSummary}
                loading={balanceLoading}
                error={balanceError}
                onLoad={loadBalance}
              />
            ),
          },
        ]}
      />

      <Modal
        title="Выбор LLM-пресета"
        open={presetModalOpen}
        destroyOnClose
        onCancel={() => setPresetModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setPresetModalOpen(false)}>
            Отменить
          </Button>,
          <Button
            key="save"
            type="primary"
            disabled={!presetDraftId}
            loading={presetSaving}
            onClick={() => void saveLlmPreset()}
          >
            Сохранить
          </Button>,
        ]}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Radio.Group
            value={presetFilter}
            disabled={presetSaving}
            onChange={(event) => {
              const nextFilter = getPresetFilter(event.target.value);
              if (nextFilter) {
                setPresetFilter(nextFilter);
              }
            }}
          >
            <Radio.Button value="all">Все</Radio.Button>
            <Radio.Button value="free">Бесплатные</Radio.Button>
            <Radio.Button value="paid">Платные</Radio.Button>
          </Radio.Group>

          {visibleLlmPresets.length === 0 ? (
            <Text type="secondary">Подходящих пресетов нет.</Text>
          ) : (
            visibleLlmPresets.map((preset) => (
              <Card
                key={preset.id}
                size="small"
                style={
                  presetDraftId === preset.id
                    ? { borderColor: 'var(--ant-color-primary)' }
                    : undefined
                }
                title={<Text strong>{preset.name}</Text>}
                extra={
                  <Button
                    type={presetDraftId === preset.id ? 'primary' : 'default'}
                    disabled={presetSaving}
                    onClick={() => setPresetDraftId(preset.id)}
                  >
                    {presetDraftId === preset.id ? 'Выбрано' : 'Выбрать'}
                  </Button>
                }
              >
                <Space direction="vertical" size={4}>
                  <Text type="secondary">{preset.model}</Text>
                  {preset.description ? (
                    <Text type="secondary">{preset.description}</Text>
                  ) : null}
                </Space>
              </Card>
            ))
          )}
        </Space>
      </Modal>
    </Space>
  );
}
