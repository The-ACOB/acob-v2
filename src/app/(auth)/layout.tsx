import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border py-6">
        <Container>
          <Logo priority />
        </Container>
      </header>
      <main className="flex flex-1 items-center justify-center py-16">
        <Container className="max-w-md">{children}</Container>
      </main>
    </div>
  );
}
