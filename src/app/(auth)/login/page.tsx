import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  return (
    <AuthCard
      eyebrow="Welcome back"
      title="Sign in to ACOB"
      footer={
        <div className="flex flex-col gap-2">
          <Link
            href="/forgot-password"
            className="text-primary underline underline-offset-4"
          >
            Forgot your password?
          </Link>
          <p>
            New to ACOB?{" "}
            <Link
              href="/register"
              className="text-primary underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        </div>
      }
    >
      <LoginForm returnTo={returnTo} />
    </AuthCard>
  );
}
