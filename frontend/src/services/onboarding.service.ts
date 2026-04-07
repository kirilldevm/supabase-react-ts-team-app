import { supabase } from '@/lib/client';
import type {
  OnboardingErrorBody,
  OnboardingGetResponse,
  OnboardingTeam,
} from '@/types/onboarding';
import type { SupabaseClient } from '@supabase/supabase-js';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function messageFromInvokeError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const m = (error as { message?: string }).message;
    if (typeof m === 'string' && m.length > 0) return m;
  }
  return 'Request failed';
}

function bodyFromFunctionsHttpError(error: {
  context?: unknown;
}): OnboardingErrorBody | null {
  const ctx = error.context;

  if (!isRecord(ctx)) return null;

  const body = ctx.body;

  if (typeof body === 'string') {
    try {
      const parsed: unknown = JSON.parse(body);

      if (isRecord(parsed) && typeof parsed.error === 'string') {
        return parsed as OnboardingErrorBody;
      }
    } catch {
      return null;
    }
  }
  if (isRecord(body) && typeof body.error === 'string') {
    return body as OnboardingErrorBody;
  }
  return null;
}

function throwOnboardingFailure(error: unknown, data: unknown): never {
  if (isRecord(data) && typeof data.error === 'string') {
    throw new Error(data.error);
  }
  if (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name?: string }).name === 'FunctionsHttpError'
  ) {
    const parsed = bodyFromFunctionsHttpError(error as { context?: unknown });

    if (parsed?.error) throw new Error(parsed.error);
  }
  throw new Error(messageFromInvokeError(error));
}

async function userAuthHeaders(client: SupabaseClient): Promise<{
  Authorization: string;
}> {
  const { error: userError } = await client.auth.getUser();
  if (userError) {
    throw userError;
  }

  const {
    data: { session },
    error,
  } = await client.auth.getSession();

  if (error) {
    throw error;
  }

  const token = session?.access_token;
  if (!token) {
    throw new Error(
      'No session access token. Sign in again or wait for the session to finish loading.',
    );
  }

  return { Authorization: `Bearer ${token}` };
}

class OnboardingService {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async getStatus(): Promise<OnboardingGetResponse> {
    const headers = await userAuthHeaders(this.client);

    const { data, error } =
      await this.client.functions.invoke<OnboardingGetResponse>('onboarding', {
        method: 'GET',
        headers,
      });

    if (error || !data) {
      throwOnboardingFailure(error, data);
    }

    return data;
  }

  async createTeam(teamName: string): Promise<OnboardingTeam> {
    const headers = await userAuthHeaders(this.client);

    const { data, error } = await this.client.functions.invoke<
      { ok: true; team: OnboardingTeam } | OnboardingErrorBody
    >('onboarding/team', {
      method: 'POST',
      headers,
      body: { name: teamName },
    });

    if (error || !data || !('ok' in data) || !data.ok) {
      throwOnboardingFailure(error, data);
    }

    return data.team;
  }

  async joinTeam(inviteCode: string): Promise<OnboardingTeam> {
    const headers = await userAuthHeaders(this.client);

    const { data, error } = await this.client.functions.invoke<
      { ok: true; team: OnboardingTeam } | OnboardingErrorBody
    >('onboarding/join', {
      method: 'POST',
      headers,
      body: { inviteCode },
    });

    if (error || !data || !('ok' in data) || !data.ok) {
      throwOnboardingFailure(error, data);
    }

    return data.team;
  }
}

export const onboardingService = new OnboardingService(supabase);
