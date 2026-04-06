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

export interface HealthResponse {
  service: string;
  status: string;
}
