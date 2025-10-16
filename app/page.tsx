"use client";
import { useMemo, useState } from "react";
import Container from "@/components/Container";
import CodeBackground from "@/components/CodeBackground";
import GalleryTile from "@/components/GalleryTile";
import { fetchTokenBody, CONTRACT_INFO } from "@/lib/eth";
import { useRouter } from "next/navigation";

const TOTAL_SUPPLY = 21;

export default function HomePage() {
  const [htmlSrc, setHtmlSrc] = useState<string>("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();

  async function handleHover(id: number, maybeBody: string) {
    const body = maybeBody || (await fetchTokenBody(id)) || "";
    setHtmlSrc(body);
    setIsHovering(true);
  }

  function handleHoverEnd() {
    setIsHovering(false);
  }

  function handleSelect(id: number) {
    // Turn off code background immediately
    setIsHovering(false);
    // trigger the grey+shrink visual, then navigate
    setSelectedId(id);
    setTimeout(() => router.push(`/art/${id}`), 650);
  }

  const tokens = useMemo(
    () => Array.from({ length: TOTAL_SUPPLY }, (_, i) => i + 1),
    []
  );

  return (
    <div className="relative">
      <CodeBackground html={htmlSrc} isHovering={isHovering} />
      
      <Container className="pt-6 pb-16 relative z-10">
        <header id="home-header" className="mt-4 mb-6">
          <h1 className="mb-0.5 text-sm tracking-tight text-ink/80">Elysia</h1>
          <p className="text-xs text-ink/50 font-mono">
            {CONTRACT_INFO.address}
          </p>
        </header>

        {/* Same responsive grid, but 7-up on very wide desktop */}
        <ul
          className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7 gap-3 ${
            selectedId ? "greyed" : ""
          }`}
          onMouseLeave={handleHoverEnd}
        >
          {tokens.map((id) => (
            <GalleryTile
              key={id}
              id={id}
              onHover={handleHover}
              onSelect={handleSelect}
              className={`tile ${selectedId === id ? "selected flash-border" : ""}`}
            />
          ))}
        </ul>

        {/* Artist statement */}
        <div className="mt-12 max-w-2xl">
          <p className="text-xs text-ink/70 leading-snug">
            [A visual art series created with systems and graphic software. 
            It leans on custom dithering techniques and fine-tuned color manipulations.]
          </p>
          <br></br>
          <p className="text-xs text-ink/70 mt-2">
            [Elysia is an exploration of overtly digital compositions. 
            After countless iterations, each work was optimized (meticulously) to store on chain as html that scales only in pixel-perfect intervals, in order the retain the artistic quality.]
          </p>
        </div>
      </Container>
    </div>
  );
}