"use client";
import { useEffect, useRef, useState } from "react";

export default function CodeBackground({ html, isHovering }: { html: string; isHovering: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(12);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [html]);

  // Handle fade in/out
  useEffect(() => {
    if (isHovering) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isHovering]);

  // Calculate font size to fill screen based on content length and viewport
  useEffect(() => {
    if (!isHovering || !html) return;

    function calculateFontSize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const area = w * h;
      const charCount = Math.min(html.length, 15000);
      
      // Estimate characters per line and lines needed
      const charsPerLine = Math.floor(w / 8); // rough estimate
      const linesNeeded = Math.ceil(charCount / charsPerLine);
      
      // Calculate font size to fill viewport height
      let size = Math.floor(h / linesNeeded * 1.4);
      
      // Clamp between reasonable bounds
      size = Math.max(10, Math.min(size, 20));
      
      setFontSize(size);
    }

    calculateFontSize();
    window.addEventListener("resize", calculateFontSize);
    return () => window.removeEventListener("resize", calculateFontSize);
  }, [html, isHovering]);

  if (!html) return null;

  return (
    <div 
      className={`fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-1000 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        background: 'var(--color-bg)',
      }}
    >
      <div
        ref={ref}
        className="absolute inset-0 overflow-hidden"
        style={{
          color: '#2b2b2b',
          fontSize: `${fontSize}px`,
          fontFamily: 'var(--font-ui)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          opacity: 0.85,
          lineHeight: '0.9',
          transform: 'scaleY(1.4)',
          transformOrigin: 'top left',
        }}
      >
        {sanitize(html)}
      </div>
    </div>
  );
}

function sanitize(s: string) {
  // Keep enough content to fill the screen
  return s.slice(0, 15000);
}