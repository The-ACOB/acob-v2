import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/sections/PageHero";
import { db } from "@/lib/db/client";

export const metadata: Metadata = {
  alternates: { canonical: "/careers" },
  title: "Careers",
  description: "Open roles at Applied Cognitio Olympiad Bangladesh.",
};

export const revalidate = 60;

export default async function CareersPage() {
  const now = new Date();
  const raw: {
    id: string;
    title: string;
    department: string | null;
    description: string;
    requirements: string | null;
    deadline: Date | null;
  }[] = await db.careerListing.findMany({ where: { status: "published" }, orderBy: { createdAt: "desc" } });

  // A published listing "automatically reflects" only while its deadline (if any) hasn't passed.
  const openRoles = raw.filter((r) => !r.deadline || r.deadline.getTime() >= now.getTime());

  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Help build the way Bangladesh's students get to think."
        description="ACOB is a small, early team. We're looking for people who care about applied learning as much as we do."
      />

      <Section>
        <Container>
          <Reveal weight="standard">
            <MetadataLabel>Open roles</MetadataLabel>
          </Reveal>

          {openRoles.length === 0 ? (
            <Reveal weight="minor" order={1} className="mt-8">
              <EmptyState
                title="No open roles right now"
                description="ACOB is a young organization — when a position opens, it will be listed here first."
                action={
                  <Button href="/contact" variant="secondary" className="mt-2">
                    Reach out anyway
                  </Button>
                }
              />
            </Reveal>
          ) : (
            <div className="mt-8 flex flex-col divide-y divide-border border-t border-border">
              {openRoles.map((role, i) => (
                <Reveal key={role.id} weight="standard" order={i + 1}>
                  <div className="flex flex-col gap-2 py-8">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h2 className="font-display text-2xl text-primary">{role.title}</h2>
                      {role.department ? (
                        <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{role.department}</span>
                      ) : null}
                    </div>
                    <p className="max-w-2xl text-sm leading-relaxed text-secondary">{role.description}</p>
                    {role.requirements ? (
                      <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted">{role.requirements}</p>
                    ) : null}
                    {role.deadline ? (
                      <p className="mt-2 font-mono text-xs text-muted">Apply by {role.deadline.toLocaleDateString()}</p>
                    ) : null}
                    <Button href="/contact" variant="secondary" className="mt-4 w-fit text-xs">
                      Apply
                    </Button>
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
