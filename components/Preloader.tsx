"use client";
import { useEffect, useState } from "react";

export default function Preloader() {
  const [loaded, setLoaded] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Wait for exactly 2 breath cycles (3s each = 6s total) before starting fade out
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Complete fade out after transition
      setTimeout(() => setLoaded(true), 800);
    }, 4500); // 6s breathing + 0.8s fade = 6.8s total

    return () => clearTimeout(timer);
  }, []);

  if (loaded) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: "var(--color-bg)",
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      <div 
        className="text-center text-xs tracking-wide leading-relaxed breathe"
        style={{
          color: 'var(--color-ink)',
        }}
      >
        Elysia
        <br />
        perrine
        <br />
        2025
      </div>
      
      {/* Progress bar */}
      <div 
        className="mt-4"
        style={{ 
          width: '100px', 
          height: '1px', 
          background: 'rgba(176, 196, 222, 0.2)',
          overflow: 'hidden'
        }}
      >
        <div 
          style={{ 
            height: '100%',
            background: 'var(--color-ink)',
            animation: 'progressBar 4.5s linear forwards'
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}