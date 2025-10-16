"use client";
export default function HtmlFrame({
  html,
  height = "calc(100dvh - 280px)",
  bg = "var(--color-bg)",
}: { html: string; height?: string; bg?: string }) {
  // Override centering styles in the embedded HTML
  const modifiedHtml = html.replace(
    'justify-content:center;align-items:center',
    'justify-content:flex-start;align-items:flex-start;padding:0'
  );

  return (
<iframe
  title="onchain-html"
  srcDoc={modifiedHtml}
  sandbox="allow-scripts allow-popups-by-user-activation"
  className="w-full rounded-xl block mb-0"
  style={{
    aspectRatio: '490/796',  // Add this to maintain the artwork's ratio
    width: '100%',
    maxWidth: '490px',  // Native width
    height: 'auto',
    border: 0,
    background: bg,
    display: "block",
    marginBottom: 0
  }}
/>
  );
}