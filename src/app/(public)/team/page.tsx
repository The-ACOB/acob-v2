import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/sections/PageHero";
import { db } from "@/lib/db/client";

export const metadata: Metadata = {
  alternates: { canonical: "/team" },
  title: "Our Team",
  description:
    "Meet the people building Applied Cognitio Olympiad Bangladesh around curiosity, reasoning, and applied learning.",
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default async function TeamPage() {
  const members = await db.organisationTeamMember.findMany({
    where: { active: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <>
      <PageHero
        eyebrow=""
        title="Our Team"
        description="Applied Cognitio Olympiad Bangladesh is built by people who care about what happens after a student finds the answer, the question, the reasoning, and the understanding that follows."
      />
      <Section bordered className="pt-12 sm:pt-14 lg:pt-16">
        <Container>
          {members.length === 0 ? (
            <Reveal weight="minor" order={1} className="mt-12">
              <EmptyState
                title="The organisation team is coming soon"
                description="ACOB's organisation team will appear here as members are published."
              />
            </Reveal>
          ) : (
            <div className="mt-0 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
              {members.map((member, index) => (
                <Reveal
                  key={member.id}
                  weight="standard"
                  order={index + 1}
                  className="h-full"
                >
                  <article className="group relative flex h-full flex-col items-center rounded-xl border border-border bg-elevated/50 p-6 text-center transition-all duration-300 hover:border-accent/40 hover:bg-elevated">
                    {/* Compact Circle Avatar Frame */}
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-elevated-2 shadow-inner flex items-center justify-center">
                      {member.imageUrl ? (
                        <Image
                          src={member.imageUrl}
                          alt={member.name}
                          fill
                          sizes="96px"
                          unoptimized
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span className="font-display text-base font-semibold text-muted select-none">
                          {initials(member.name)}
                        </span>
                      )}
                    </div>

                    {/* Member Information */}
                    <h3 className="mt-4 font-display text-lg font-semibold text-primary">
                      {member.name}
                    </h3>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                      {member.title}
                    </p>

                    {member.bio && (
                      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-secondary">
                        {member.bio}
                      </p>
                    )}

                    {/* Social Links */}
                    {(member.linkedinUrl || member.websiteUrl) && (
                      <div className="mt-auto flex w-full items-center justify-center gap-4 border-t border-border/40 pt-4 text-xs pt-5">
                        {member.linkedinUrl && (
                          <a
                            href={member.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-secondary transition-colors hover:text-primary"
                          >
                            LinkedIn
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        )}
                        {member.websiteUrl && (
                          <a
                            href={member.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-secondary transition-colors hover:text-primary"
                          >
                            Website
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
