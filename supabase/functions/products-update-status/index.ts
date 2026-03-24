import { getUserFromRequest } from '../_shared/auth.ts';
import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getUserTeamId } from '../_shared/db.ts';
import { jsonResponse, readJsonBody } from '../_shared/httpJson.ts';
import { createServiceClient } from '../_shared/supabaseAdmin.ts';

type ProductStatus = 'draft' | 'active' | 'deleted';

const ALLOWED_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  draft: ['active', 'deleted'],
  active: ['deleted'],
  deleted: [],
};

const VALID_TARGET_STATUSES: ProductStatus[] = ['active', 'deleted'];

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

  const { productId, status: newStatus } = body as {
    productId?: unknown;
    status?: unknown;
  };

  if (typeof productId !== 'string' || !productId.trim()) {
    return jsonResponse(
      { error: 'productId is required (non-empty string)' },
      400,
    );
  }

  if (!VALID_TARGET_STATUSES.includes(newStatus as ProductStatus)) {
    return jsonResponse(
      { error: `status must be one of: ${VALID_TARGET_STATUSES.join(', ')}` },
      400,
    );
  }

  const teamResult = await getUserTeamId(supabase, user.id);
  if ('error' in teamResult) {
    return teamResult.error;
  }

  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('id, status, team_id')
    .eq('id', productId.trim())
    .eq('team_id', teamResult.teamId)
    .maybeSingle();

  if (fetchError) {
    console.error('fetch product', fetchError);
    return jsonResponse({ error: 'Failed to fetch product' }, 500);
  }

  if (!product) {
    return jsonResponse({ error: 'Product not found' }, 404);
  }

  const currentStatus = product.status as ProductStatus;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(newStatus as ProductStatus)) {
    return jsonResponse(
      {
        error: `Cannot change status from '${currentStatus}' to '${newStatus}'`,
      },
      422,
    );
  }

  const serviceClient = createServiceClient();

  const { data: updated, error: updateError } = await serviceClient
    .from('products')
    .update({ status: newStatus })
    .eq('id', productId.trim())
    .select('*')
    .single();

  if (updateError) {
    console.error('update product status', updateError);
    return jsonResponse({ error: 'Failed to update product status' }, 500);
  }

  return jsonResponse({ product: updated }, 200);
});
