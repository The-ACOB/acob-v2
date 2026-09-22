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
          <div className="flex items-center justify-between border-b border-border/80 pb-6 mb-10">
            <Reveal weight="standard">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-primary" />
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
                description="ACOB is a young organization — when a position opens, it will be listed here first."
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      {/* Left: Role Info Snippet */}
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          {role.department ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-primary border border-primary/20">
                              <Briefcase className="w-3.5 h-3.5" />
                              {role.department}
                            </span>
                          ) : null}

                          {role.deadline ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 font-mono text-xs text-muted-foreground border border-border">
                              <Calendar className="w-3.5 h-3.5 text-primary/70" />
                              Apply by {role.deadline.toLocaleDateString()}
                            </span>
                          ) : null}
                        </div>

                        <h2 className="font-display text-2xl sm:text-3xl text-primary tracking-tight group-hover:text-primary/90 transition-colors">
                          {role.title}
                        </h2>

                        <p className="max-w-3xl text-sm leading-relaxed text-secondary line-clamp-2">
                          {role.description}
                        </p>
                      </div>

                      {/* Right: Action Indicator */}
                      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary pt-4 md:pt-0 border-t md:border-t-0 border-border/40">
                        <span className="group-hover:underline">View Role</span>
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-primary group-hover:text-primary-foreground">
                          <ArrowRight className="w-4 h-4" />
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
