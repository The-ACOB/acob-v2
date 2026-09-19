import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnimatedSeparator } from "@/components/ui/Separator";
import { PageHero } from "@/components/sections/PageHero";
import { db } from "@/lib/db/client";
import { PodcastGrid } from "@/components/podcasts/PodcastGrid";

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

      <AnimatedSeparator />

      <Section bordered className="pt-12 sm:pt-14 lg:pt-16">
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
            <PodcastGrid episodes={episodes} />
          )}
        </Container>
      </Section>
    </>
  );
}
