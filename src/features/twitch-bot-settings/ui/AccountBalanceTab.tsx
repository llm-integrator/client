import {
  Alert,
  Button,
  Card,
  Flex,
  Input,
  Select,
  Space,
  Statistic,
  Table,
  Typography,
} from 'antd';
import { useState } from 'react';
import type {
  UserBalanceLedgerEntry,
  UserBalanceOperationType,
  UserBalanceQuery,
  UserBalanceSummary,
} from '@/shared/api';

type BalanceFilterType = 'all' | UserBalanceOperationType;

type Props = {
  summary: UserBalanceSummary | null;
  loading: boolean;
  error: string | null;
  onLoad: (params: UserBalanceQuery) => void;
};

const { Text } = Typography;

function formatUsd(value: string, maximumFractionDigits = 8): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return `${value} USD`;
  }
  return `${numeric.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits,
  })} USD`;
}

function formatOperation(entry: UserBalanceLedgerEntry): string {
  switch (entry.type) {
    case 'manual_credit':
      return 'Пополнение';
    case 'llm_usage_debit':
      return 'Списание LLM';
    case 'manual_adjustment':
      return entry.amountUsd.startsWith('-')
        ? 'Корректировка: списание'
        : 'Корректировка: пополнение';
  }
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString('ru-RU', { timeZone: 'UTC', timeZoneName: 'short' });
}

function startOfUtcDay(value: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }
  return `${value}T00:00:00.000Z`;
}

function startOfNextUtcDay(value: string): string | undefined {
  const start = startOfUtcDay(value);
  if (!start) {
    return undefined;
  }
  const parsed = new Date(start);
  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toISOString();
}

export function AccountBalanceTab({ summary, loading, error, onLoad }: Props) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [operationType, setOperationType] = useState<BalanceFilterType>('all');
  const [activeFilters, setActiveFilters] = useState<UserBalanceQuery>({
    page: 1,
    pageSize: 20,
  });

  const load = (params: UserBalanceQuery) => {
    setActiveFilters(params);
    onLoad(params);
  };

  const applyFilters = () => {
    load({
      page: 1,
      pageSize: summary?.pageSize ?? 20,
      from: startOfUtcDay(fromDate),
      toExclusive: startOfNextUtcDay(toDate),
      operationType: operationType === 'all' ? undefined : operationType,
    });
  };

  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    setOperationType('all');
    load({ page: 1, pageSize: summary?.pageSize ?? 20 });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="Пополнение баланса"
        description={
          <span>
            Онлайн-пополнение сейчас находится в разработке. Чтобы пополнить счёт,
            напишите администратору в Telegram{' '}
            <a href="https://t.me/Drani4ak" target="_blank" rel="noreferrer">
              @Drani4ak
            </a>{' '}
            и укажите свой Twitch-логин и сумму в USD. После подтверждения средства
            будут зачислены вручную.
          </span>
        }
      />

      <Card title="Счёт">
        <Statistic
          title="Текущий баланс"
          value={summary ? formatUsd(summary.balanceUsd) : '—'}
          loading={loading && summary === null}
        />
      </Card>

      <Card title="Операции">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Flex gap={12} wrap="wrap" align="end">
            <label>
              <Text type="secondary">С</Text>
              <Input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </label>
            <label>
              <Text type="secondary">По</Text>
              <Input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </label>
            <label>
              <Text type="secondary">Тип</Text>
              <Select<BalanceFilterType>
                value={operationType}
                style={{ minWidth: 160 }}
                onChange={setOperationType}
                options={[
                  { value: 'all', label: 'Все операции' },
                  { value: 'credit', label: 'Пополнения' },
                  { value: 'debit', label: 'Списания' },
                ]}
              />
            </label>
            <Button type="primary" onClick={applyFilters}>
              Применить
            </Button>
            <Button onClick={resetFilters}>Сбросить</Button>
          </Flex>
          <Text type="secondary">
            Даты интерпретируются в UTC. Конечная дата включается в период.
          </Text>

          {error ? <Alert type="error" message={error} showIcon /> : null}

          <Table<UserBalanceLedgerEntry>
            rowKey="id"
            loading={loading}
            dataSource={summary?.entries ?? []}
            locale={{ emptyText: 'Операций за выбранный период нет' }}
            columns={[
              {
                title: 'Дата',
                dataIndex: 'createdAt',
                render: (value: string) => formatDate(value),
              },
              {
                title: 'Операция',
                render: (_, entry) => formatOperation(entry),
              },
              {
                title: 'Сумма',
                dataIndex: 'amountUsd',
                render: (value: string) => (
                  <Text type={value.startsWith('-') ? 'danger' : 'success'}>
                    {formatUsd(value)}
                  </Text>
                ),
              },
              {
                title: 'Комментарий',
                dataIndex: 'comment',
                render: (value: string | null) => value ?? '—',
              },
            ]}
            pagination={
              summary
                ? {
                    current: summary.page,
                    pageSize: summary.pageSize,
                    total: summary.total,
                    showSizeChanger: true,
                    onChange: (page, pageSize) => {
                      load({ ...activeFilters, page, pageSize });
                    },
                  }
                : false
            }
          />
        </Space>
      </Card>
    </Space>
  );
}
