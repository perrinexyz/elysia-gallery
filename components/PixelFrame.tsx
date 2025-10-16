"use client";
import { useMemo } from "react";

export default function PixelFrame({
  pngDataURI,
  vm = 220, // vertical margin to leave room for title/bids
  hm = 48,  // horizontal margin
}: { pngDataURI: string; vm?: number; hm?: number }) {

  const doc = useMemo(() => `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  html,body{height:100%;margin:0;display:flex;justify-content:center;align-items:center;background:transparent}
  canvas{image-rendering:pixelated;display:block}
</style></head><body>
<canvas id="c"></canvas>
<script>
const c=document.getElementById("c"),x=c.getContext("2d");
let nw=0,nh=0;
const i=new Image();
i.onload=()=>{nw=i.naturalWidth;nh=i.naturalHeight;c.width=nw;c.height=nh;x.imageSmoothingEnabled=false;x.drawImage(i,0,0,nw,nh);r()};
i.src=${JSON.stringify(pngDataURI)};
function m(){return /Mobi|Android|iPhone|iPod|iPad|Windows Phone|Opera Mini|Silk/i.test(navigator.userAgent)}
let HM=${hm}, VM=${vm};
if(m()){HM=0;VM=0}
function r(){
  const w=innerWidth,h=innerHeight,fx=(w-HM)/nw,fy=(h-VM)/nh;
  const s=(fx<1||fy<1)?Math.min(fx,fy):Math.min(Math.floor(fx),Math.floor(fy));
  c.style.width=Math.max(1,Math.floor(nw*s))+"px";
  c.style.height=Math.max(1,Math.floor(nh*s))+"px";
}
addEventListener("resize",r);
</script></body></html>`, [pngDataURI, vm, hm]);

  return (
    <iframe
      title="onchain-art"
      srcDoc={doc}
      sandbox="allow-scripts"
      className="rounded-xl term-frame"
      style={{ width: "100%", height: "calc(100dvh - 260px)", border: 0, background: "transparent" }}
    />
  );
}
