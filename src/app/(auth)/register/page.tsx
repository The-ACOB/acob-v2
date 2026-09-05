import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  return (
    <AuthCard
      eyebrow="Get started"
      title="Create your ACOB account"
      description="Register to participate in ACOB Olympiads and track your progress."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm returnTo={returnTo} />
    </AuthCard>
  );
}
