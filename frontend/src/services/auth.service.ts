import { supabase } from '@/lib/client';
import type { SupabaseClient } from '@supabase/supabase-js';

class AuthService {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}

export const authService = new AuthService(supabase);
