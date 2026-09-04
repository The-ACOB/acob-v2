/**
 * Fixed, decorative atmospheric layer sitting behind all page content —
 * two very soft radial glows plus a barely-there grain texture, giving
 * the whole site the same restrained ambient lighting as the hero,
 * rather than confining that mood to a single page.
 *
 * Purely visual: aria-hidden, pointer-events-none, and z-indexed below
 * everything so it never interferes with layout or interaction.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-[20%] left-1/2 h-[900px] w-[1400px] -translate-x-1/2 opacity-[0.5]"
        style={{
          background:
            "radial-gradient(closest-side, var(--color-glow), transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[-30%] left-[-10%] h-[700px] w-[900px] opacity-[0.35]"
        style={{
          background: "radial-gradient(closest-side, var(--color-glow), transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[10%] right-[-15%] h-[600px] w-[800px] opacity-[0.25]"
        style={{
          background: "radial-gradient(closest-side, var(--color-glow), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
