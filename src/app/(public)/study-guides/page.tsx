import { db } from "@/lib/db/client";
import { PageHero } from "@/components/sections/PageHero";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export default async function StudyGuidesPage() {
  const items = await db.content.findMany({
    where: { kind: "study_guide", status: "published" },
    orderBy: { publishedAt: "desc" },
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
                    Open guide
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
