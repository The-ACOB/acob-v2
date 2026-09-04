import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { MetadataLabel } from "@/components/ui/MetadataLabel";

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="relative border-b border-border">
      <Container className="pt-16 pb-14 sm:pt-24 sm:pb-16">
        <Reveal weight="minor">
          <MetadataLabel>{eyebrow}</MetadataLabel>
        </Reveal>
        <Reveal weight="major" order={1}>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] tracking-tight text-primary sm:text-5xl lg:text-6xl">
            {title}
          </h1>
        </Reveal>
        {description ? (
          <Reveal weight="standard" order={2}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-secondary">
              {description}
            </p>
          </Reveal>
        ) : null}
      </Container>
    </section>
  );
}
