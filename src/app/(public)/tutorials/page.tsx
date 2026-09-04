import { db } from "@/lib/db/client";
import { PageHero } from "@/components/sections/PageHero";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export default async function TutorialsPage() {
  const items = await db.content.findMany({
    where: { kind: "video_tutorial", status: "published" },
    orderBy: { publishedAt: "desc" },
  });
  return (
    <>
      <PageHero
        eyebrow="Video Tutorials"
        title="See the reasoning in motion."
        description="Published tutorials from ACOB."
      />
      <Section>
        <Container>
          <div className="flex flex-col divide-y divide-border border-t border-border">
            {items.map((item) => (
              <article key={item.id} className="py-6">
                <h2 className="font-display text-2xl text-primary">
                  {item.title}
                </h2>
                {item.description ? (
                  <p className="mt-2 text-sm text-secondary">
                    {item.description}
                  </p>
                ) : null}
                {item.externalUrl ? (
                  <a
                    href={item.externalUrl}
                    className="mt-3 inline-block text-sm text-accent underline"
                  >
                    Watch tutorial
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
