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
      <Container className="pt-14 pb-12 sm:pt-20 sm:pb-16">
        {eyebrow ? (
          <Reveal weight="minor">
            <MetadataLabel className="field-kicker">{eyebrow}</MetadataLabel>
          </Reveal>
        ) : null}
        <Reveal weight="major" order={1}>
          <h1 className="mt-5 max-w-4xl font-display text-4xl leading-[1.06] tracking-tight text-primary sm:text-5xl lg:text-6xl">
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
