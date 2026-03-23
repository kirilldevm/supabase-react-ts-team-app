import { getUserFromRequest } from '../_shared/auth.ts';
import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import { jsonResponse, readJsonBody } from '../_shared/httpJson.ts';
import {
  handleOnboardingGet,
  handleOnboardingPost,
} from '../_shared/onboardingLogic.ts';
import { createServiceClient } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  const auth = await getUserFromRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  const { user } = auth.context;

  let admin;
  try {
    admin = createServiceClient();
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: 'Server misconfiguration' }, 500);
  }

  try {
    if (req.method === 'GET') {
      return await handleOnboardingGet(admin, user.id);
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      return await handleOnboardingPost(admin, user.id, body);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (e) {
    console.error('onboarding', e);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});
