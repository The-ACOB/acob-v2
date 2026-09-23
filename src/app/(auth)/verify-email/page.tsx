"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { verifyEmailAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [errorMessage, setErrorMessage] = useState(
    token
      ? "Invalid or expired token."
      : "This link is missing its verification token.",
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!token) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await verifyEmailAction(token);

        if (result.ok) {
          setStatus("success");

          setTimeout(() => {
            router.push("/onboarding");
            router.refresh();
          }, 600);
        } else {
          setStatus("error");
          setErrorMessage(result.error);
        }
      } catch {
        setStatus("error");
        setErrorMessage("An unexpected error occurred during verification.");
      }
    });
  }, [token, router]);

  if (status === "loading" || isPending) {
    return (
      <AuthCard
        eyebrow="Account verification"
        title="Verifying your email..."
        description="Please wait while we confirm your account and sign you in."
      >
        <div className="flex items-center justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard
        eyebrow="Account verification"
        title="Email verified!"
        description="Signing you in and routing you to your onboarding..."
      >
        <div className="flex items-center justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="Account verification"
      title="Verification failed"
      description={errorMessage}
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthCard
          eyebrow="Account verification"
          title="Loading..."
          description="Preparing verification..."
        >
          <div className="flex items-center justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        </AuthCard>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
