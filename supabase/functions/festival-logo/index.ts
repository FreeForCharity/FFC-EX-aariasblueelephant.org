import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Saves a shop's logo for a shop that signed up with just an email address.
 *
 * Those shops have no account, so they cannot write to storage themselves.
 * They send their private manage token (from their sign-up link) and the
 * image, already shrunk to a small square in the browser; this checks the
 * token, stores the file and points the shop at it.
 *
 * Only while the shop is not yet on the card: once approved, the logo is what
 * families see, and changes go through an admin.
 */

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { token, image } = await req.json().catch(() => ({}));
    if (!token || typeof image !== 'string') return json({ error: 'missing' }, 400);

    const m = image.match(/^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) return json({ error: 'bad_image' }, 400);
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    if (bytes.length > 400_000) return json({ error: 'too_big' }, 413);

    const { data: shop } = await sb.from('festival_shops').select('id, status')
      .eq('manage_token', token).maybeSingle();
    if (!shop) return json({ error: 'bad_token' }, 403);
    if (!['unconfirmed', 'pending', 'waitlist'].includes(shop.status)) return json({ error: 'already_approved' }, 409);

    const path = `shops/${shop.id}/${Date.now()}.${TYPES[m[1]]}`;
    const up = await sb.storage.from('festival-logos').upload(path, bytes, { contentType: m[1], upsert: false });
    if (up.error) return json({ error: up.error.message }, 500);
    const url = sb.storage.from('festival-logos').getPublicUrl(path).data.publicUrl;
    await sb.from('festival_shops').update({ logo_url: url, updated_at: new Date().toISOString() }).eq('id', shop.id);
    return json({ ok: true, url });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
