import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
} from "lucide-react";
import { notFound } from "next/navigation";

import { db } from "@/lib/db/client";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function kindLabel(kind: string) {
  switch (kind) {
    case "study_guide":
      return "Study Guide";
    case "video_tutorial":
      return "Video Tutorial";
    default:
      return "Resource";
  }
}

function formatDate(date: Date | null) {
  if (!date) return null;

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function bodyToBlocks(body: string | null) {
  if (!body) return [];

  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const resource = await db.content.findFirst({
    where: {
      slug,
      status: "published",
      kind: {
        in: ["resource", "study_guide", "video_tutorial"],
      },
    },
    select: {
      title: true,
      description: true,
      coverImageUrl: true,
    },
  });

  if (!resource) {
    return {
      title: "Resource not found",
    };
  }

  return {
    title: resource.title,
    description: resource.description ?? undefined,
    openGraph: {
      title: resource.title,
      description: resource.description ?? undefined,
      images: resource.coverImageUrl ? [resource.coverImageUrl] : undefined,
    },
  };
}

export default async function ResourceDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const resource = await db.content.findFirst({
    where: {
      slug,
      status: "published",
      kind: {
        in: ["resource", "study_guide", "video_tutorial"],
      },
    },
  });

  if (!resource) {
    notFound();
  }

  const relatedResources = await db.content.findMany({
    where: {
      status: "published",
      kind: {
        in: ["resource", "study_guide", "video_tutorial"],
      },
      id: {
        not: resource.id,
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 3,
  });

  const publishedDate = formatDate(resource.publishedAt);
  const blocks = bodyToBlocks(resource.body);

  return (
    <main className="min-h-screen bg-background">
      {/* Back */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Link
            href="/resources"
            className="flex h-14 items-center gap-2 text-[9px] font-mono uppercase tracking-[0.18em] text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All resources
          </Link>
        </div>
      </div>

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-16">
        <div className="grid overflow-hidden border border-border bg-elevated lg:grid-cols-[48%_52%]">
          {/* COVER */}
          <div className="relative aspect-[4/3] min-h-[320px] bg-black lg:aspect-auto lg:min-h-[560px]">
            {resource.coverImageUrl ? (
              <Image
                src={resource.coverImageUrl}
                alt={resource.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <FileText className="h-10 w-10 text-muted" />
              </div>
            )}
          </div>

          {/* INFORMATION */}
          <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-14">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-7 bg-accent" />

                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                  {kindLabel(resource.kind)}
                </span>
              </div>

              <h1 className="mt-7 max-w-xl font-display text-4xl leading-[0.96] tracking-[-0.04em] text-primary sm:text-5xl lg:text-6xl">
                {resource.title}
              </h1>

              {resource.description ? (
                <p className="mt-7 max-w-lg text-sm leading-6 text-secondary sm:text-base sm:leading-7">
                  {resource.description}
                </p>
              ) : null}
            </div>

            <div className="mt-10">
              <div className="grid grid-cols-2 gap-6 border-y border-border py-5">
                {publishedDate ? (
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
                      Published
                    </p>

                    <p className="mt-2 flex items-center gap-2 text-xs text-primary">
                      <CalendarDays className="h-3.5 w-3.5 text-muted" />
                      {publishedDate}
                    </p>
                  </div>
                ) : null}

                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
                    Format
                  </p>

                  <p className="mt-2 text-xs text-primary">
                    {resource.fileUrl ? "Downloadable file" : "Online resource"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {resource.fileUrl ? (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-primary px-5 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-primary-foreground transition-opacity hover:opacity-85"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download resource
                  </a>
                ) : null}

                {resource.externalUrl ? (
                  <a
                    href={resource.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 border border-border-strong px-5 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-primary transition-colors hover:border-accent hover:text-accent"
                  >
                    Open resource
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CONTENT
      ========================================================= */}
      <section className="border-y border-border">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-24">
            {/* ARTICLE */}
            <article>
              <div className="mb-10">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                  About this resource
                </p>

                <h2 className="mt-3 font-display text-3xl tracking-[-0.025em] text-primary sm:text-4xl">
                  Understanding the material
                </h2>
              </div>

              {blocks.length > 0 ? (
                <div className="max-w-3xl space-y-8">
                  {blocks.map((block, index) => {
                    const lines = block
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean);

                    return (
                      <div key={index}>
                        {lines.map((line, lineIndex) => {
                          const looksLikeHeading =
                            lineIndex === 0 &&
                            lines.length > 1 &&
                            !/^\d+\./.test(line);

                          if (looksLikeHeading) {
                            return (
                              <h3
                                key={line}
                                className="mb-3 font-display text-xl text-primary"
                              >
                                {line}
                              </h3>
                            );
                          }

                          if (/^\d+\./.test(line)) {
                            return (
                              <div
                                key={line}
                                className="flex gap-4 py-1 text-[14px] leading-7 text-secondary"
                              >
                                <span className="w-5 shrink-0 font-mono text-[10px] text-accent">
                                  {line.match(/^\d+\./)?.[0]}
                                </span>

                                <span>{line.replace(/^\d+\.\s*/, "")}</span>
                              </div>
                            );
                          }

                          return (
                            <p
                              key={line}
                              className="text-[15px] leading-8 text-secondary"
                            >
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="max-w-2xl text-sm leading-7 text-secondary">
                  Additional information for this resource is not available
                  here. Please use the download or external resource link above.
                </p>
              )}
            </article>

            {/* SIDEBAR */}
            <aside>
              <div className="border-t-2 border-primary pt-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
                  Resource information
                </p>

                <div className="mt-6 divide-y divide-border">
                  <div className="py-4">
                    <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-muted">
                      Type
                    </p>

                    <p className="mt-2 text-sm text-primary">
                      {kindLabel(resource.kind)}
                    </p>
                  </div>

                  {publishedDate ? (
                    <div className="py-4">
                      <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-muted">
                        Published
                      </p>

                      <p className="mt-2 text-sm text-primary">
                        {publishedDate}
                      </p>
                    </div>
                  ) : null}

                  <div className="py-4">
                    <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-muted">
                      Publisher
                    </p>

                    <p className="mt-2 text-sm leading-6 text-primary">
                      Applied Cognitio Olympiad Bangladesh
                    </p>
                  </div>
                </div>

                {resource.fileUrl ? (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 flex items-center justify-between bg-primary px-4 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-primary-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="h-3.5 w-3.5" />
                      Download file
                    </span>

                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* =========================================================
          RELATED
      ========================================================= */}
      {relatedResources.length > 0 ? (
        <section>
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="flex items-end justify-between border-b border-border pb-5">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                  Continue exploring
                </p>

                <h2 className="mt-2 font-display text-3xl text-primary">
                  Related resources
                </h2>
              </div>

              <Link
                href="/resources"
                className="hidden items-center gap-2 text-[9px] uppercase tracking-[0.12em] text-muted hover:text-primary sm:flex"
              >
                View all resources
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedResources.map((related) => (
                <Link
                  key={related.id}
                  href={`/resources/${related.slug}`}
                  className="group"
                >
                  <div className="relative aspect-[16/10] overflow-hidden border border-border bg-black">
                    {related.coverImageUrl ? (
                      <Image
                        src={related.coverImageUrl}
                        alt={related.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FileText className="h-8 w-8 text-muted" />
                      </div>
                    )}
                  </div>

                  <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
                    {kindLabel(related.kind)}
                  </p>

                  <h3 className="mt-2 font-display text-xl leading-tight text-primary transition-colors group-hover:text-accent">
                    {related.title}
                  </h3>

                  {related.description ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-secondary">
                      {related.description}
                    </p>
                  ) : null}

                  <span className="mt-4 inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.12em] text-primary">
                    View resource
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
