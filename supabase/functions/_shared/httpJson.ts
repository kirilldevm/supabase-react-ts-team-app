import { corsHeaders } from './cors.ts';

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function readJsonBody(req: Request): Promise<unknown | null> {
  try {
    const text = await req.text();

    if (!text.trim()) return null;

    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
