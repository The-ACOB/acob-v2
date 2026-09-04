import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard eyebrow="Account recovery" title="Missing reset token">
        <p className="text-sm text-secondary">
          This link is missing its token. Request a new password reset link
          and use the link from that email.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard eyebrow="Account recovery" title="Set a new password">
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
