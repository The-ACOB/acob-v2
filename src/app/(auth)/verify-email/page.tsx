import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { verifyEmailAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard eyebrow="Account verification" title="Missing verification token">
        <p className="text-sm text-secondary">
          This link is missing its token. Sign in and request a new
          verification email from your account.
        </p>
      </AuthCard>
    );
  }

  const result = await verifyEmailAction(token);

  return (
    <AuthCard
      eyebrow="Account verification"
      title={result.ok ? "Email verified" : "Verification failed"}
      description={
        result.ok
          ? "Your email address has been confirmed."
          : (result as { ok: false; error: string }).error
      }
    >
      <Button href="/login" variant="secondary">
        Continue to sign in
      </Button>
      <p className="mt-4 text-xs text-muted">
        <Link href="/" className="underline underline-offset-4">
          Back to ACOB
        </Link>
      </p>
    </AuthCard>
  );
}
