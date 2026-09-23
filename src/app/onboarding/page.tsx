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
    <div className="relative flex min-h-dvh items-center justify-center bg-[#0a0a0a] px-4 py-12 text-zinc-100 selection:bg-white/20">
      {/* Subtle background ambient glow matching your site hero sections */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-white/[0.03] to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <AuthCard
          eyebrow="WELCOME TO ACOB"
          title="Complete Your Profile"
          description="Set up your academic details to unlock your dashboard and get started."
        >
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400 backdrop-blur-md">
                {error}
              </div>
            )}

            {/* Gender Selection Pills */}
            <div className="space-y-2.5">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
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
                          ? "border-zinc-400 bg-zinc-800/80 text-white shadow-lg shadow-black/40 ring-1 ring-zinc-400/50"
                          : "border-white/10 bg-black/40 text-zinc-400 hover:border-white/20 hover:bg-zinc-900/60 hover:text-zinc-200"
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
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                School or Institution <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. K C Model School & College"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-zinc-600 transition-all focus:border-zinc-400 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            {/* Class / Grade Pill Selection Grid (Class 6 to 12) */}
            <div className="space-y-2.5">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
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
                          ? "border-zinc-400 bg-zinc-800/80 text-white shadow-lg shadow-black/40 ring-1 ring-zinc-400/50"
                          : "border-white/10 bg-black/40 text-zinc-400 hover:border-white/20 hover:bg-zinc-900/60 hover:text-zinc-200"
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
                className="w-full rounded-xl bg-white py-3 text-black font-medium transition-all hover:bg-zinc-200 active:scale-[0.99]"
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
