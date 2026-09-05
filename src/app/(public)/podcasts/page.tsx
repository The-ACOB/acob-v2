import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnimatedSeparator } from "@/components/ui/Separator";
import { PageHero } from "@/components/sections/PageHero";
import { db } from "@/lib/db/client";

export const metadata: Metadata = {
  alternates: { canonical: "/podcasts" },
  title: "Inside Excellence",
  description:
    "Inside Excellence is ACOB's podcast — conversations on curiosity, reasoning, and what it takes to think well under a hard problem.",
};

export default async function PodcastsPage() {
  const episodes = await db.content.findMany({
    where: { kind: "podcast", status: "published" },
    orderBy: { publishedAt: "desc" },
  });
  return (
    <>
      <PageHero
        eyebrow=""
        title="Inside Excellence."
        description="A podcast from ACOB on curiosity, reasoning, and the people who take applied learning seriously — educators, researchers, and past Olympiad participants."
      />

      {/* <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <Reveal weight="standard">
              <MetadataLabel>The premise</MetadataLabel>
            </Reveal>
            <Reveal weight="standard" order={1}>
              <p className="max-w-xl text-lg leading-relaxed text-secondary">
                Every episode starts from the same question ACOB asks in its
                Olympiads: not <em className="text-primary not-italic">what</em>{" "}
                do you know, but{" "}
                <em className="text-primary not-italic">how</em> did you come to
                know it. Guests talk through the reasoning behind their work,
                not just the results of it.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section> */}

      <AnimatedSeparator />

      <Section bordered>
        <Container>
          <Reveal weight="standard">
            <MetadataLabel>Episodes</MetadataLabel>
            <h2 className="mt-4 font-display text-3xl tracking-tight text-primary sm:text-4xl">
              Listen in
            </h2>
          </Reveal>
          {episodes.length === 0 ? (
            <Reveal weight="minor" order={1} className="mt-10">
              <EmptyState
                title="The first episodes are in production"
                description="Published episodes will appear here."
              />
            </Reveal>
          ) : (
            <div className="mt-10 flex flex-col divide-y divide-border border-t border-border">
              {episodes.map((episode) => (
                <article key={episode.id} className="py-6">
                  <h3 className="font-display text-2xl text-primary">
                    {episode.title}
                  </h3>
                  {episode.description ? (
                    <p className="mt-2 text-sm text-secondary">
                      {episode.description}
                    </p>
                  ) : null}
                  {episode.externalUrl ? (
                    <a
                      href={episode.externalUrl}
                      className="mt-3 inline-block text-sm text-accent underline"
                    >
                      Listen
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
