"use client";
import { useEffect, useMemo, useRef, useState } from "react";

export default function PixelImage({ html }: { html: string }) {
  const dataURI = useMemo(() => extractPngDataURI(html), [html]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);

  // load & discover natural dimensions
  useEffect(() => {
    if (!dataURI) { setNat(null); return; }
    const img = new Image();
    img.src = dataURI;
    img.onload = () => setNat({ w: img.naturalWidth, h: img.naturalHeight });
    return () => setNat(null);
  }, [dataURI]);

  // draw once at native pixels
  useEffect(() => {
    if (!dataURI || !nat || !canvasRef.current) return;
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const img = new Image();
    c.width = nat.w;
    c.height = nat.h;
    img.onload = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, nat.w, nat.h);
      scaleToViewport();
    };
    img.src = dataURI;

    function scaleToViewport() {
      if (!nat) return;
      
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Detect mobile
      const isMobile = w <= 768;
      
      // Adjust margins for mobile vs desktop
      // Much larger vertical margin to account for nav, spacing, title, footer, and padding
      const hm = isMobile ? 32 : 48;
      const vm = isMobile ? 220 : 380; // Increased significantly to prevent overflow

      const fx = (w - hm) / nat.w;
      const fy = (h - vm) / nat.h;

      const s = (fx < 1 || fy < 1) ? Math.min(fx, fy) : Math.min(Math.floor(fx), Math.floor(fy));
      const cssW = Math.max(1, Math.floor(nat.w * s));
      const cssH = Math.max(1, Math.floor(nat.h * s));

      c.style.width = `${cssW}px`;
      c.style.height = `${cssH}px`;
    }

    window.addEventListener("resize", scaleToViewport);
    return () => window.removeEventListener("resize", scaleToViewport);
  }, [dataURI, nat]);

  if (!dataURI) return <div className="text-xs text-ink/60">Loading on-chain image…</div>;

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl pixel inline-block"
      style={{
        maxWidth: "100%",
        height: "auto",
        display: "block"
      }}
    />
  );
}

export function extractPngDataURI(text: string): string | null {
  const m = text.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/);
  return m ? m[0] : null;
}