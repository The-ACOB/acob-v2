import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { PageHero } from "@/components/sections/PageHero";
import { VerifyForm } from "@/components/sections/VerifyForm";

export const metadata: Metadata = {
  alternates: { canonical: "/verify" },
  title: "Verify a Certificate",
  description: "Verify the authenticity of an ACOB Olympiad certificate.",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <>
      <PageHero
        eyebrow="Certificate verification"
        title="Verify an ACOB certificate."
        description="Enter a certificate ID, or scan the QR code on the certificate, to confirm it was issued by Applied Cognitio Olympiad Bangladesh."
      />

      <Section>
        <Container className="max-w-3xl">
          <Reveal weight="standard">
            <VerifyForm initialToken={token} />
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
