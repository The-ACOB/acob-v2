import { getSiteUrl } from "@/lib/env";

export function OrganizationJsonLd() {
  const siteUrl = getSiteUrl();

  const data = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Applied Cognitio Olympiad Bangladesh",
    alternateName: "ACOB",
    url: siteUrl,
    logo: `${siteUrl}/assets/logo.png`,
    foundingDate: "2025",
    description:
      "Applied Cognitio Olympiad Bangladesh champions curiosity over memorisation through academic Olympiads and learning experiences that reward reasoning and understanding.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "BD",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
