import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { AnimatedSeparator } from "@/components/ui/Separator";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/sections/PageHero";
import { db } from "@/lib/db/client";
import { getOlympiadPhase } from "@/lib/olympiads/lifecycle";

export const metadata: Metadata = {
  alternates: { canonical: "/olympiads" },
  title: "Olympiads",
  description:
    "ACOB Olympiads are academic competitions designed to reward reasoning, application, and understanding over recall.",
};

const RECOGNITION_TIERS = [
  { rank: "1st", name: "Prime" },
  { rank: "2nd", name: "Elite" },
  { rank: "3rd", name: "Merit" },
  { rank: "4th – 10th", name: "Honourable Mention" },
  { rank: "All other participants", name: "Participation" },
];

export default async function OlympiadsPage() {
  const olympiads = await db.olympiad.findMany({
    where: { status: "published" },
    orderBy: [{ startAt: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      posterUrl: true,
      subject: true,
      durationMinutes: true,
      registrationStartAt: true,
      registrationEndAt: true,
      startAt: true,
      endAt: true,
      status: true,
      registrationEnabled: true,
    },
  });

  return (
    <>
      <PageHero
        eyebrow=""
        title="Every problem is written to be reasoned through, not recalled."
        description="ACOB Olympiads run across subjects and grade bands, each built to test how a student thinks under a genuinely unfamiliar problem."
      />

      <Section>
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <Reveal weight="standard">
              <MetadataLabel>Current cycle</MetadataLabel>
              <h2 className="mt-4 font-display text-3xl tracking-tight text-primary sm:text-4xl">
                Tracks &amp; registration
              </h2>
            </Reveal>
          </div>

          {olympiads.length === 0 ? (
            <Reveal weight="minor" order={1} className="mt-10">
              <EmptyState
                title="This cycle's tracks haven't been published yet"
                description="Subjects, grade bands, dates, and registration will appear here directly from ACOB's records as soon as they're confirmed."
                action={
                  <Button href="/contact" variant="secondary" className="mt-2">
                    Get notified
                  </Button>
                }
              />
            </Reveal>
          ) : (
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {olympiads.map((olympiad, index) => (
                <Reveal key={olympiad.id} weight="minor" order={index}>
                  <article className="flex h-full flex-col justify-between overflow-hidden rounded-lg border border-border bg-elevated transition-all duration-300 hover:border-accent/40">
                    <div>
                      {/* Poster Banner Section */}
                      {olympiad.posterUrl ? (
                        <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-border bg-black/40">
                          <Image
                            src={olympiad.posterUrl}
                            alt={olympiad.title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            unoptimized
                            className="object-cover transition-transform duration-500 hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="h-28 w-full border-b border-border bg-gradient-to-br from-neutral-900 to-neutral-950 flex items-center justify-center">
                          <span className="font-mono text-xs uppercase tracking-widest text-muted/60">
                            {olympiad.subject ?? "ACOB Olympiad"}
                          </span>
                        </div>
                      )}

                      <div className="p-6">
                        <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">
                          {getOlympiadPhase(olympiad).replace(/_/g, " ")}
                        </p>
                        <h3 className="mt-3 font-display text-2xl text-primary">
                          {olympiad.title}
                        </h3>
                        {olympiad.description ? (
                          <p className="mt-3 text-sm leading-relaxed text-secondary line-clamp-3">
                            {olympiad.description}
                          </p>
                        ) : null}
                        <p className="mt-4 text-xs text-muted font-mono">
                          {olympiad.subject ?? "ACOB Olympiad"} ·{" "}
                          {olympiad.durationMinutes} minutes
                        </p>
                      </div>
                    </div>

                    <div className="p-6 pt-0">
                      <Button
                        href={`/olympiads/${olympiad.id}`}
                        variant="secondary"
                        className="w-fit text-xs"
                      >
                        View Olympiad
                      </Button>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </Section>

      <AnimatedSeparator />

      <Section bordered>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <Reveal weight="standard">
              <MetadataLabel>How it works</MetadataLabel>
              <h2 className="mt-4 font-display text-3xl leading-[1.1] tracking-tight text-primary sm:text-4xl">
                Recognition, by how well you reasoned.
              </h2>
            </Reveal>

            <div className="flex flex-col">
              {RECOGNITION_TIERS.map((tier, i) => (
                <Reveal key={tier.name} weight="standard" order={i}>
                  <div className="flex items-center justify-between gap-6 border-t border-border py-5 last:border-b">
                    <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted">
                      {tier.rank}
                    </span>
                    <span className="font-display text-xl text-primary">
                      {tier.name}
                    </span>
                  </div>
                </Reveal>
              ))}
              <Reveal weight="minor" order={RECOGNITION_TIERS.length}>
                <p className="mt-6 text-sm leading-relaxed text-secondary">
                  Every participant also receives a signed appreciation letter
                  from ACOB, regardless of rank.
                </p>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
