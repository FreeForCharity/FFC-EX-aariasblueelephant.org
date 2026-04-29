import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record, type } = await req.json();

    // Handle both database webhook format and direct frontend call format
    let payload = record;
    let actionType = type;

    // Primary fields from database (underscore_case) or frontend (camelCase)
    const userName = payload.user_name || payload.userName || "Friend";
    const userEmail = payload.user_email || payload.userEmail;
    const eventTitle = payload.event_title || payload.eventTitle || "Upcoming Exclusive Experience";
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || "hello@aariasblueelephant.org";
    
    if (!userEmail) {
      return new Response('No recipient email provided', { status: 400, headers: corsHeaders });
    }

    // Helper to send email via Resend
    const sendEmail = async (to: string[], subject: string, html: string) => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Aaria's Blue Elephant <hello@aariasblueelephant.org>",
          to,
          subject,
          html,
        }),
      });

      const status = res.status;
      let data = null;
      try {
        data = await res.json();
        console.log(`Resend API [${status}] for ${to[0]}:`, JSON.stringify(data));
      } catch (e) {
        const text = await res.text().catch(() => "No response body");
        console.log(`Resend API [${status}] for ${to[0]} (Non-JSON):`, text);
      }
      
      return { status, data };
    };

    if (actionType === 'INSERT' || actionType === 'REGISTRATION_RECEIVED') {
      // 1. Send confirmation to User (fire and forget for now, but log)
      const userRes = await sendEmail(
        [userEmail],
        `Registration Received: ${eventTitle}`,
        `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="https://aariasblueelephant.org/logo.webp" alt="Aaria's Blue Elephant Logo" style="width: 120px; height: auto;" />
            </div>
            <h1 style="color: #00AEEF; text-align: center;">Registration Received!</h1>
            <p style="font-size: 16px; color: #4a5568;">Hi ${userName},</p>
            <p style="font-size: 16px; color: #4a5568;">
              Thank you for registering for <strong>${eventTitle}</strong>. We've received your request and our team is making sure everything is ready for your specific needs!
            </p>
            <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h2 style="font-size: 18px; color: #2d3748; margin-top: 0;">What Happens Next?</h2>
              <p style="font-size: 14px; color: #4a5568; margin-bottom: 4px;">1. Our board reviews the registration details (accommodations, etc.).</p>
              <p style="font-size: 14px; color: #4a5568; margin-bottom: 4px;">2. You'll receive another email once your registration is <strong>Approved</strong>.</p>
              <p style="font-size: 14px; color: #4a5568;">3. We can't wait to see you there!</p>
            </div>
          </div>
        `
      );

      // 2. Send immediate notification to Admin
      const adminRes = await sendEmail(
        [adminEmail],
        `New Registration: ${userName} - ${eventTitle}`,
        `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h1 style="color: #00AEEF; font-size: 20px;">New Event Registration</h1>
            <p><strong>User:</strong> ${userName} (${userEmail})</p>
            <p><strong>Event:</strong> ${eventTitle}</p>
            <p><strong>Special Needs:</strong> ${payload.special_needs || payload.specialNeeds ? 'Yes' : 'No'}</p>
            <div style="margin-top: 24px;">
              <a href="https://aariasblueelephant.org/dashboard" style="background-color: #00AEEF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Approve in Dashboard</a>
            </div>
          </div>
        `
      );

      return new Response(JSON.stringify(userRes.data || { success: userRes.status < 400 }), { status: userRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (actionType === 'REGISTRATION_APPROVED') {
      const res = await sendEmail(
        [userEmail],
        `Registration Approved! 🎉 - ${eventTitle}`,
        `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="https://aariasblueelephant.org/logo.webp" alt="Aaria's Blue Elephant Logo" style="width: 120px; height: auto;" />
            </div>
            <h1 style="color: #48BB78; text-align: center;">You're Approved!</h1>
            <p style="font-size: 16px; color: #4a5568;">Hi ${userName},</p>
            <p style="font-size: 16px; color: #4a5568;">
              Great news! Your registration for <strong>${eventTitle}</strong> has been approved.
            </p>
            <div style="background-color: #f0fff4; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #c6f6d5;">
              <h2 style="font-size: 18px; color: #276749; margin-top: 0;">See You There!</h2>
              <p style="font-size: 14px; color: #2f855a;">Your spot is confirmed. We can't wait to see you!</p>
            </div>
          </div>
        `
      );
      return new Response(JSON.stringify(res.data || { success: res.status < 400 }), { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (actionType === 'VOLUNTEER_RECEIVED') {
      const res = await sendEmail(
        [userEmail],
        `Volunteer Application Received!`,
        `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h1 style="color: #00AEEF;">Application Received!</h1>
            <p>Hi ${userName},</p>
            <p>Thank you for your interest in volunteering with Aaria's Blue Elephant! Our board will review your application and get back to you soon.</p>
          </div>
        `
      );
      
      // Notify Admin
      await sendEmail(
        [adminEmail],
        `New Volunteer Application: ${userName}`,
        `<p>${userName} has applied to volunteer. Interest: ${payload.interest}</p>`
      );

      return new Response(JSON.stringify(res.data || { success: res.status < 400 }), { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (actionType === 'VOLUNTEER_APPROVED') {
      const res = await sendEmail(
        [userEmail],
        `Volunteer Application Approved! 🎉`,
        `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h1 style="color: #48BB78;">Welcome to the Team!</h1>
            <p>Hi ${userName},</p>
            <p>Your volunteer application has been approved! We are so excited to have you join our community.</p>
          </div>
        `
      );
      return new Response(JSON.stringify(res.data || { success: res.status < 400 }), { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response('Action not supported', { status: 200, headers: corsHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
