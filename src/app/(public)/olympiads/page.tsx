import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { AnimatedSeparator } from "@/components/ui/Separator";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/sections/PageHero";

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

export default function OlympiadsPage() {
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
