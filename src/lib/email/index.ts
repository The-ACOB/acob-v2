import "server-only";
import { getEmailConfig } from "@/lib/env";

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
  return `
    <p>Confirm your ACOB account by visiting the link below.</p>
    <p><a href="${link}">${link}</a></p>
    <p>This link expires in 24 hours.</p>
  `;
}

export function passwordResetEmailHtml(link: string) {
  return `
    <p>Reset your ACOB password by visiting the link below.</p>
    <p><a href="${link}">${link}</a></p>
    <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
  `;
}
