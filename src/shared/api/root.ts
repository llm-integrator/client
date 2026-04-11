import type {
  HealthResponse,
  InternalUserProfile,
  TwitchAuthStartResponse,
  TwitchBotConnectionSnapshot,
  UpdateAutoConnectRequest,
  UpdateSelfReminderRequest,
  UpdateUserPromptRequest,
} from './types';
import { rootFetch } from './http';
import { clearSessionToken } from './session-storage';

export function getHealth(): Promise<HealthResponse> {
  return rootFetch<HealthResponse>('/health', { method: 'GET' });
}

export function startTwitchAuth(returnTo?: string): Promise<TwitchAuthStartResponse> {
  const q = returnTo
    ? `?returnTo=${encodeURIComponent(returnTo)}`
    : '';
  return rootFetch<TwitchAuthStartResponse>(`/auth/twitch/start${q}`, {
    method: 'GET',
  });
}

export function getMe(): Promise<InternalUserProfile> {
  return rootFetch<InternalUserProfile>('/me', { method: 'GET' });
}

export function getTwitchBotState(): Promise<TwitchBotConnectionSnapshot> {
  return rootFetch<TwitchBotConnectionSnapshot>('/me/twitch-bot', {
    method: 'GET',
  });
}

export function connectTwitchBot(): Promise<TwitchBotConnectionSnapshot> {
  return rootFetch<TwitchBotConnectionSnapshot>('/me/twitch-bot/connect', {
    method: 'POST',
  });
}

export function disconnectTwitchBot(): Promise<TwitchBotConnectionSnapshot> {
  return rootFetch<TwitchBotConnectionSnapshot>('/me/twitch-bot/disconnect', {
    method: 'POST',
  });
}

export function updateBotPrompt(
  body: UpdateUserPromptRequest,
): Promise<TwitchBotConnectionSnapshot> {
  return rootFetch<TwitchBotConnectionSnapshot>('/me/twitch-bot/prompt', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function updateBotAutoConnect(
  body: UpdateAutoConnectRequest,
): Promise<TwitchBotConnectionSnapshot> {
  return rootFetch<TwitchBotConnectionSnapshot>('/me/twitch-bot/auto-connect', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function updateBotSelfReminder(
  body: UpdateSelfReminderRequest,
): Promise<TwitchBotConnectionSnapshot> {
  return rootFetch<TwitchBotConnectionSnapshot>('/me/twitch-bot/self-reminder', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function logout(): Promise<void> {
  await rootFetch<void>('/auth/logout', { method: 'POST' });
  clearSessionToken();
}
