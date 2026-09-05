import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { AnimatedSeparator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/sections/PageHero";

const RESPONSIBILITIES = [
  {
    label: "Represent",
    body: "Carry ACOB's philosophy into your own school or community.",
  },
  {
    label: "Organise",
    body: "Help coordinate registration and awareness for upcoming Olympiads.",
  },
  {
    label: "Report",
    body: "Share what's working — and what isn't — from your institution.",
  },
];

export const metadata: Metadata = {
  alternates: { canonical: "/ambassadors" },
  title: "Ambassadors",
  description:
    "ACOB's ambassador program connects students and educators who carry ACOB's philosophy into their own institutions.",
};

export default function AmbassadorsPage() {
  return (
    <>
      <PageHero
        eyebrow=""
        title="Represent ACOB where you already are."
        description="Ambassadors are students and educators who bring ACOB's Olympiads and philosophy to their own schools, colleges, and communities."
      />

      {/* <Section>
        <Container>
          <div className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-3">
            {RESPONSIBILITIES.map((r, i) => (
              <Reveal key={r.label} weight="standard" order={i}>
                <MetadataLabel>{`0${i + 1}`}</MetadataLabel>
                <h3 className="mt-4 font-display text-xl text-primary">{r.label}</h3>
                <p className="mt-3 text-sm leading-relaxed text-secondary">{r.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section> */}

      <AnimatedSeparator />

      <Section bordered className="pb-28 sm:pb-36">
        <Container>
          <Reveal weight="major" className="max-w-xl">
            <h2 className="font-display text-3xl leading-[1.1] tracking-tight text-primary sm:text-4xl">
              Applications for the ambassador program open soon.
            </h2>
          </Reveal>
          <Reveal weight="standard" order={1} className="mt-8">
            <Button href="/contact" variant="secondary">
              Register your interest
            </Button>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
