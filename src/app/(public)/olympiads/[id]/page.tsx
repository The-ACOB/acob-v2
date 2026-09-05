import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { isEligibleForOlympiad } from "@/lib/exam/eligibility";
import { getOlympiadPhase } from "@/lib/olympiads/lifecycle";
import { OlympiadParticipationCta } from "@/components/public/OlympiadParticipationCta";
import { OlympiadShareButton } from "@/components/public/OlympiadShareButton";
import { getSiteUrl } from "@/lib/env";

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
    <Section>
      <Container>
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Badge tone="success">{phase.replace(/_/g, " ")}</Badge>
            <OlympiadShareButton url={publicUrl} />
          </div>
          <h1 className="mt-6 font-display text-5xl leading-tight text-primary">
            {olympiad.title}
          </h1>
          {olympiad.description ? (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-secondary">
              {olympiad.description}
            </p>
          ) : null}
          <dl className="mt-10 grid gap-6 border-y border-border py-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                Subject
              </dt>
              <dd className="mt-2 text-primary">
                {olympiad.subject ?? "General"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                Duration
              </dt>
              <dd className="mt-2 text-primary">
                {olympiad.durationMinutes} minutes
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                Registration
              </dt>
              <dd className="mt-2 text-primary">
                {olympiad.registrationStartAt?.toLocaleString() ?? "Now"} to{" "}
                {olympiad.registrationEndAt?.toLocaleString() ?? "Exam start"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                Exam
              </dt>
              <dd className="mt-2 text-primary">
                {olympiad.startAt?.toLocaleString() ?? "Now"} to{" "}
                {olympiad.endAt?.toLocaleString() ?? "No closing time"}
              </dd>
            </div>
          </dl>
          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h2 className="font-display text-2xl text-primary">
                Eligibility
              </h2>
              <p className="mt-2 text-sm text-secondary">
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
              <p className="mt-5 text-sm text-muted">
                Questions are available only to registered and eligible
                participants during the live exam window.
              </p>
            </div>
            <OlympiadParticipationCta
              olympiadId={id}
              phase={phase === "draft" ? "closed" : phase}
              authenticated={Boolean(session)}
              registered={Boolean(registration)}
              eligible={eligible}
            />
          </div>
          {registration ? (
            <p className="mt-6 text-sm text-success">
              Your participation state: registered.
            </p>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
