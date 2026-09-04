import { Container } from "@/components/ui/Container";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex flex-1 items-center">
        <Container className="py-24">
          <MetadataLabel>404</MetadataLabel>
          <h1 className="mt-4 max-w-lg font-display text-4xl leading-[1.05] tracking-tight text-primary sm:text-5xl">
            This page hasn&apos;t been written yet.
          </h1>
          <p className="mt-5 max-w-md text-secondary">
            The page you&apos;re looking for doesn&apos;t exist, or has moved.
          </p>
          <Button href="/" variant="secondary" className="mt-8">
            Back to home
          </Button>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
