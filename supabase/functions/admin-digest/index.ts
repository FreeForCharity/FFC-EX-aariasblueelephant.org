import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL'); // User needs to set this secret

serve(async (req) => {
  try {
    // Initialize Supabase Client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 1. Fetch all pending registrations
    const { data: pendingRegs, error: fetchError } = await supabase
      .from('event_registrations')
      .select('*, events(title)')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    if (!pendingRegs || pendingRegs.length === 0) {
      return new Response('No pending registrations to notify about', { status: 200 });
    }

    // 2. Format the registration list for the email
    const regRows = pendingRegs.map(reg => `
      <tr style="border-bottom: 1px solid #edf2f7;">
        <td style="padding: 12px; color: #2d3748;">${reg.user_name}</td>
        <td style="padding: 12px; color: #4a5568;">${reg.events?.title || 'Unknown Event'}</td>
        <td style="padding: 12px; color: #4a5568;">${new Date(reg.created_at).toLocaleDateString()}</td>
        <td style="padding: 12px; color: #4a5568;">${reg.special_needs ? '<strong>Yes</strong>' : 'No'}</td>
      </tr>
    `).join('');

    // 3. Send the summary email to the admin
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ABE Notifications <hello@aariasblueelephant.org>",
        to: [ADMIN_EMAIL],
        subject: `Daily Digest: ${pendingRegs.length} Pending Registrations`,
        html: `
          <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h1 style="color: #00AEEF; font-size: 24px;">Pending Registrations Digest</h1>
            <p style="color: #4a5568; font-size: 16px;">
              Hello Admin, you have <strong>${pendingRegs.length}</strong> registrations waiting for your approval.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="background-color: #f7fafc; text-align: left;">
                  <th style="padding: 12px; color: #718096; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">User Name</th>
                  <th style="padding: 12px; color: #718096; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">Event</th>
                  <th style="padding: 12px; color: #718096; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">Date</th>
                  <th style="padding: 12px; color: #718096; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">Needs?</th>
                </tr>
              </thead>
              <tbody>
                ${regRows}
              </tbody>
            </table>
            <div style="margin-top: 40px; text-align: center;">
              <a href="https://aariasblueelephant.org/dashboard" style="background-color: #00AEEF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Go to Dashboard to Approve</a>
            </div>
          </div>
        `,
      }),
    });

    const emailResult = await res.json();
    return new Response(JSON.stringify({ success: true, count: pendingRegs.length, emailResult }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
