"use client";
import { useEffect, useState } from "react";
import { useLiveBids } from "@/lib/manifold";


export default function LiveBids({ tokenId }: { tokenId: number }) {
const { events, status, highest } = useLiveBids(tokenId);
const [collapsed, setCollapsed] = useState(false);


return (
<div>
<div className="flex items-center justify-between mb-2">
<h3 className="text-sm tracking-tight">Live bids</h3>
<button className="text-xs text-ink/60 hover:text-ink" onClick={() => setCollapsed((v) => !v)}>{collapsed ? "Show" : "Hide"}</button>
</div>
{!collapsed && (
<div>
<p className="text-xs mb-2 text-ink/70">Status: {status}</p>
{highest && (
<div className="mb-3 p-2 rounded bg-accent/10">
<div className="text-xs">Current bid</div>
<div className="text-lg">{highest.value} ETH</div>
<div className="text-[10px] text-ink/60">by {short(highest.bidder)}</div>
</div>
)}
<ul className="space-y-2 text-xs">
{events.map((e,i) => (
<li key={i} className="flex items-start gap-2">
<span className="mt-1 size-1.5 rounded-full bg-accent/50"/>
<div>
<div className="font-medium">Bid {e.value} ETH</div>
<div className="text-ink/60">{short(e.bidder)} · {new Date(e.time).toLocaleTimeString()}</div>
</div>
</li>
))}
</ul>
</div>
)}
</div>
);
}


function short(a?: string) { return a ? `${a.slice(0,6)}…${a.slice(-4)}` : "—"; }
