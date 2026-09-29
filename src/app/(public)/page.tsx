import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { AnimatedSeparator } from "@/components/ui/Separator";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextLink } from "@/components/ui/TextLink";
import { OrganizationJsonLd } from "@/components/sections/OrganizationJsonLd";
import { db } from "@/lib/db/client";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: "Applied Cognitio Olympiad Bangladesh",
  description:
    "Curiosity over memorisation. ACOB creates academic Olympiads and learning experiences that reward reasoning, application, and understanding — not recall.",
};

export default async function HomePage() {
  const publishedOlympiads = await db.olympiad.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <>
      <OrganizationJsonLd />

      {/* ============ HERO ============ */}
      <section className="field-hero relative overflow-hidden border-b border-border">
        <Container className="relative grid min-h-[610px] items-center gap-12 py-16 sm:py-20 lg:min-h-[680px] lg:grid-cols-[1.15fr_.85fr] lg:gap-16 lg:py-24">
          <div className="field-enter">
            <MetadataLabel className="field-kicker">Applied Cognitio Olympiad Bangladesh</MetadataLabel>
            <h1 className="mt-8 max-w-3xl font-display text-[clamp(3.3rem,8.2vw,7.2rem)] leading-[.91] tracking-[-.055em] text-primary">
              Curiosity<br />over <span className="field-signal italic">memorisation.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-secondary sm:text-lg sm:leading-8">
              We design academic Olympiads that don&apos;t reward how fast a
              student can recall an answer — they reward how well a student can
              reason their way to one.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href="/olympiads" variant="primary">Explore Olympiads</Button>
              <Button href="/about" variant="secondary">Discover ACOB</Button>
            </div>
          </div>

          <div className="method-plate relative mx-auto w-full max-w-[520px] bg-elevated p-5 sm:p-7" role="group" aria-label="ACOB method: observe, reason, apply">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="field-index">METHOD</span>
              <span className="field-index">ACOB—BD</span>
            </div>
            <div className="method-flow py-10 sm:py-12" role="list" aria-label="Question-solving stages">
              <div className="method-stage" role="listitem">
                <span className="method-step-number">01</span>
                <span className="method-step-title">Observe</span>
                <span className="method-step-copy">Question</span>
              </div>
              <ArrowRight aria-hidden="true" className="method-arrow" strokeWidth={1.5} />
              <div className="method-stage" role="listitem">
                <span className="method-step-number">02</span>
                <span className="method-step-title">Reason</span>
                <span className="method-step-copy">Understand</span>
              </div>
              <ArrowRight aria-hidden="true" className="method-arrow" strokeWidth={1.5} />
              <div className="method-stage" role="listitem">
                <span className="method-step-number">03</span>
                <span className="method-step-title">Apply</span>
                <span className="method-step-copy">Solve</span>
              </div>
            </div>
            <div className="border-t border-border pt-3 text-center">
              <span className="field-index">FROM CURIOSITY TO UNDERSTANDING</span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 hidden border-t border-border lg:block">
            <Container className="flex items-center justify-between py-3">
              <span className="field-index">EST. 2025 / BANGLADESH</span>
              <span className="field-index">SCIENCE · THINKING · COMPETITION</span>
              <span className="field-index">FIELD 001</span>
            </Container>
          </div>
        </Container>
        <Container className="pb-5 lg:hidden">
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4">
            <MetadataLabel muted>Founded 2025</MetadataLabel>
            <MetadataLabel muted>Based in Bangladesh</MetadataLabel>
          </div>
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
                  can answer a question correctly without ever wondering why the
                  answer is correct — and pass an examination without becoming
                  curious about the subject itself.
                </p>
              </Reveal>
              <Reveal weight="standard" order={2}>
                <p className="text-lg leading-relaxed text-secondary">
                  That gap, between knowing and understanding, is where
                  curiosity tends to disappear. ACOB exists to close it —
                  through academic challenges, learning resources, and
                  opportunities that push students to question, reason, apply,
                  experiment, and understand.
                </p>
              </Reveal>
              <Reveal weight="standard" order={3}>
                <p className="text-lg leading-relaxed text-primary">
                  Our Olympiads aren&apos;t designed to reward speed or
                  memorisation. They&apos;re designed to celebrate curiosity,
                  intelligence, critical thinking, reasoning, and the ability to
                  apply knowledge.
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
                Every ACOB Olympiad is written to test how a student thinks, not
                just what they&apos;ve memorised. Explore active tracks below or
                view the complete schedule.
              </p>
            </Reveal>
            <Reveal weight="minor" order={1}>
              <Button href="/olympiads" variant="secondary">
                View All Olympiads
              </Button>
            </Reveal>
          </div>

          <Reveal weight="minor" order={2} className="mt-14">
            {publishedOlympiads.length === 0 ? (
              <EmptyState
                title="Olympiad listings open soon"
                description="This section will surface live tracks, subjects, dates, and registration status as soon as the current cycle is published."
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {publishedOlympiads.map((item) => (
                  <div
                    key={item.id}
                    className="group flex flex-col justify-between rounded-xl border border-border bg-elevated/40 overflow-hidden transition-all hover:border-accent/40"
                  >
                    {/* Subtle Top Poster Preview Banner */}
                    {item.posterUrl ? (
                      <div className="relative w-full h-36 overflow-hidden border-b border-border/60 bg-black/40">
                        <Image
                          src={item.posterUrl}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          unoptimized
                          className="object-cover opacity-85 group-hover:opacity-100 transition-all duration-300 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-elevated via-transparent to-transparent opacity-90" />
                      </div>
                    ) : null}

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                          Registration Open
                        </span>
                        <h3 className="mt-3 font-display text-xl text-primary group-hover:text-accent transition-colors">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-secondary">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                        <span className="text-xs text-muted">
                          Duration: {item.durationMinutes} mins
                        </span>
                        <Link
                          href={`/olympiads/${item.id}`}
                          className="text-xs font-semibold text-accent hover:underline"
                        >
                          View Olympiad →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                Conversations with educators, researchers, and past Olympiad
                participants on what curiosity actually looks like.
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
              <TextLink
                href="/ambassadors"
                className="mt-5 inline-block text-sm"
              >
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
          <Reveal
            weight="standard"
            order={1}
            className="mt-8 flex flex-col gap-4 sm:flex-row"
          >
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
