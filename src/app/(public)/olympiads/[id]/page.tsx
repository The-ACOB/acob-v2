import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { isEligibleForOlympiad } from "@/lib/exam/eligibility";
import { getOlympiadPhase } from "@/lib/olympiads/lifecycle";
import { OlympiadParticipationCta } from "@/components/public/OlympiadParticipationCta";
import { OlympiadShareButton } from "@/components/public/OlympiadShareButton";
import { getSiteUrl } from "@/lib/env";

function formatDate(date: Date | null, fallback: string) {
  if (!date) return fallback;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const olympiad = await db.olympiad.findFirst({
    where: { id, status: "published" },
    select: { title: true, description: true },
  });
  return {
    title: olympiad?.title ?? "Olympiad",
    description: olympiad?.description ?? undefined,
  };
}

export default async function PublicOlympiadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const olympiad = await db.olympiad.findFirst({
    where: { id, status: "published" },
    select: {
      id: true,
      title: true,
      description: true,
      subject: true,
      posterUrl: true,
      durationMinutes: true,
      eligibilityMode: true,
      eligibilityGradeLevel: true,
      eligibilityInstitution: true,
      eligibilityAcademicLevel: true,
      registrationEnabled: true,
      registrationStartAt: true,
      registrationEndAt: true,
      startAt: true,
      endAt: true,
      status: true,
    },
  });
  if (!olympiad) notFound();

  const session = await getCurrentSession();
  const registration = session
    ? await db.olympiadRegistration.findUnique({
        where: { olympiadId_userId: { olympiadId: id, userId: session.id } },
      })
    : null;
  const eligible = session
    ? await isEligibleForOlympiad(olympiad, session.id)
    : false;
  const phase = getOlympiadPhase(olympiad);
  const publicUrl = `${getSiteUrl()}/olympiads/${olympiad.id}`;

  return (
    <div className="pt-4 pb-24">
      <Container>
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Top Bar: Badge & Share */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Badge tone="success">{phase.replace(/_/g, " ")}</Badge>
            <OlympiadShareButton url={publicUrl} />
          </div>

          {/* Title */}
          <div>
            <h1 className="font-display text-4xl sm:text-5xl leading-tight text-primary">
              {olympiad.title}
            </h1>
          </div>

          {/* Natural Poster Showcase (Fluid scaling, zero letterboxing) */}
          {olympiad.posterUrl ? (
            <div className="relative w-full rounded-xl border border-border overflow-hidden shadow-2xl bg-card">
              <Image
                src={olympiad.posterUrl}
                alt={olympiad.title}
                width={1200}
                height={675}
                sizes="(max-width: 896px) 100vw, 896px"
                unoptimized
                className="w-full h-auto object-cover"
              />
            </div>
          ) : null}

          {/* Two Column Details Grid */}
          <div className="grid gap-10 lg:grid-cols-[1fr_320px] items-start pt-2">
            {/* Left Column: Description & Eligibility */}
            <div className="space-y-8">
              {olympiad.description ? (
                <div>
                  <h2 className="text-xs uppercase tracking-[0.14em] text-muted mb-3">
                    Overview
                  </h2>
                  <p className="text-lg leading-relaxed text-secondary">
                    {olympiad.description}
                  </p>
                </div>
              ) : null}

              <div className="border-t border-border pt-6">
                <h2 className="font-display text-xl text-primary mb-2">
                  Eligibility Criteria
                </h2>
                <p className="text-sm text-secondary">
                  {olympiad.eligibilityMode === "open"
                    ? "Open to all eligible participants."
                    : [
                        olympiad.eligibilityAcademicLevel,
                        olympiad.eligibilityGradeLevel,
                        olympiad.eligibilityInstitution,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Eligibility criteria apply."}
                </p>
                <p className="mt-2 text-xs text-muted">
                  Questions become accessible only to verified and registered
                  participants during the live window.
                </p>
              </div>

              {registration ? (
                <div className="rounded-lg bg-success/10 border border-success/20 p-4 text-sm text-success font-medium">
                  ✓ Your participation state: Registered successfully.
                </div>
              ) : null}
            </div>

            {/* Right Column: Key Details Card & CTA */}
            <div className="rounded-xl border border-border bg-card/40 p-6 backdrop-blur-sm space-y-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <span className="text-xs uppercase tracking-[0.14em] text-muted block mb-1">
                    Subject
                  </span>
                  <span className="text-primary font-medium">
                    {olympiad.subject ?? "General"}
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-[0.14em] text-muted block mb-1">
                    Duration
                  </span>
                  <span className="text-primary font-medium">
                    {olympiad.durationMinutes} minutes
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-[0.14em] text-muted block mb-1">
                    Registration Window
                  </span>
                  <span className="text-primary text-sm block">
                    {formatDate(olympiad.registrationStartAt, "Now")}
                    <span className="text-muted block text-xs mt-0.5">
                      to {formatDate(olympiad.registrationEndAt, "Exam start")}
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-[0.14em] text-muted block mb-1">
                    Exam Window
                  </span>
                  <span className="text-primary text-sm block">
                    {formatDate(olympiad.startAt, "Now")}
                    <span className="text-muted block text-xs mt-0.5">
                      to {formatDate(olympiad.endAt, "No closing time")}
                    </span>
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-5">
                <OlympiadParticipationCta
                  olympiadId={id}
                  phase={phase === "draft" ? "closed" : phase}
                  authenticated={Boolean(session)}
                  registered={Boolean(registration)}
                  eligible={eligible}
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
