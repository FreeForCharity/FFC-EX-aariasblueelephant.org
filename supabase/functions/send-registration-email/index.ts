import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  try {
    const { record, type } = await req.json();

    // Handle both database webhook format and direct frontend call format
    let payload = record;
    let actionType = type;

    // Primary fields from database (underscore_case) or frontend (camelCase)
    const userName = payload.user_name || payload.userName || "Friend";
    const userEmail = payload.user_email || payload.userEmail;
    const eventTitle = payload.event_title || payload.eventTitle || "Upcoming Exclusive Experience";
    
    if (!userEmail) {
      return new Response('No recipient email provided', { status: 400 });
    }

    if (actionType === 'INSERT' || actionType === 'REGISTRATION_RECEIVED') {
      // Initial signup notification
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Aaria's Blue Elephant <hello@aariasblueelephant.org>",
          to: [userEmail],
          subject: `Registration Received: ${eventTitle}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://aariasblueelephant.org/logo.png" alt="Aaria's Blue Elephant Logo" style="width: 120px; height: auto;" />
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
              <p style="font-size: 14px; color: #718096; margin-top: 24px;">
                Organization: Aaria's Blue Elephant | Status: Pending Board Review
              </p>
            </div>
          `,
        }),
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: res.status });
    }

    if (actionType === 'REGISTRATION_APPROVED') {
      // Approval notification
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Aaria's Blue Elephant <hello@aariasblueelephant.org>",
          to: [userEmail],
          subject: `Registration Approved! 🎉 - ${eventTitle}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://aariasblueelephant.org/logo.png" alt="Aaria's Blue Elephant Logo" style="width: 120px; height: auto;" />
              </div>
              <h1 style="color: #48BB78; text-align: center;">You're Approved!</h1>
              <p style="font-size: 16px; color: #4a5568;">Hi ${userName},</p>
              <p style="font-size: 16px; color: #4a5568;">
                Great news! Your registration for <strong>${eventTitle}</strong> has been approved by the Aaria's Blue Elephant board.
              </p>
              <div style="background-color: #f0fff4; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #c6f6d5;">
                <h2 style="font-size: 18px; color: #276749; margin-top: 0;">See You There!</h2>
                <p style="font-size: 14px; color: #2f855a; margin-bottom: 4px;">Your spot is confirmed. If you recognize any changes needed for your registration, please let us know.</p>
              </div>
            </div>
          `,
        }),
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: res.status });
    }

    return new Response('Action not supported', { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
