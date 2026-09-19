import "server-only";
import { getEmailConfig } from "@/lib/env";
import { getSiteUrl } from "@/lib/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

type SendEmailResult =
  | {
      delivered: true;
      id?: string;
    }
  | {
      delivered: false;
      reason: string;
    };

/**
 * Sends transactional email through Resend.
 *
 * Email contents (including single-use links) are intentionally never logged.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailInput): Promise<SendEmailResult> {
  const { apiKey, from } = getEmailConfig();
  console.info("[email] API key configured:", Boolean(apiKey));

  if (!apiKey) {
    console.error("[email] Not sent: RESEND_API_KEY is not configured.", {
      to,
      subject,
    });

    return {
      delivered: false,
      reason: "RESEND_API_KEY not configured",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("[email] Resend error:", {
        status: res.status,
        statusText: res.statusText,
        code: typeof data?.name === "string" ? data.name : undefined,
        message: typeof data?.message === "string" ? data.message : undefined,
      });

      return {
        delivered: false,
        reason:
          data?.message ?? data?.error ?? `Resend returned HTTP ${res.status}`,
      };
    }

    console.info("[email] Resend accepted message:", {
      to,
      subject,
      id: data?.id,
    });

    return {
      delivered: true,
      id: data?.id,
    };
  } catch (error) {
    console.error("[email] Network failure:", {
      message:
        error instanceof Error ? error.message : "Unknown email network error",
      to,
      subject,
    });

    return {
      delivered: false,
      reason:
        error instanceof Error ? error.message : "Unknown email network error",
    };
  }
}

export function verificationEmailHtml(link: string) {
  const logoUrl = `${getSiteUrl()}/assets/logo.png`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your ACOB Account</title>
    </head>
    <body style="background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 0; color: #ededed;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
        <!-- Brand Header with Logo -->
        <tr>
          <td align="center" style="padding: 24px 0;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <img src="${logoUrl}" alt="ACOB Logo" width="38" height="38" style="display: block; border-radius: 6px; object-fit: contain;" />
                </td>
                <td style="padding-left: 12px; text-align: left;">
                  <span style="color: #ffffff; font-size: 15px; font-weight: 600; letter-spacing: -0.3px; display: block;">ACOB</span>
                  <span style="color: #666666; font-size: 13px; display: block; letter-spacing: -0.2px;">Learn for Life</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Main Card -->
        <tr>
          <td style="padding: 0 20px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0c0c0c; border: 1px solid #222222; border-radius: 12px; padding: 40px;">
              <tr>
                <td>
                  <h1 style="color: #ffffff; font-size: 22px; font-weight: 500; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.5px;">Verify your email address</h1>
                  <p style="color: #a1a1a1; font-size: 15px; line-height: 1.6; margin-bottom: 30px; margin-top: 0;">
                    You're almost ready to explore Applied Cognitio Olympiad Bangladesh. Click the secure button below to confirm your account and jump straight into your dashboard.
                  </p>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="left">
                        <a href="${link}" target="_blank" style="background-color: #ffffff; color: #000000; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(255,255,255,0.1);">Verify Email Address</a>
                      </td>
                    </tr>
                  </table>
                  <div style="border-top: 1px solid #1a1a1a; margin-top: 35px; padding-top: 25px;">
                    <p style="color: #666666; font-size: 13px; line-height: 1.5; margin: 0;">
                      This link expires in 24 hours. If you didn't request an account with ACOB, you can safely ignore and delete this email.
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer Info -->
        <tr>
          <td align="center" style="padding-top: 24px;">
            <p style="color: #525252; font-size: 12px; margin: 0;">
              &copy; Applied Cognitio Olympiad Bangladesh. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function passwordResetEmailHtml(link: string) {
  const logoUrl = `${getSiteUrl()}/assets/logo.png`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your ACOB Password</title>
    </head>
    <body style="background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 0; color: #ededed;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
        <!-- Brand Header with Logo -->
        <tr>
          <td align="center" style="padding: 24px 0;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <img src="${logoUrl}" alt="ACOB Logo" width="38" height="38" style="display: block; border-radius: 6px; object-fit: contain;" />
                </td>
                <td style="padding-left: 12px; text-align: left;">
                  <span style="color: #ffffff; font-size: 15px; font-weight: 600; letter-spacing: -0.3px; display: block;">ACOB</span>
                  <span style="color: #666666; font-size: 13px; display: block; letter-spacing: -0.2px;">Learn for Life</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Main Card -->
        <tr>
          <td style="padding: 0 20px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0c0c0c; border: 1px solid #222222; border-radius: 12px; padding: 40px;">
              <tr>
                <td>
                  <h1 style="color: #ffffff; font-size: 22px; font-weight: 500; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.5px;">Reset your password</h1>
                  <p style="color: #a1a1a1; font-size: 15px; line-height: 1.6; margin-bottom: 30px; margin-top: 0;">
                    We received a request to reset your password for your ACOB account. Click the button below to choose a new password.
                  </p>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="left">
                        <a href="${link}" target="_blank" style="background-color: #ffffff; color: #000000; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(255,255,255,0.1);">Reset Password</a>
                      </td>
                    </tr>
                  </table>
                  <div style="border-top: 1px solid #1a1a1a; margin-top: 35px; padding-top: 25px;">
                    <p style="color: #666666; font-size: 13px; line-height: 1.5; margin: 0;">
                      This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email; your account remains secure.
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer Info -->
        <tr>
          <td align="center" style="padding-top: 24px;">
            <p style="color: #525252; font-size: 12px; margin: 0;">
              &copy; Applied Cognitio Olympiad Bangladesh. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
