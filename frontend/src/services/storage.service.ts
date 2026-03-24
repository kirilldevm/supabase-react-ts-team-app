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

  async getSignedUrls(
    paths: string[],
    expiresInSeconds = 3600,
  ): Promise<Map<string, string>> {
    if (paths.length === 0) return new Map();

    const { data, error } = await this.client.storage
      .from(STORAGE_BUCKET)
      .createSignedUrls(paths, expiresInSeconds);

    if (error) throw error;

    const map = new Map<string, string>();
    data?.forEach(({ path, signedUrl }) => {
      if (path && signedUrl) map.set(path, signedUrl);
    });

    return map;
  }
}

export const storageService = new StorageService(supabase);
