import { supabase } from '@/lib/client';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

class AuthService {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async getSession(): Promise<Session | null> {
    const {
      data: { session },
      error,
    } = await this.client.auth.getSession();
    if (error) {
      throw error;
    }
    return session;
  }

  /** Current `User` or `null` if signed out. */
  async getUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user ?? null;
  }
}

export const authService = new AuthService(supabase);
