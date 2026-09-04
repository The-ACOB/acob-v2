import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { AnimatedSeparator } from "@/components/ui/Separator";
import { EmptyState } from "@/components/ui/EmptyState";
import { ParallaxOrbital } from "@/components/sections/ParallaxOrbital";
import { ScrollCue } from "@/components/sections/ScrollCue";
import { WordReveal } from "@/components/ui/WordReveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { TextLink } from "@/components/ui/TextLink";
import { OrganizationJsonLd } from "@/components/sections/OrganizationJsonLd";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: "ACOB — Applied Cognitio Olympiad Bangladesh",
  description:
    "Curiosity over memorisation. ACOB creates academic Olympiads and learning experiences that reward reasoning, application, and understanding — not recall.",
};

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-10%] top-[-8%] h-[600px] w-[600px] opacity-70 sm:h-[760px] sm:w-[760px] lg:right-[-6%] lg:top-[-12%]"
        >
          <ParallaxOrbital className="h-full w-full" />
        </div>

        <Container className="relative pt-20 pb-16 sm:pt-28 sm:pb-20 lg:pt-36">
          <Reveal weight="minor">
            <div className="mb-8 flex items-center gap-3">
              <Image
                src="/assets/logo.png"
                alt=""
                width={28}
                height={28}
                className="h-6 w-auto opacity-80"
                aria-hidden
              />
              <MetadataLabel>Applied Cognitio Olympiad Bangladesh</MetadataLabel>
            </div>
          </Reveal>

          <h1 className="max-w-4xl font-display text-[13vw] leading-[0.98] tracking-tight text-primary sm:text-6xl lg:text-[5.5rem]">
            <WordReveal text="Curiosity" delay={0.1} />
            <br />
            <WordReveal text="over" delay={0.34} />{" "}
            <WordReveal text="memorisation." delay={0.42} className="text-accent italic" />
          </h1>

          <Reveal weight="standard" order={1}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-secondary">
              We design academic Olympiads that don&apos;t reward how fast a
              student can recall an answer — they reward how well a student
              can reason their way to one.
            </p>
          </Reveal>

          <Reveal weight="standard" order={2}>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <MagneticButton>
                <Button href="/olympiads" variant="primary">
                  Explore Olympiads
                </Button>
              </MagneticButton>
              <MagneticButton>
                <Button href="/about" variant="secondary">
                  Discover ACOB
                </Button>
              </MagneticButton>
            </div>
          </Reveal>
        </Container>

        <ScrollCue />

        <Container className="relative pb-16 sm:pb-20">
          <Reveal weight="minor" order={3}>
            <div className="flex flex-wrap items-center gap-x-10 gap-y-3 border-t border-border pt-6">
              <MetadataLabel muted>Founded 2025</MetadataLabel>
              <MetadataLabel muted>Based in Bangladesh</MetadataLabel>
              <MetadataLabel muted>Curiosity over memorisation</MetadataLabel>
            </div>
          </Reveal>
        </Container>
      </section>

      <AnimatedSeparator />

      {/* ============ PHILOSOPHY ============ */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <Reveal weight="standard">
              <MetadataLabel>The gap</MetadataLabel>
              <h2 className="mt-4 font-display text-3xl leading-[1.1] tracking-tight text-primary sm:text-4xl">
                A correct answer isn&apos;t the same thing as an understood one.
              </h2>
            </Reveal>

            <div className="flex flex-col gap-7">
              <Reveal weight="standard" order={1}>
                <p className="text-lg leading-relaxed text-secondary">
                  ACOB was founded in 2025 on a simple belief: education should
                  do more than measure what a student can remember. A student
                  can answer a question correctly without ever wondering why
                  the answer is correct — and pass an examination without
                  becoming curious about the subject itself.
                </p>
              </Reveal>
              <Reveal weight="standard" order={2}>
                <p className="text-lg leading-relaxed text-secondary">
                  That gap, between knowing and understanding, is where
                  curiosity tends to disappear. ACOB exists to close it — through
                  academic challenges, learning resources, and opportunities
                  that push students to question, reason, apply, experiment,
                  and understand.
                </p>
              </Reveal>
              <Reveal weight="standard" order={3}>
                <p className="text-lg leading-relaxed text-primary">
                  Our Olympiads aren&apos;t designed to reward speed or
                  memorisation. They&apos;re designed to celebrate curiosity,
                  intelligence, critical thinking, reasoning, and the ability
                  to apply knowledge.
                </p>
              </Reveal>
              <Reveal weight="minor" order={4}>
                <p className="font-display text-xl italic text-accent">
                  The goal isn&apos;t students who know more answers. It&apos;s
                  students who ask better questions.
                </p>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      <AnimatedSeparator />

      {/* ============ OLYMPIADS HIGHLIGHT ============ */}
      <Section bordered>
        <Container>
          <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
            <Reveal weight="standard" className="max-w-xl">
              <MetadataLabel>Olympiads</MetadataLabel>
              <h2 className="mt-4 font-display text-3xl leading-[1.1] tracking-tight text-primary sm:text-4xl">
                Competitions built around reasoning, not recall.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-secondary">
                Every ACOB Olympiad is written to test how a student thinks,
                not just what they&apos;ve memorised. Full details on this
                year&apos;s tracks, subjects, and registration open here soon.
              </p>
            </Reveal>
            <Reveal weight="minor" order={1}>
              <Button href="/olympiads" variant="secondary">
                View Olympiads
              </Button>
            </Reveal>
          </div>

          <Reveal weight="minor" order={2} className="mt-14">
            <EmptyState
              title="Olympiad listings open soon"
              description="This section will surface live tracks, subjects, dates, and registration status as soon as the current cycle is published."
            />
          </Reveal>
        </Container>
      </Section>

      {/* ============ RESOURCES + PODCAST + AMBASSADORS STRIP ============ */}
      <Section bordered>
        <Container>
          <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
            <Reveal weight="standard">
              <MetadataLabel>Resources</MetadataLabel>
              <h3 className="mt-4 font-display text-2xl tracking-tight text-primary">
                Learning material for the curious.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-secondary">
                Guides and study material built around applied understanding,
                not test drilling.
              </p>
              <TextLink href="/resources" className="mt-5 inline-block text-sm">
                Browse resources →
              </TextLink>
            </Reveal>

            <Reveal weight="standard" order={1}>
              <MetadataLabel>Inside Excellence</MetadataLabel>
              <h3 className="mt-4 font-display text-2xl tracking-tight text-primary">
                The ACOB podcast.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-secondary">
                Conversations with educators, researchers, and past
                Olympiad participants on what curiosity actually looks like.
              </p>
              <TextLink href="/podcasts" className="mt-5 inline-block text-sm">
                Listen in →
              </TextLink>
            </Reveal>

            <Reveal weight="standard" order={2}>
              <MetadataLabel>Ambassadors</MetadataLabel>
              <h3 className="mt-4 font-display text-2xl tracking-tight text-primary">
                Represent ACOB at your institution.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-secondary">
                Ambassadors carry ACOB&apos;s philosophy into their own schools
                and communities.
              </p>
              <TextLink href="/ambassadors" className="mt-5 inline-block text-sm">
                Learn more →
              </TextLink>
            </Reveal>
          </div>
        </Container>
      </Section>

      <AnimatedSeparator />

      {/* ============ CLOSING CTA ============ */}
      <Section className="pb-28 sm:pb-36">
        <Container>
          <Reveal weight="major" className="max-w-2xl">
            <h2 className="font-display text-4xl leading-[1.05] tracking-tight text-primary sm:text-5xl">
              Ready to compete on how you think?
            </h2>
          </Reveal>
          <Reveal weight="standard" order={1} className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button href="/olympiads" variant="primary">
              Explore Olympiads
            </Button>
            <Button href="/contact" variant="secondary">
              Get in touch
            </Button>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
