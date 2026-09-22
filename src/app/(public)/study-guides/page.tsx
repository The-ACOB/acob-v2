import { db } from "@/lib/db/client";
import { PageHero } from "@/components/sections/PageHero";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import Image from "next/image";
import { FileText, Download } from "lucide-react";

export default async function StudyGuidesPage() {
  const items = await db.content.findMany({
    where: {
      kind: "study_guide",
      status: "published",
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  return (
    <>
      <PageHero
        eyebrow="Study Guides"
        title="Build intuition first."
        description="Published study guides from ACOB."
      />

      <Section>
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex flex-col sm:flex-row gap-5 rounded-xl border border-border bg-elevated p-5 transition-all hover:border-white/20"
              >
                {/* Cover Image / Thumbnail */}
                <div className="relative aspect-[3/4] w-full sm:w-32 flex-shrink-0 overflow-hidden rounded-lg bg-black/40 border border-border">
                  {item.coverImageUrl ? (
                    <Image
                      src={item.coverImageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted">
                      <FileText className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="flex flex-col justify-between flex-1">
                  <div className="space-y-1.5">
                    <h2 className="font-display text-lg text-primary line-clamp-1">
                      {item.title}
                    </h2>

                    {item.description ? (
                      <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    ) : null}
                  </div>

                  {/* Action Link */}
                  <div className="pt-4 flex items-center gap-3">
                    {item.fileUrl ? (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium bg-white/5 border border-border px-3 py-1.5 rounded-md"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download PDF
                      </a>
                    ) : item.externalUrl ? (
                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium"
                      >
                        Open guide
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
