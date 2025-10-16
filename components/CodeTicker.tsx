"use client";
import { useEffect, useRef } from "react";
import Container from "@/components/Container";

export default function CodeTicker({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollLeft = 0; }, [html]);

  return (
    <div className="fixed left-0 right-0 bottom-0 z-30">
      <Container className="pb-3">
        <div
          ref={ref}
          className="code-ticker term-frame overflow-x-auto whitespace-pre text-[10px] leading-4 p-3 selection:bg-accent/30 selection:text-white/90"
        >
          <pre className="min-w-full text-ink/70">{html ? sanitize(html) : ""}</pre>
        </div>
      </Container>
    </div>
  );
}

function sanitize(s: string) {
  return s.replace(/\s+/g, " ").slice(0, 8000);
}
