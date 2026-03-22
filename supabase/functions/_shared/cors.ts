export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

export function withCorsHeaders(headers?: HeadersInit): Record<string, string> {
  const base = { ...corsHeaders };

  if (!headers) return base;

  const h = new Headers(headers);

  h.forEach((value, key) => {
    base[key] = value;
  });

  return base;
}

export function handleCorsPreflightRequest(): Response {
  return new Response('ok', { headers: corsHeaders });
}
