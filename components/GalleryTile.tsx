"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fetchTokenBody, parseTokenFields } from "@/lib/eth";
import { extractPngDataURI } from "@/components/PixelImage";
import { useLiveBids } from "@/lib/manifold";

const MAX_CONCURRENCY = 6;
let inFlight = 0;
const queue: Array<() => void> = [];
function schedule(fn: () => void) { inFlight < MAX_CONCURRENCY ? (inFlight++, fn()) : queue.push(fn); }
function done() { inFlight--; const n = queue.shift(); if (n) { inFlight++; n(); } }

export default function GalleryTile({
  id,
  onHover,
  onSelect,              // NEW: to trigger the animation + navigate
  className = "",
  style,
}: {
  id: number;
  onHover?: (id: number, body: string) => void;
  onSelect?: (id: number) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [png, setPng] = useState("");
  const [body, setBody] = useState("");
  const { highest } = useLiveBids(id);

  useEffect(() => {
    let alive = true;
    schedule(async () => {
      try {
        const text = await fetchTokenBody(id);
        if (!alive) return;
        setBody(text ?? "");
        const f = parseTokenFields(text ?? "");
        setPng(f.imageDataUri || extractPngDataURI(text ?? "") || "");
      } finally { done(); }
    });
    return () => { alive = false; };
  }, [id]);

  // flash up/down when top bid changes
  const [flash, setFlash] = useState<"up"|"down"|null>(null);
  const prev = useRef<number | null>(null);
  useEffect(() => {
    if (!highest) return;
    const cur = parseFloat(highest.value);
    if (prev.current !== null && cur !== prev.current) {
      setFlash(cur > prev.current ? "up" : "down");
      const t = setTimeout(() => setFlash(null), 3000);
      return () => clearTimeout(t);
    }
    prev.current = cur;
  }, [highest?.value]);

  const handleEnter = () => onHover?.(id, body || "");
  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (onSelect && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <li className={`group relative ${className}`} style={style}>
      <Link href={`/art/${id}`} onMouseEnter={handleEnter} onClick={handleClick}>
        <div className="relative term-frame overflow-hidden">
          {png ? (
            <img
              src={png}
              alt={`Token ${id}`}
              className="pixel block w-full h-auto"
              style={{ aspectRatio: "490 / 796" }}
              loading="lazy" decoding="async" fetchPriority="low"
            />
          ) : (
            <div className="h-[160px] flex items-center justify-center text-[10px] text-ink/50">Loading…</div>
          )}

{flash && (
  <div
    className={`absolute inset-0 pointer-events-none rounded-xl border-2 ${
      flash === "up" ? "border-green-500" : "border-red-500"
    }`}
    style={{
      animation: 'simpleFlash 3s linear forwards'
    }}
  />
)}
        </div>
        <div className="absolute inset-x-2 bottom-2 text-[10px] text-ink/60 opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0">
          Token #{id}
        </div>
      </Link>
    </li>
  );
}
