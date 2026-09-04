import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/sections/PageHero";
import { TEAM_MEMBERS } from "@/lib/team/members";

export const metadata: Metadata = {
  alternates: { canonical: "/team" },
  title: "Our Team",
  description:
    "Meet the people building Applied Cognitio Olympiad Bangladesh around curiosity, reasoning, and applied learning.",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function TeamPage() {
  return (
    <>
      <PageHero
        eyebrow="The people behind ACOB"
        title="Our Team"
        description="Applied Cognitio Olympiad Bangladesh is built by people who care about what happens after a student finds the answer: the question, the reasoning, and the understanding that follows."
      />
      <Section bordered>
        <Container>
          <Reveal weight="standard">
            <MetadataLabel>People &amp; perspective</MetadataLabel>
            <h2 className="mt-4 max-w-2xl font-display text-3xl leading-[1.1] tracking-tight text-primary sm:text-4xl">
              A small team with a large curiosity about how people learn.
            </h2>
          </Reveal>
          {TEAM_MEMBERS.length === 0 ? (
            <Reveal weight="minor" order={1} className="mt-12">
              <EmptyState
                title="The team directory is being assembled"
                description="Approved team profiles will appear here as the ACOB team directory takes shape."
              />
            </Reveal>
          ) : (
            <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TEAM_MEMBERS.map((member, index) => (
                <Reveal
                  key={`${member.name}-${member.role}`}
                  weight="standard"
                  order={index + 1}
                >
                  <article className="group overflow-hidden rounded-lg border border-border bg-elevated transition-transform duration-300 motion-safe:hover:-translate-y-1">
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-border bg-elevated-2">
                      {member.image ? (
                        <Image
                          src={member.image}
                          alt={member.name}
                          fill
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                          className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="font-display text-5xl text-muted"
                        >
                          {initials(member.name)}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-2xl text-primary">
                        {member.name}
                      </h3>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                        {member.role}
                      </p>
                      {member.bio ? (
                        <p className="mt-4 text-sm leading-relaxed text-secondary">
                          {member.bio}
                        </p>
                      ) : null}
                      {member.links?.length ? (
                        <div className="mt-5 flex flex-wrap gap-4">
                          {member.links.map((link) => (
                            <a
                              key={link.href}
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-secondary transition-colors hover:text-primary"
                            >
                              {link.label}
                              <ArrowUpRight className="h-3 w-3" />
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
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
