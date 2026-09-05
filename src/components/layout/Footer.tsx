// import { Logo } from "@/components/brand/Logo";
// import { Container } from "@/components/ui/Container";
// import { TextLink } from "@/components/ui/TextLink";
// import { NAV_LINKS } from "./nav-links";

// const SOCIALS = [
//   { label: "Facebook", href: "https://www.facebook.com/appliedcognitiobd" },
//   { label: "LinkedIn", href: "http://linkedin.com/company/appliedcognitiobd" },
//   { label: "YouTube", href: "https://www.youtube.com/@appliedcognitiobd" },
// ];

// export function Footer() {
//   const year = new Date().getFullYear();

//   return (
//     <footer className="border-t border-border bg-background">
//       <Container className="py-16 sm:py-20">
//         <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_1fr_1fr]">
//           <div className="flex flex-col gap-5">
//             <Logo href="/" />
//             <p className="max-w-sm text-sm leading-relaxed text-secondary">
//               Applied Cognitio Olympiad Bangladesh exists to close the gap
//               between knowing an answer and understanding it — cultivating
//               students who ask better questions.
//             </p>
//           </div>

//           <nav aria-label="Footer" className="flex flex-col gap-3">
//             <span className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
//               Navigate
//             </span>
//             {NAV_LINKS.map((link) => (
//               <TextLink
//                 key={link.href}
//                 href={link.href}
//                 className="w-fit text-sm"
//               >
//                 {link.label}
//               </TextLink>
//             ))}
//             <TextLink href="/careers" className="w-fit text-sm">
//               Careers
//             </TextLink>
//             <TextLink href="/verify" className="w-fit text-sm">
//               Certificate Verification
//             </TextLink>
//           </nav>

//           <div className="flex flex-col gap-3">
//             <span className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
//               Connect
//             </span>
//             {SOCIALS.map((s) => (
//               <TextLink key={s.label} href={s.href} className="w-fit text-sm">
//                 {s.label}
//               </TextLink>
//             ))}
//           </div>
//         </div>

//         <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
//           <p>
//             © 2025-{year} Applied Cognitio Olympiad Bangladesh. All rights
//             reserved.
//             <br></br>Technology Partner <b>Glitched Tech</b>
//           </p>
//           <p className="font-mono uppercase tracking-[0.14em]">
//             Founded 2025 · Dhaka, Bangladesh
//           </p>
//         </div>
//       </Container>
//     </footer>
//   );
// }

import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { TextLink } from "@/components/ui/TextLink";
import { NAV_LINKS } from "./nav-links";

const SOCIALS = [
  { label: "Facebook", href: "https://www.facebook.com/appliedcognitiobd" },
  { label: "LinkedIn", href: "http://linkedin.com/company/appliedcognitiobd" },
  { label: "YouTube", href: "https://www.youtube.com/@appliedcognitiobd" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <Container className="py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div className="flex flex-col gap-5">
            <Logo href="/" src="/assets/footer.png" />
            <p className="max-w-sm text-sm leading-relaxed text-secondary">
              We exist to close the gap between knowing an answer and
              understanding it — cultivating students who ask better questions.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-3">
            <span className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              Navigate
            </span>
            {NAV_LINKS.map((link) => (
              <TextLink
                key={link.href}
                href={link.href}
                className="w-fit text-sm"
              >
                {link.label}
              </TextLink>
            ))}
            <TextLink href="/careers" className="w-fit text-sm">
              Careers
            </TextLink>
            <TextLink href="/verify" className="w-fit text-sm">
              Certificate Verification
            </TextLink>
          </nav>

          <div className="flex flex-col gap-3">
            <span className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              Connect
            </span>
            {SOCIALS.map((s) => (
              <TextLink key={s.label} href={s.href} className="w-fit text-sm">
                {s.label}
              </TextLink>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2025-{year} Applied Cognitio Olympiad Bangladesh. All rights
            reserved.
            <br></br>Technology Partner <b>Glitched Tech</b>
          </p>
          <p className="font-mono uppercase tracking-[0.14em]">
            Founded 2025 · Dhaka, Bangladesh
          </p>
        </div>
      </Container>
    </footer>
  );
}
