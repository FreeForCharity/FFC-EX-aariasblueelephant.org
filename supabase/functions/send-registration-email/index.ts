import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  const { record, type } = await req.json();

  // Only trigger on successful registration insertions
  if (type !== 'INSERT') {
    return new Response('Not an insert', { status: 200 });
  }

  const { userName, userEmail, eventId } = record;

  // Ideally, fetch event details using eventId from database here
  // For now, we'll use generic placeholders or assume they're passed if possible
  const eventTitle = "Upcoming Aaria's Blue Elephant Event";

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Aaria's Blue Elephant <hello@aariasblueelephant.org>",
      to: [userEmail],
      subject: `Registration Confirmed: ${eventTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://aariasblueelephant.org/logo.png" alt="Aaria's Blue Elephant Logo" style="width: 120px; height: auto;" />
          </div>
          <h1 style="color: #00AEEF; text-align: center;">Registration Confirmed!</h1>
          <p style="font-size: 16px; color: #4a5568;">Hi ${userName},</p>
          <p style="font-size: 16px; color: #4a5568;">
            Thank you for registering for <strong>${eventTitle}</strong>. We are so excited to have you join our community for this inclusive experience!
          </p>
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h2 style="font-size: 18px; color: #2d3748; margin-top: 0;">Event Details</h2>
            <p style="font-size: 14px; color: #4a5568; margin-bottom: 4px;"><strong>Event:</strong> ${eventTitle}</p>
            <p style="font-size: 14px; color: #4a5568; margin-bottom: 4px;"><strong>Organization:</strong> Aaria's Blue Elephant</p>
            <p style="font-size: 14px; color: #4a5568;"><strong>Status:</strong> Registration Confirmed</p>
          </div>
          <p style="font-size: 16px; color: #4a5568;">
            If you have any questions or need to update your accommodation requests, please don't hesitate to reach out.
          </p>
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 12px; color: #a0aec0;">
              Aaria's Blue Elephant | 101 Felicia Ave, Tracy, CA 95391<br />
              <a href="https://aariasblueelephant.org" style="color: #00AEEF; text-decoration: none;">Visit our website</a> | 
              <a href="https://www.linkedin.com/company/aaria-s-blue-elephant" style="color: #00AEEF; text-decoration: none;">LinkedIn</a>
            </p>
            <p style="font-size: 10px; color: #cbd5e0; margin-top: 12px;">
              501(c)(3) status pending | Entity No. B20250299015
            </p>
          </div>
        </div>
      `,
    }),
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    status: res.status,
  });
})
