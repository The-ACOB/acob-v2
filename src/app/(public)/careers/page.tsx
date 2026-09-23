import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/sections/PageHero";
import { db } from "@/lib/db/client";
import { Briefcase, Calendar, ArrowRight, Sparkles } from "lucide-react";

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
  }[] = await db.careerListing.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "desc" },
  });

  const openRoles = raw.filter(
    (r) => !r.deadline || r.deadline.getTime() >= now.getTime(),
  );

  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Help build the way Bangladesh's students get to think."
        description="ACOB is a small, early team. We're looking for people who care about applied learning as much as we do."
      />

      <Section>
        <Container>
          <div className="mb-10 flex items-center justify-between border-b border-border/80 pb-6">
            <Reveal weight="standard">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <MetadataLabel>
                  Open Positions ({openRoles.length})
                </MetadataLabel>
              </div>
            </Reveal>
          </div>

          {openRoles.length === 0 ? (
            <Reveal weight="minor" order={1} className="mt-8">
              <EmptyState
                title="No open roles right now"
                description="ACOB is a young organization � when a position opens, it will be listed here first."
                action={
                  <Button href="/contact" variant="secondary" className="mt-2">
                    Reach out anyway
                  </Button>
                }
              />
            </Reveal>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {openRoles.map((role, i) => (
                <Reveal key={role.id} weight="standard" order={i + 1}>
                  <Link
                    href={`/careers/${role.id}`}
                    className="group relative block rounded-2xl border border-border/70 bg-card/40 p-8 transition-all duration-300 hover:border-primary/50 hover:bg-card/70 hover:shadow-xl hover:shadow-primary/5"
                  >
                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          {role.department ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-primary">
                              <Briefcase className="h-3.5 w-3.5" />
                              {role.department}
                            </span>
                          ) : null}

                          {role.deadline ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-elevated px-3 py-1 font-mono text-xs text-muted">
                              <Calendar className="h-3.5 w-3.5 text-primary/70" />
                              Apply by{" "}
                              {role.deadline.toLocaleDateString()}
                            </span>
                          ) : null}
                        </div>

                        <h2 className="font-display text-2xl tracking-tight text-primary transition-colors group-hover:text-primary/90 sm:text-3xl">
                          {role.title}
                        </h2>

                        <p className="line-clamp-2 max-w-3xl text-sm leading-relaxed text-secondary">
                          {role.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 border-border/40 pt-4 font-mono text-xs uppercase tracking-widest text-primary md:border-t-0 md:pt-0">
                        <span className="group-hover:underline">View Role</span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-primary group-hover:text-primary-foreground">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
