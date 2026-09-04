import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/sections/PageHero";

export const metadata: Metadata = {
  alternates: { canonical: "/resources" },
  title: "Resources",
  description:
    "Learning material from ACOB, built around applied understanding rather than test drilling.",
};

const CATEGORIES = [
  {
    label: "Problem sets",
    body: "Worked and unworked problems from past Olympiad tracks, annotated for reasoning rather than answers alone.",
  },
  {
    label: "Study guides",
    body: "Subject primers written to build intuition first, technique second.",
  },
  {
    label: "Educator notes",
    body: "Material for teachers coaching students toward ACOB's Olympiads.",
  },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Study material built for understanding, not repetition."
        description="Everything here is designed to build intuition for a subject — not to be memorised the night before a competition."
      />

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-3">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.label} weight="standard" order={i}>
                <MetadataLabel>{`0${i + 1}`}</MetadataLabel>
                <h3 className="mt-4 font-display text-xl text-primary">{c.label}</h3>
                <p className="mt-3 text-sm leading-relaxed text-secondary">{c.body}</p>
              </Reveal>
            ))}
          </div>

          <Reveal weight="minor" order={CATEGORIES.length} className="mt-20">
            <EmptyState
              title="The resource library is being prepared"
              description="Published guides, problem sets, and educator material will appear here as ACOB's academic team releases them."
            />
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
