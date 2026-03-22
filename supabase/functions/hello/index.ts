import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message: 'hello (public)',
      method: req.method,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
});
