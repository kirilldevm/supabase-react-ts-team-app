import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getUserFromRequest } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  const auth = await getUserFromRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  const { user } = auth.context;

  return new Response(
    JSON.stringify({
      ok: true,
      message: 'hello-authed',
      userId: user.id,
      email: user.email,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
});
