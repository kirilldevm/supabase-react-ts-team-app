import { supabase } from '@/lib/client';
import type { SupabaseClient } from '@supabase/supabase-js';

const STORAGE_BUCKET = 'product-images';

class StorageService {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async uploadImage(file: File, teamId: string): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${teamId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await this.client.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) throw error;
    return path;
  }

  async getSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
    const { data, error } = await this.client.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, expiresInSeconds);

    if (error) throw error;
    return data.signedUrl;
  }
}

export const storageService = new StorageService(supabase);
