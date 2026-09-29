"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

export function MathText({ text, className = "" }: { text?: string | null; className?: string }) {
  const value = text ?? "";
  const parts = value.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;
        const display = part.startsWith("$$") && part.endsWith("$$");
        const inline = part.startsWith("$") && part.endsWith("$");
        if (!display && !inline) return <span key={index}>{part}</span>;
        const source = display ? part.slice(2, -2) : part.slice(1, -1);
        const html = katex.renderToString(source, { throwOnError: false, displayMode: display, trust: false });
        return <span key={index} className={display ? "block my-2" : ""} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </span>
  );
}
