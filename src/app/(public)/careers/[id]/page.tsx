import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/sections/PageHero";
import { db } from "@/lib/db/client";
import { Briefcase, Calendar, ArrowLeft, CheckCircle2 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const role = await db.careerListing.findUnique({ where: { id } });
  if (!role) return { title: "Role Not Found" };

  return {
    title: `${role.title} — Careers`,
    description: role.description.slice(0, 160),
    alternates: { canonical: `/careers/${role.id}` },
  };
}

export const revalidate = 60;

export default async function CareerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const role = await db.careerListing.findUnique({ where: { id } });

  if (!role || role.status !== "published") {
    notFound();
  }

  return (
    <>
      <div className="pt-8 pb-4">
        <Container>
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all roles
          </Link>
        </Container>
      </div>

      <PageHero
        eyebrow={role.department || "Open Role"}
        title={role.title}
        description="Review the full role description, expectations, and apply below."
      />

      <Section>
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-8">
              <div className="space-y-4">
                <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
                  About the Role
                </h2>
                <p className="text-secondary text-base leading-relaxed whitespace-pre-line">
                  {role.description}
                </p>
              </div>

              {role.requirements && (
                <div className="space-y-4 pt-6 border-t border-border/60">
                  <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-primary flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Requirements & Expectations
                  </h2>
                  <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line bg-card/40 p-6 rounded-2xl border border-border/80">
                    {role.requirements}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Meta & Application Call */}
            <div className="lg:col-span-4">
              <div className="sticky top-28 space-y-6 rounded-3xl border border-border bg-card/60 p-6 sm:p-8">
                <h3 className="font-display text-xl text-primary">
                  Role Summary
                </h3>

                <div className="space-y-4 border-t border-border/60 pt-4 font-mono text-xs">
                  {role.department && (
                    <div className="flex items-center justify-between py-2 border-b border-border/40">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" /> Department
                      </span>
                      <span className="text-primary uppercase tracking-wider">
                        {role.department}
                      </span>
                    </div>
                  )}

                  {role.deadline && (
                    <div className="flex items-center justify-between py-2 border-b border-border/40">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Deadline
                      </span>
                      <span className="text-secondary">
                        {role.deadline.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    href="/contact"
                    variant="secondary"
                    className="w-full justify-center py-3 text-xs uppercase tracking-wider font-mono"
                  >
                    Apply For This Role
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
