import { Hono } from 'jsr:@hono/hono';
import { cors } from 'jsr:@hono/hono/cors';
import type { SupabaseClient, User } from 'npm:@supabase/supabase-js@2.99.3';
import { z } from 'npm:zod';

import { createSupabaseForRequest } from '../_shared/auth.ts';
import { getUserTeamId } from '../_shared/db.ts';
import { createServiceClient } from '../_shared/supabaseAdmin.ts';

// ── Types ─────────────────────────────────────────────────────────────────

type ProductStatus = 'draft' | 'active' | 'deleted';

type Env = {
  Variables: {
    user: User;
    supabase: SupabaseClient;
  };
};

// ── Validation schemas ────────────────────────────────────────────────────

const listParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['draft', 'active', 'deleted']).optional(),
  search: z.string().trim().optional(),
  createdBy: z.string().trim().optional(),
  sortBy: z.enum(['created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createProductSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'title is required')
    .max(200, 'title must be at most 200 characters'),
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().trim().nullable().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['active', 'deleted'], {
    error: "status must be one of: 'active', 'deleted'",
  }),
});

const updateProductSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'title must be a non-empty string')
      .max(200)
      .optional(),
    description: z.string().trim().max(2000).optional(),
    // null = delete the image, string = new path, absent = no change
    imageUrl: z.string().trim().nullable().optional(),
  })
  .refine(
    (d) =>
      d.title !== undefined ||
      d.description !== undefined ||
      d.imageUrl !== undefined,
    {
      message: 'Provide at least one field to update',
    },
  );

// ── Constants ─────────────────────────────────────────────────────────────

const STORAGE_BUCKET = 'product-images';

const ALLOWED_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  draft: ['active', 'deleted'],
  active: ['deleted'],
  deleted: [],
};

const PRODUCT_COLUMNS =
  'id, team_id, title, description, image_url, status, created_by, created_at, updated_at, deleted_at';

// ── Helpers ───────────────────────────────────────────────────────────────

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

async function deleteStorageImage(path: string): Promise<void> {
  try {
    const { error } = await createServiceClient()
      .storage.from(STORAGE_BUCKET)
      .remove([path]);
    if (error) console.error('deleteStorageImage failed', path, error);
  } catch (err) {
    console.error('deleteStorageImage unexpected error', err);
  }
}

// ── App ───────────────────────────────────────────────────────────────────

const app = new Hono<Env>();

app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

app.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const supabase = createSupabaseForRequest(c.req.raw);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return c.json(
      {
        error: 'Unauthorized',
        message: error?.message ?? 'Invalid or expired session',
      },
      401,
    );
  }

  c.set('user', user);
  c.set('supabase', supabase);
  await next();
});

// ── GET /products ─────────────────────────────────────────────────────────

app.get('/', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');

  const teamResult = await getUserTeamId(supabase, user.id);
  if ('error' in teamResult) return teamResult.error;

  const parsed = listParamsSchema.safeParse(c.req.query());

  if (!parsed.success) {
    return c.json({ error: parsed.error.message ?? 'Invalid JSON body' }, 400);
  }

  const { page, limit, status, search, createdBy, sortBy, sortOrder } =
    parsed.data;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('products')
    .select(PRODUCT_COLUMNS, { count: 'exact' })
    .eq('team_id', teamResult.teamId);

  if (status) query = query.eq('status', status);

  if (search) {
    const tsquery = buildPrefixTsquery(search);
    if (tsquery) query = query.filter('search_vector', 'fts(english)', tsquery);
  }

  if (createdBy) query = query.eq('created_by', createdBy);

  query = query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('fetch products', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }

  return c.json({
    products: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
});

// ── POST /products ────────────────────────────────────────────────────────

app.post('/', async (c) => {
  const user = c.get('user');
  const supabase = c.get('supabase');

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message ?? 'Invalid JSON body' }, 400);
  }

  const { title, description, imageUrl } = parsed.data;

  const teamResult = await getUserTeamId(supabase, user.id);
  if ('error' in teamResult) return teamResult.error;

  const { data, error } = await supabase
    .from('products')
    .insert({
      title,
      description: description ?? '',
      image_url: imageUrl ?? null,
      created_by: user.id,
      team_id: teamResult.teamId,
      status: 'draft',
    })
    .select('*')
    .single();

  if (error) {
    console.error('create product', error);
    return c.json({ error: 'Failed to create product' }, 500);
  }

  return c.json({ product: data }, 201);
});

// ── PATCH /products/:id/status ────────────────────────────────────────────

app.patch('/:id/status', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const supabase = c.get('supabase');

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message ?? 'Invalid JSON body' }, 400);
  }

  const { status: newStatus } = parsed.data;

  const teamResult = await getUserTeamId(supabase, user.id);
  if ('error' in teamResult) return teamResult.error;

  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('id, status, team_id')
    .eq('id', id)
    .eq('team_id', teamResult.teamId)
    .maybeSingle();

  if (fetchError) {
    console.error('fetch product for status update', fetchError);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
  if (!product) return c.json({ error: 'Product not found' }, 404);

  const currentStatus = product.status as ProductStatus;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(newStatus)) {
    return c.json(
      {
        error: `Cannot change status from '${currentStatus}' to '${newStatus}'`,
      },
      422,
    );
  }

  const { data: updated, error: updateError } = await createServiceClient()
    .from('products')
    .update({ status: newStatus })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    console.error('update product status', updateError);
    return c.json({ error: 'Failed to update product status' }, 500);
  }

  return c.json({ product: updated });
});

// ── PATCH /products/:id ───────────────────────────────────────────────────

app.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const supabase = c.get('supabase');

  let raw: Record<string, unknown>;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = updateProductSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message ?? 'Invalid JSON body' }, 400);
  }

  const teamResult = await getUserTeamId(supabase, user.id);
  if ('error' in teamResult) return teamResult.error;

  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('id, status, image_url, team_id')
    .eq('id', id)
    .eq('team_id', teamResult.teamId)
    .maybeSingle();

  if (fetchError) {
    console.error('fetch product for update', fetchError);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
  if (!existing) return c.json({ error: 'Product not found' }, 404);

  if (existing.status !== 'draft') {
    return c.json(
      {
        error: `Only draft products can be edited (current status: ${existing.status})`,
      },
      422,
    );
  }

  // Build patch only from fields that were explicitly present in the request body.
  // hasOwn is still needed here: Zod strips absent optional fields, so we can't
  // distinguish "field sent as undefined" from "field not sent at all" in parsed.data.
  const patch: Record<string, unknown> = {};

  if (Object.hasOwn(raw, 'title')) patch.title = parsed.data.title;
  if (Object.hasOwn(raw, 'description'))
    patch.description = parsed.data.description ?? '';

  if (Object.hasOwn(raw, 'imageUrl')) {
    const newPath = parsed.data.imageUrl ?? null;
    patch.image_url = newPath;

    const oldPath = existing.image_url as string | null;
    if (oldPath && oldPath !== newPath) {
      await deleteStorageImage(oldPath);
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from('products')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    console.error('update product', updateError);
    return c.json({ error: 'Failed to update product' }, 500);
  }

  return c.json({ product: updated });
});

// ── Serve ─────────────────────────────────────────────────────────────────

Deno.serve(app.fetch);
