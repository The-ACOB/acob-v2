import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { PageHero } from "@/components/sections/PageHero";
import { ContactForm } from "@/components/sections/ContactForm";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact",
  description: "Get in touch with Applied Cognitio Olympiad Bangladesh.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in touch."
        description="Questions about an Olympiad, the ambassador program, media, or careers — this reaches ACOB directly."
      />

      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <Reveal weight="standard">
              <MetadataLabel>Direct</MetadataLabel>
              <div className="mt-6 flex flex-col gap-5 text-sm text-secondary">
                <div>
                  <p className="text-muted">Email</p>
                  <p className="mt-1 text-primary">hello@theacob.com</p>
                </div>
                <div>
                  <p className="text-muted">Based in</p>
                  <p className="mt-1 text-primary">Dhaka, Bangladesh</p>
                </div>
              </div>
            </Reveal>

            <Reveal weight="standard" order={1}>
              <ContactForm />
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  );
}
