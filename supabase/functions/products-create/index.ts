import { getUserFromRequest } from '../_shared/auth.ts';
import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getUserTeamId } from '../_shared/db.ts';
import { jsonResponse, readJsonBody } from '../_shared/httpJson.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  if (req.method !== 'POST') {
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

  const { title, description, imageUrl } = body as {
    title?: unknown;
    description?: unknown;
    imageUrl?: unknown;
  };

  if (typeof title !== 'string' || !title.trim()) {
    return jsonResponse({ error: 'title is required (non-empty string)' }, 400);
  }

  const teamResult = await getUserTeamId(supabase, user.id);
  if ('error' in teamResult) {
    return teamResult.error;
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      image_url: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null,
      created_by: user.id,
      team_id: teamResult.teamId,
      status: 'draft',
    })
    .select('*')
    .single();

  if (error) {
    console.error('create product', error);
    return jsonResponse({ error: 'Failed to create product' }, 500);
  }

  return jsonResponse({ product: data }, 201);
});
