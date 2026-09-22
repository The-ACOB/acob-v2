import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/sections/PageHero";
import { db } from "@/lib/db/client";
import { Download, ExternalLink, FileText } from "lucide-react";

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

export default async function ResourcesPage() {
  const resources = await db.content.findMany({
    where: {
      status: "published",
      kind: { in: ["resource", "study_guide", "video_tutorial"] },
    },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <>
      <PageHero
        eyebrow=""
        title="Study material built for understanding, not repetition."
        description="Everything here is designed to build intuition for a subject — not to be memorised the night before a competition."
      />

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-3">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.label} weight="standard" order={i}>
                <MetadataLabel>{`0${i + 1}`}</MetadataLabel>

                <h3 className="mt-4 font-display text-xl text-primary">
                  {c.label}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-secondary">
                  {c.body}
                </p>
              </Reveal>
            ))}
          </div>

          {resources.length === 0 ? (
            <Reveal weight="minor" order={CATEGORIES.length} className="mt-20">
              <EmptyState
                title="The resource library is being prepared"
                description="Published material will appear here as ACOB releases it."
              />
            </Reveal>
          ) : (
            <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource, index) => (
                <Reveal key={resource.id} weight="standard" order={index}>
                  <div className="group relative flex h-full flex-col justify-between rounded-2xl border border-border bg-card/40 p-5 backdrop-blur-xl transition-all duration-300 hover:border-border/80">
                    <div>
                      {/* Cover Thumbnail Preview */}
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted border border-border/50 mb-5">
                        {resource.coverImageUrl ? (
                          <Image
                            src={resource.coverImageUrl}
                            alt={resource.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <FileText className="h-10 w-10 stroke-1" />
                          </div>
                        )}

                        <span className="absolute top-3 right-3 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-md border border-border">
                          {resource.kind.replace("_", " ")}
                        </span>
                      </div>

                      {/* Content Details */}
                      <h2 className="font-display text-xl text-primary line-clamp-1">
                        {resource.title}
                      </h2>

                      {resource.description ? (
                        <p className="mt-2 text-sm text-secondary line-clamp-2 leading-relaxed">
                          {resource.description}
                        </p>
                      ) : null}
                    </div>

                    {/* Action Links */}
                    <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border/60">
                      {resource.fileUrl ? (
                        <a
                          href={resource.fileUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-black hover:opacity-90 transition-opacity shadow-sm"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download File
                        </a>
                      ) : null}

                      {resource.externalUrl ? (
                        <a
                          href={resource.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center justify-center rounded-xl bg-secondary/20 px-3 py-2.5 text-xs font-medium text-secondary hover:bg-secondary/30 transition-colors border border-border ${
                            !resource.fileUrl ? "w-full gap-2" : ""
                          }`}
                        >
                          <ExternalLink className="h-4 w-4" />

                          {!resource.fileUrl ? "Open External Link" : ""}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
