import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Download,
  FileText,
  GraduationCap,
  Play,
} from "lucide-react";

import { db } from "@/lib/db/client";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Study materials, problem sets, guides, and educational resources from Applied Cognitio Olympiad Bangladesh.",
};

const RESOURCE_KINDS = ["resource", "study_guide", "video_tutorial"] as const;

function getKindLabel(kind: string) {
  switch (kind) {
    case "study_guide":
      return "Study Guide";
    case "video_tutorial":
      return "Video Tutorial";
    default:
      return "Resource";
  }
}

function getKindIcon(kind: string) {
  switch (kind) {
    case "study_guide":
      return BookOpen;
    case "video_tutorial":
      return Play;
    default:
      return FileText;
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

export default async function ResourcesPage() {
  const resources = await db.content.findMany({
    where: {
      status: "published",
      kind: {
        in: [...RESOURCE_KINDS],
      },
    },
    orderBy: [
      {
        publishedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const featured = resources[0] ?? null;
  const remainingResources = resources.slice(1);

  return (
    <main className="min-h-screen bg-background">
      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="max-w-4xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-9 bg-accent" />

              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                Resources
              </span>
            </div>

            <h1 className="font-display text-5xl leading-[0.98] tracking-[-0.04em] text-primary sm:text-6xl lg:text-7xl">
              Study material built for
              <br />
              understanding, not repetition.
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-6 text-secondary sm:text-base">
              Problem sets, guides, official documents, and learning material
              created to make ideas easier to understand.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          COMPACT CATEGORY STRIP
      ========================================================= */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {/* Problem sets */}
            <div className="flex items-center gap-4 py-6 sm:pr-8">
              <span className="font-mono text-[9px] tracking-[0.18em] text-accent">
                01
              </span>

              <div>
                <h2 className="font-display text-lg text-primary">
                  Problem sets
                </h2>

                <p className="mt-0.5 text-xs text-muted">
                  Practice & reasoning
                </p>
              </div>
            </div>

            {/* Study guides */}
            <div className="flex items-center gap-4 py-6 sm:px-8">
              <span className="font-mono text-[9px] tracking-[0.18em] text-accent">
                02
              </span>

              <div>
                <h2 className="font-display text-lg text-primary">
                  Study guides
                </h2>

                <p className="mt-0.5 text-xs text-muted">
                  Concepts & technique
                </p>
              </div>
            </div>

            {/* Official */}
            <div className="flex items-center gap-4 py-6 sm:pl-8">
              <span className="font-mono text-[9px] tracking-[0.18em] text-accent">
                03
              </span>

              <div>
                <h2 className="font-display text-lg text-primary">
                  Official material
                </h2>

                <p className="mt-0.5 text-xs text-muted">
                  Rulebooks & documents
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURED RESOURCE
      ========================================================= */}
      {featured ? (
        <section className="mx-auto max-w-7xl px-6 pt-16 lg:px-8 lg:pt-20">
          <div className="mb-6 flex items-end justify-between border-b border-border pb-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                Featured resource
              </p>

              <h2 className="mt-2 font-display text-2xl text-primary">
                Latest publication
              </h2>
            </div>

            <span className="hidden text-xs text-muted sm:block">
              {formatDate(featured.publishedAt)}
            </span>
          </div>

          <article className="grid overflow-hidden border border-border bg-elevated lg:grid-cols-[1.2fr_0.8fr]">
            {/* FEATURED IMAGE */}
            <Link
              href={`/resources/${featured.slug}`}
              className="group relative block aspect-[16/10] overflow-hidden bg-surface lg:aspect-auto lg:min-h-[430px]"
            >
              {featured.coverImageUrl ? (
                <Image
                  src={featured.coverImageUrl}
                  alt={featured.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.025]"
                />
              ) : (
                <div className="flex h-full min-h-[300px] items-center justify-center">
                  <FileText className="h-12 w-12 text-muted" />
                </div>
              )}

              <div className="absolute left-5 top-5 inline-flex items-center gap-2 border border-white/20 bg-black/65 px-3 py-1.5 text-[9px] uppercase tracking-[0.12em] text-white backdrop-blur-md">
                {getKindLabel(featured.kind)}
              </div>
            </Link>

            {/* FEATURED CONTENT */}
            <div className="flex flex-col justify-between p-7 sm:p-9 lg:p-10">
              <div>
                <div className="mb-5 flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.18em] text-accent">
                  <span className="h-px w-5 bg-accent" />
                  ACOB publication
                </div>

                <Link href={`/resources/${featured.slug}`}>
                  <h3 className="font-display text-3xl leading-[1.05] tracking-[-0.025em] text-primary transition-colors hover:text-accent sm:text-4xl">
                    {featured.title}
                  </h3>
                </Link>

                {featured.description ? (
                  <p className="mt-5 text-sm leading-6 text-secondary">
                    {featured.description}
                  </p>
                ) : null}

                {featured.publishedAt ? (
                  <p className="mt-5 text-[10px] uppercase tracking-[0.12em] text-muted">
                    Published {formatDate(featured.publishedAt)}
                  </p>
                ) : null}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                <Link
                  href={`/resources/${featured.slug}`}
                  className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-85"
                >
                  Explore resource
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>

                {featured.fileUrl ? (
                  <a
                    href={featured.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 border border-border-strong px-4 py-2.5 text-xs text-primary transition-colors hover:border-accent hover:text-accent"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {/* =========================================================
          ALL RESOURCES
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="mb-8 flex items-end justify-between border-b border-border pb-5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
              Library
            </p>

            <h2 className="mt-2 font-display text-3xl tracking-tight text-primary">
              Explore all resources.
            </h2>
          </div>

          <span className="text-xs text-muted">
            {resources.length}{" "}
            {resources.length === 1 ? "resource" : "resources"}
          </span>
        </div>

        {resources.length === 0 ? (
          <div className="border border-border px-6 py-16 text-center">
            <GraduationCap className="mx-auto h-8 w-8 text-muted" />

            <h3 className="mt-4 font-display text-xl text-primary">
              No resources published yet
            </h3>

            <p className="mt-2 text-sm text-secondary">
              New ACOB learning material will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {(remainingResources.length > 0
              ? remainingResources
              : resources
            ).map((resource) => {
              const Icon = getKindIcon(resource.kind);

              return (
                <article key={resource.id} className="group flex flex-col">
                  {/* CARD IMAGE */}
                  <Link
                    href={`/resources/${resource.slug}`}
                    className="relative block aspect-[16/10] overflow-hidden border border-border bg-elevated"
                  >
                    {resource.coverImageUrl ? (
                      <Image
                        src={resource.coverImageUrl}
                        alt={resource.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Icon className="h-9 w-9 text-muted" />
                      </div>
                    )}

                    <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 border border-white/20 bg-black/65 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-white backdrop-blur-md">
                      <Icon className="h-3 w-3" />
                      {getKindLabel(resource.kind)}
                    </div>
                  </Link>

                  {/* CARD CONTENT */}
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/resources/${resource.slug}`}
                      className="mt-4 block"
                    >
                      <h3 className="font-display text-xl leading-tight text-primary transition-colors group-hover:text-accent">
                        {resource.title}
                      </h3>
                    </Link>

                    {resource.description ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-secondary">
                        {resource.description}
                      </p>
                    ) : null}

                    <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                      <Link
                        href={`/resources/${resource.slug}`}
                        className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-primary transition-colors hover:text-accent"
                      >
                        View resource
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>

                      {resource.fileUrl ? (
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Download ${resource.title}`}
                          className="inline-flex h-7 w-7 items-center justify-center border border-border text-muted transition-colors hover:border-accent hover:text-accent"
                        >
                          <Download className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
