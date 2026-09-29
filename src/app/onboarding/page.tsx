"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const GENDERS = ["Male", "Female", "Other"];
const GRADES = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [gender, setGender] = useState("");
  const [institution, setInstitution] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!gender || !institution || !gradeLevel) {
      setError("Please fill out all required fields to continue.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gender, institution, gradeLevel }),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Failed to update profile.");
        }

        router.push("/dashboard");
        router.refresh();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(message);
      }
    });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12 text-primary">
      <div className="w-full max-w-lg border border-border bg-elevated px-6 py-8 sm:px-10">
        <AuthCard
          eyebrow="WELCOME TO ACOB"
          title="Complete Your Profile"
          description="Set up your academic details to unlock your dashboard and get started."
        >
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {error && (
              <div className="border border-error/30 bg-error/10 p-3.5 text-sm text-error">
                {error}
              </div>
            )}

            {/* Gender Selection Pills */}
            <div className="space-y-2.5">
              <label className="field-kicker block">
                Gender <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {GENDERS.map((g) => {
                  const selected = gender === g;
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setGender(g)}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        selected
                          ? "border-accent bg-accent-soft text-primary ring-1 ring-accent/40"
                          : "border-border bg-background text-secondary hover:border-accent hover:text-primary"
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Institution Input */}
            <div className="space-y-2.5">
              <label className="field-kicker block">
                School or Institution <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. K C Model School & College"
                className="w-full rounded-sm border border-border-strong bg-background px-4 py-3 text-sm text-primary placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Class / Grade Pill Selection Grid (Class 6 to 12) */}
            <div className="space-y-2.5">
              <label className="field-kicker block">
                Class or Grade <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {GRADES.map((grade) => {
                  const selected = gradeLevel === grade;
                  return (
                    <button
                      type="button"
                      key={grade}
                      onClick={() => setGradeLevel(grade)}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                        selected
                          ? "border-accent bg-accent-soft text-primary ring-1 ring-accent/40"
                          : "border-border bg-background text-secondary hover:border-accent hover:text-primary"
                      }`}
                    >
                      {grade}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full rounded-sm bg-accent py-3 font-medium text-background transition-colors hover:bg-accent-strong"
              >
                {isPending
                  ? "Saving Profile..."
                  : "Save and Continue to Dashboard"}
              </Button>
            </div>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
