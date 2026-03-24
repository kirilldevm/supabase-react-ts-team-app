import { getUserFromRequest } from '../_shared/auth.ts';
import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getUserTeamId } from '../_shared/db.ts';
import { jsonResponse } from '../_shared/httpJson.ts';

/**
 * Query params:
 *   page        number  ≥ 1,  default 1
 *   limit       number  1-100, default 20
 *   status      'draft' | 'active' | 'deleted'  (omit = all)
 *   search      string  — full-text search on title + description (search_vector)
 *   createdBy   UUID    — filter by the user who created the product
 *   sortBy      'created_at' | 'updated_at', default 'created_at'
 *   sortOrder   'asc' | 'desc', default 'desc'
 */

const VALID_STATUSES = new Set(['draft', 'active', 'deleted']);
const VALID_SORT_COLUMNS = new Set(['created_at', 'updated_at']);
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

function buildPrefixTsquery(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.replace(/[&|!:<>()\s]/g, ''))
    .filter(Boolean)
    .map((word) => `${word}:*`)
    .join(' & ');
}

// All product columns except the generated search_vector
const PRODUCT_COLUMNS =
  'id, team_id, title, description, image_url, status, created_by, created_at, updated_at, deleted_at';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const auth = await getUserFromRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  const { user, supabase } = auth.context;

  const teamResult = await getUserTeamId(supabase, user.id);
  if ('error' in teamResult) {
    return teamResult.error;
  }

  // Parse query params
  const url = new URL(req.url);
  const p = url.searchParams;

  const page = Math.max(1, parseInt(p.get('page') ?? '1', 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(
      1,
      parseInt(p.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
    ),
  );
  const offset = (page - 1) * limit;

  const statusParam = p.get('status') ?? '';
  const status = VALID_STATUSES.has(statusParam) ? statusParam : null;

  const search = p.get('search')?.trim() ?? '';

  const createdBy = p.get('createdBy')?.trim() ?? '';

  const sortByParam = p.get('sortBy') ?? '';
  const sortBy = VALID_SORT_COLUMNS.has(sortByParam)
    ? sortByParam
    : 'created_at';

  const sortOrderParam = p.get('sortOrder') ?? '';
  const ascending = sortOrderParam === 'asc';

  // Build query
  let query = supabase
    .from('products')
    .select(PRODUCT_COLUMNS, { count: 'exact' })
    .eq('team_id', teamResult.teamId);

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    const tsquery = buildPrefixTsquery(search);
    if (tsquery) {
      query = query.filter('search_vector', 'fts(english)', tsquery);
    }
  }

  if (createdBy) {
    query = query.eq('created_by', createdBy);
  }

  query = query.order(sortBy, { ascending }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('fetch products', error);
    return jsonResponse({ error: 'Failed to fetch products' }, 500);
  }

  return jsonResponse({
    products: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
});
