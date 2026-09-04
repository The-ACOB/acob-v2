import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { AnimatedSeparator } from "@/components/ui/Separator";
import { PageHero } from "@/components/sections/PageHero";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "About",
  description:
    "ACOB was founded in 2025 in Bangladesh on the belief that education should measure understanding, not memorisation.",
};

const VALUES = [
  {
    label: "Curiosity",
    body: "We design toward the question a student asks after they already have the answer.",
  },
  {
    label: "Reasoning",
    body: "Olympiad problems are built to reward a visible chain of thought, not a guessed result.",
  },
  {
    label: "Application",
    body: "Knowledge is tested in contexts a student hasn't already memorised a solution for.",
  },
  {
    label: "Rigor",
    body: "Every challenge is reviewed for academic accuracy before it reaches a single student.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About ACOB"
        title="Founded on the gap between knowing and understanding."
        description="Applied Cognitio Olympiad Bangladesh began in 2025 with a question: what happens to a student's curiosity once they've learned to pass the test?"
      />

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <Reveal weight="standard">
              <MetadataLabel>Our origin</MetadataLabel>
            </Reveal>
            <div className="flex flex-col gap-7">
              <Reveal weight="standard" order={1}>
                <p className="text-lg leading-relaxed text-secondary">
                  A student can answer a question correctly without ever
                  wondering why the answer is correct. They can pass an
                  examination without becoming curious about the subject
                  itself. We watched that happen often enough to think it was
                  worth building something in response.
                </p>
              </Reveal>
              <Reveal weight="standard" order={2}>
                <p className="text-lg leading-relaxed text-secondary">
                  ACOB creates academic challenges, learning resources, and
                  opportunities that encourage students to question, reason,
                  apply, experiment, and understand — rather than simply
                  recall. It&apos;s a slower, harder standard to design for.
                  We think it&apos;s the right one.
                </p>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      <AnimatedSeparator />

      <Section bordered>
        <Container>
          <Reveal weight="standard">
            <MetadataLabel>What we hold to</MetadataLabel>
            <h2 className="mt-4 max-w-lg font-display text-3xl leading-[1.1] tracking-tight text-primary sm:text-4xl">
              Four things every Olympiad is designed around.
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <Reveal key={v.label} weight="standard" order={i + 1}>
                <div className="border-t border-border-strong pt-5">
                  <h3 className="font-display text-xl text-primary">{v.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-secondary">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
