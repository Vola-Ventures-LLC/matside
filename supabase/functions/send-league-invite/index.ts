import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendInviteRequest {
  email: string;
  leagueName: string;
  inviteCode: string;
  expiresAt: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claims?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, leagueName, inviteCode, expiresAt }: SendInviteRequest = await req.json();

    // Validate required fields
    if (!email || !leagueName || !inviteCode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, leagueName, inviteCode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expirationDate = new Date(expiresAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    console.log(`Sending invite email to ${email} for league ${leagueName}`);

    const emailResponse = await resend.emails.send({
      from: "Wrestling League <noreply@resend.dev>",
      to: [email],
      subject: `You're invited to join ${leagueName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">You're Invited!</h1>
              <p style="color: #a0aec0; margin: 10px 0 0; font-size: 16px;">Join ${leagueName}</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                You've been invited to join <strong>${leagueName}</strong> as a team manager. Use the invite code below to register your team.
              </p>
              
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">Your Invite Code</p>
                <div style="background-color: #1a1a2e; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 15px 25px; border-radius: 8px; display: inline-block; font-family: 'Courier New', monospace;">
                  ${inviteCode}
                </div>
              </div>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  <strong>⏰ This code expires on ${expirationDate}</strong>
                </p>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0 0;">
                To join the league:
              </p>
              <ol style="color: #374151; font-size: 15px; line-height: 1.8; padding-left: 20px;">
                <li>Log in to your team dashboard</li>
                <li>Click "Join League" from the sidebar</li>
                <li>Enter the invite code above</li>
              </ol>
            </div>
            
            <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending invite email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

Deno.serve(handler);
