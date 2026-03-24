import { getUserFromRequest } from '../_shared/auth.ts';
import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getUserTeamId } from '../_shared/db.ts';
import { jsonResponse, readJsonBody } from '../_shared/httpJson.ts';
import { createServiceClient } from '../_shared/supabaseAdmin.ts';

const STORAGE_BUCKET = 'product-images';

async function deleteStorageImage(path: string): Promise<void> {
  try {
    const serviceClient = createServiceClient();

    const { error } = await serviceClient.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) {
      console.error('deleteStorageImage: failed to delete', path, error);
    }
  } catch (err) {
    console.error('deleteStorageImage: unexpected error', err);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  if (req.method !== 'PATCH') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const auth = await getUserFromRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  const { user, supabase } = auth.context;

  const body = await readJsonBody(req);
  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const raw = body as Record<string, unknown>;

  const hasTitle = Object.hasOwn(raw, 'title');
  const hasDescription = Object.hasOwn(raw, 'description');
  const hasImageUrl = Object.hasOwn(raw, 'imageUrl');

  if (!hasTitle && !hasDescription && !hasImageUrl) {
    return jsonResponse({ error: 'Provide at least one field to update' }, 400);
  }

  if (hasTitle && (typeof raw.title !== 'string' || !raw.title.trim())) {
    return jsonResponse({ error: 'title must be a non-empty string' }, 400);
  }

  if (
    hasImageUrl &&
    raw.imageUrl !== null &&
    typeof raw.imageUrl !== 'string'
  ) {
    return jsonResponse({ error: 'imageUrl must be a string or null' }, 400);
  }

  const { productId } = raw;
  if (typeof productId !== 'string' || !productId.trim()) {
    return jsonResponse(
      { error: 'productId is required (non-empty string)' },
      400,
    );
  }

  const teamResult = await getUserTeamId(supabase, user.id);
  if ('error' in teamResult) {
    return teamResult.error;
  }

  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('id, status, image_url, team_id')
    .eq('id', productId.trim())
    .eq('team_id', teamResult.teamId)
    .maybeSingle();

  if (fetchError) {
    console.error('fetch product', fetchError);
    return jsonResponse({ error: 'Failed to fetch product' }, 500);
  }

  if (!existing) {
    return jsonResponse({ error: 'Product not found' }, 404);
  }

  if (existing.status !== 'draft') {
    return jsonResponse(
      {
        error: `Only draft products can be edited (current status: ${existing.status})`,
      },
      422,
    );
  }

  const patch: Record<string, unknown> = {};

  if (hasTitle) {
    patch.title = (raw.title as string).trim();
  }

  if (hasDescription) {
    patch.description =
      typeof raw.description === 'string' ? raw.description.trim() : '';
  }

  if (hasImageUrl) {
    const newPath =
      raw.imageUrl === null
        ? null
        : typeof raw.imageUrl === 'string' && raw.imageUrl.trim()
          ? raw.imageUrl.trim()
          : null;

    patch.image_url = newPath;

    // Delete the old image
    const oldPath = existing.image_url as string | null;
    if (oldPath && oldPath !== newPath) {
      await deleteStorageImage(oldPath);
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from('products')
    .update(patch)
    .eq('id', productId.trim())
    .select('*')
    .single();

  if (updateError) {
    console.error('update product', updateError);
    return jsonResponse({ error: 'Failed to update product' }, 500);
  }

  return jsonResponse({ product: updated }, 200);
});
