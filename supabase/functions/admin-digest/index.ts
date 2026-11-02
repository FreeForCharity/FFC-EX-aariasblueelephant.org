import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

/**
 * The one email the admin gets about event registrations, once a day (cron job
 * admin-daily-registration-digest). send-registration-email no longer sends a
 * note per sign-up — that burned the daily email quota on busy days.
 *
 *   new         registrations in the last 24 hours, any status, grouped by event
 *   waiting     registrations still Pending, whatever their age (events with an
 *               approval step; the Inclusion Festival is approved on sign-up)
 *
 * No new sign-ups and nothing waiting -> no email at all.
 */

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL'); // User needs to set this secret
const SITE = 'https://aariasblueelephant.org';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const th = 'padding: 10px 12px; color: #718096; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;';
const td = 'padding: 10px 12px; color: #2d3748; border-bottom: 1px solid #edf2f7;';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Service role key to bypass RLS
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();

    const [recent, waiting] = await Promise.all([
      supabase.from('event_registrations').select('*, events(title)').gte('created_at', since).order('created_at', { ascending: true }),
      supabase.from('event_registrations').select('*, events(title)').eq('status', 'Pending').order('created_at', { ascending: true }),
    ]);
    if (recent.error) throw recent.error;
    if (waiting.error) throw waiting.error;

    const fresh: any[] = recent.data || [];
    const pending: any[] = waiting.data || [];
    if (fresh.length === 0 && pending.length === 0) {
      return new Response('No new or pending registrations to report', { status: 200, headers: corsHeaders });
    }

    // new sign-ups, grouped by event
    const byEvent = new Map<string, any[]>();
    for (const r of fresh) {
      const t = r.events?.title || 'Unknown event';
      byEvent.set(t, [...(byEvent.get(t) || []), r]);
    }
    const newSection = fresh.length === 0 ? '' : [...byEvent.entries()].map(([title, regs]) => `
      <h2 style="color: #0C4A6E; font-size: 18px; margin: 28px 0 4px;">${esc(title)} — ${regs.length} new</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead><tr style="background-color: #f7fafc; text-align: left;">
          <th style="${th}">Name</th><th style="${th}">Email</th><th style="${th}">Status</th><th style="${th}">Needs?</th>
        </tr></thead>
        <tbody>${regs.map((r) => `
          <tr><td style="${td}">${esc(r.user_name)}</td><td style="${td}">${esc(r.user_email)}</td>
              <td style="${td}">${esc(r.status)}</td><td style="${td}">${r.special_needs ? '<strong>Yes</strong>' : 'No'}</td></tr>`).join('')}
        </tbody>
      </table>`).join('');

    const waitingSection = pending.length === 0 ? '' : `
      <h2 style="color: #92400E; font-size: 18px; margin: 32px 0 4px;">Waiting for your approval — ${pending.length}</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>${pending.map((r) => `
          <tr><td style="${td}">${esc(r.user_name)}</td><td style="${td}">${esc(r.events?.title || 'Unknown event')}</td>
              <td style="${td}">${esc(new Date(r.created_at).toISOString().slice(0, 10))}</td></tr>`).join('')}
        </tbody>
      </table>
      <div style="margin-top: 24px; text-align: center;">
        <a href="${SITE}/dashboard?view=manage-registrations" style="background-color: #00AEEF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Review in the dashboard</a>
      </div>`;

    const subject = [
      fresh.length ? `${fresh.length} new registration${fresh.length === 1 ? '' : 's'}` : '',
      pending.length ? `${pending.length} waiting for approval` : '',
    ].filter(Boolean).join(' · ');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "ABE Notifications <hello@aariasblueelephant.org>",
        to: [ADMIN_EMAIL],
        subject: `Daily digest: ${subject}`,
        html: `
          <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h1 style="color: #00AEEF; font-size: 24px; margin-bottom: 4px;">Registrations — last 24 hours</h1>
            <p style="color: #4a5568; font-size: 15px; margin-top: 0;">${fresh.length} new, ${pending.length} waiting for approval.</p>
            ${newSection}
            ${waitingSection}
            <p style="color: #a0aec0; font-size: 12px; margin-top: 32px;">One email a day, and none on days with nothing to report.</p>
          </div>`,
      }),
    });

    const emailResult = await res.json();
    return new Response(JSON.stringify({ success: true, new: fresh.length, waiting: pending.length, emailResult }), { status: 200, headers: corsHeaders });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
