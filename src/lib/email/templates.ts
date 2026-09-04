/**
 * Reusable email templates. Each returns { subject, html } so callers
 * never hand-build markup inline. All templates share the same
 * minimal wrapper — no marketing chrome, just the message.
 */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function wrap(bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #16161a;">
      <p style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b6b6b;">Applied Cognitio Olympiad Bangladesh</p>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #9a9a9a;">— ACOB Support Team</p>
    </div>
  `;
}

export function contactResponseEmail(params: { name: string; subject: string; replyBody: string }) {
  return {
    subject: `Re: ${params.subject.replace(/[\r\n]/g, " ")}`,
    html: wrap(`
      <p>Hi ${escapeHtml(params.name)},</p>
      <p>Thanks for reaching out to ACOB. Here's our response:</p>
      <blockquote style="border-left: 2px solid #ddd; margin: 16px 0; padding-left: 12px; color: #333;">${escapeHtml(params.replyBody)}</blockquote>
      <p>If you have further questions, just reply to this email.</p>
    `),
  };
}

export function supportResponseEmail(params: { name: string; replyBody: string }) {
  return {
    subject: "New reply on your ACOB support conversation",
    html: wrap(`
      <p>Hi ${escapeHtml(params.name)},</p>
      <p>You have a new reply from ACOB Support:</p>
      <blockquote style="border-left: 2px solid #ddd; margin: 16px 0; padding-left: 12px; color: #333;">${escapeHtml(params.replyBody)}</blockquote>
      <p>Sign in to your ACOB dashboard to continue the conversation.</p>
    `),
  };
}

export function approvalRequestedEmail(params: { type: string }) {
  return {
    subject: "A new approval request needs your review",
    html: wrap(`
      <p>A new <strong>${escapeHtml(params.type.replace(/_/g, " "))}</strong> request is awaiting your review in the ACOB dashboard.</p>
    `),
  };
}

export function approvalDecidedEmail(params: { type: string; status: "approved" | "rejected" }) {
  return {
    subject: `Your request was ${params.status}`,
    html: wrap(`
      <p>Your <strong>${escapeHtml(params.type.replace(/_/g, " "))}</strong> request has been <strong>${escapeHtml(params.status)}</strong>.</p>
    `),
  };
}

export function securityNotificationEmail(params: { message: string }) {
  return {
    subject: "Security notification — ACOB account",
    html: wrap(`<p>${escapeHtml(params.message)}</p><p>If this wasn't you, please reset your password immediately.</p>`),
  };
}
