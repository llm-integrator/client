/** Mirrors server `apps/shared/src/contracts.ts` for browser-facing root API. */

export interface InternalUserProfile {
  id: string;
  twitchUserId: string;
  login: string;
  displayName: string;
  profileImageUrl?: string | null;
  isAdmin: boolean;
}

export interface TwitchBroadcastMetadata {
  isLive: boolean;
  title: string | null;
  categoryName: string | null;
  tags: string[];
  fetchedAt: string;
}

export interface TwitchBotConnectionSnapshot {
  userId: string;
  channelLogin: string;
  channelDisplayName: string;
  channelTwitchUserId: string;
  enabled: boolean;
  autoConnectOnStreamStart: boolean;
  runtimeStatus:
    | 'disconnected'
    | 'connected'
    | 'waiting_for_stream'
    | 'stream_offline'
    | 'error';
  streamLive: boolean;
  prompt: string;
  selfReminderEnabled: boolean;
  selfReminderIntervalSeconds: number;
  selfReminderSkippedMessagesThreshold: number;
  selfReminderMode: 'text' | 'llm_prompt';
  selfReminderText: string;
  selfReminderPrompt: string;
  lastBotMessageAt?: string | null;
  lastError?: string | null;
  lastStreamLiveAt?: string | null;
  lastStreamEndedAt?: string | null;
  lastJoinAt?: string | null;
  lastPartAt?: string | null;
  broadcast: TwitchBroadcastMetadata | null;
}

export interface LlmUsageTotals {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  providerCostUsd: number;
}

export interface LlmUsagePeriod {
  start: string;
  endExclusive: string;
}

export interface LlmUsageCalendarMonthSummary {
  period: LlmUsagePeriod;
  requestCount: number;
  totals: LlmUsageTotals;
}

export type UserBalanceLedgerEntryType =
  | 'manual_credit'
  | 'llm_usage_debit'
  | 'manual_adjustment';

export type UserBalanceOperationType = 'credit' | 'debit';

export interface UserBalanceLedgerEntry {
  id: string;
  type: UserBalanceLedgerEntryType;
  /** Signed exact USD decimal. */
  amountUsd: string;
  createdAt: string;
  comment: string | null;
  createdByAdminId: string | null;
}

export interface UserBalanceSummary {
  currency: 'USD';
  balanceUsd: string;
  entries: UserBalanceLedgerEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserBalanceQuery {
  page?: number;
  pageSize?: number;
  from?: string;
  toExclusive?: string;
  operationType?: UserBalanceOperationType;
}

export interface TwitchAuthStartResponse {
  authorizeUrl: string;
}

export interface TwitchAuthCallbackResponse {
  authenticated: boolean;
  sessionToken: string;
  returnTo: string | null;
  user: InternalUserProfile;
  connection: TwitchBotConnectionSnapshot;
}

export interface UpdateUserPromptRequest {
  prompt: string;
}

export interface UpdateAutoConnectRequest {
  autoConnectOnStreamStart: boolean;
}

export interface UpdateSelfReminderRequest {
  selfReminderEnabled: boolean;
  selfReminderIntervalSeconds: number;
  selfReminderSkippedMessagesThreshold: number;
  selfReminderMode: 'text' | 'llm_prompt';
  selfReminderText: string;
  selfReminderPrompt: string;
}

/** A user-facing LLM preset without generation implementation details. */
export interface UserLlmPreset {
  id: string;
  name: string;
  model: string;
  description: string | null;
  /** Used to filter choices; the UI does not need to display this value. */
  isFree: boolean;
}

export interface CurrentUserLlmPresetsResponse {
  currentPreset: UserLlmPreset;
  items: UserLlmPreset[];
}

export interface UpdateCurrentUserLlmPresetRequest {
  presetId: string;
}

export interface HealthResponse {
  service: string;
  status: string;
}
