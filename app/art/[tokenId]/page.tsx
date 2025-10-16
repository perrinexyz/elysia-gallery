"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import HtmlFrame from "@/components/HtmlFrame";
import PixelImage, { extractPngDataURI } from "@/components/PixelImage";
import { fetchTokenBody, parseTokenFields, extractTitle, fetchTokenOwner } from "@/lib/eth";
import { useLiveBids } from "@/lib/manifold";
import { getListingIdForToken } from "@/lib/manifold-blockchain";
import Container from "@/components/Container";

import { useRouter } from "next/navigation";
const TOTAL_SUPPLY = 21;

// FIXED: This is the Manifold auction contract address - NFTs held here are "AVAILABLE"
const MANIFOLD_AUCTION_CONTRACT = "0x3a3548e060be10c2614d0a4cb0c03cc9093fd799";

// Auction end time - All auctions end at 1:00pm PST on 10/19/2025
const AUCTION_END_TIME = new Date("2025-10-19T21:00:00Z").getTime(); // 1:00pm PST = 9:00pm UTC

const AUCTION_END_TIMES: Record<number, number> = {
  1: AUCTION_END_TIME,
  2: AUCTION_END_TIME,
  3: AUCTION_END_TIME,
  4: AUCTION_END_TIME,
  5: AUCTION_END_TIME,
  6: AUCTION_END_TIME,
  7: AUCTION_END_TIME,
  8: AUCTION_END_TIME,
  9: AUCTION_END_TIME,
  10: AUCTION_END_TIME,
  11: AUCTION_END_TIME,
  12: AUCTION_END_TIME,
  13: AUCTION_END_TIME,
  14: AUCTION_END_TIME,
  15: AUCTION_END_TIME,
  16: AUCTION_END_TIME,
  17: AUCTION_END_TIME,
  18: AUCTION_END_TIME,
  19: AUCTION_END_TIME,
  20: AUCTION_END_TIME,
  21: AUCTION_END_TIME,
};

export default function ArtPage() {
  const params = useParams<{ tokenId: string }>();
  const tokenId = Number(params.tokenId);
  const router = useRouter();
  const [body, setBody] = useState("");
  const [title, setTitle] = useState(`Token ${tokenId}`);
  const [description, setDescription] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const listingId = getListingIdForToken(tokenId);
  const auctionEndTime = AUCTION_END_TIMES[tokenId];

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, [tokenId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
      if (e.key === "ArrowLeft") {
        const prev = tokenId === 1 ? TOTAL_SUPPLY : tokenId - 1;
        router.push(`/art/${prev}`);
      }
      if (e.key === "ArrowRight") {
        const next = tokenId === TOTAL_SUPPLY ? 1 : tokenId + 1;
        router.push(`/art/${next}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, tokenId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const text = await fetchTokenBody(tokenId);
      if (!alive) return;
      setBody(text ?? "");
      
      try {
        const json = JSON.parse(text ?? "");
        if (json.name) setTitle(json.name);
        if (json.description) setDescription(json.description);
      } catch {
        const name = extractTitle(text ?? "");
        if (name) setTitle(name);
      }
      
      // FIXED: Fetch actual owner from blockchain
      try {
        const owner = await fetchTokenOwner(tokenId);
        console.log(`🏠 Token ${tokenId} owner:`, owner);
        console.log(`🏠 Manifold contract:`, MANIFOLD_AUCTION_CONTRACT);
        console.log(`🏠 Addresses match?`, owner?.toLowerCase() === MANIFOLD_AUCTION_CONTRACT.toLowerCase());
        if (!alive) return;
        
        // Set owner (will be null if blockchain call failed)
        setOwnerAddress(owner);
      } catch (error) {
        console.error(`❌ Failed to fetch owner for token ${tokenId}:`, error);
        // Set to null on error so we show "Loading..." instead of wrong address
        setOwnerAddress(null);
      }
    })();
    return () => { alive = false; };
  }, [tokenId]);

  // Countdown timer
  useEffect(() => {
    if (!auctionEndTime) return;

    const updateCountdown = () => {
      const now = Date.now();
      const diff = auctionEndTime - now;

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [auctionEndTime]);

  const fields = useMemo(() => parseTokenFields(body), [body]);
  const png = useMemo(() => fields.imageDataUri || extractPngDataURI(body), [fields, body]);
  const { events, highest, status } = useLiveBids(tokenId);

  // Sort by value (highest first) and limit to 5 most recent
  const sortedBids = useMemo(() => {
    const sorted = [...events].sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
    return sorted.slice(0, 5);
  }, [events]);

  // FIXED: Determine collector status - compare against Manifold auction contract
  const collectorStatus = useMemo(() => {
    if (!ownerAddress) {
      return { text: "Loading...", color: "text-ink/60" };
    }

    const hasBids = sortedBids.length > 0;
    const isManifoldOwned = ownerAddress.toLowerCase() === MANIFOLD_AUCTION_CONTRACT.toLowerCase();

    if (isManifoldOwned && !hasBids) {
      return { text: "AVAILABLE", color: "text-[#356b18]" };
    } else if (isManifoldOwned && hasBids) {
      return { text: "AUCTION IN PROGRESS", color: "text-[#2f818f]" };
    } else {
      return { text: short(ownerAddress), color: "text-ink/60" };
    }
  }, [sortedBids, ownerAddress]);

  return (
    <Container className={`pt-6 pb-6 ${fadeIn ? 'fade-in' : 'opacity-0'}`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6 mt-4">
        {/* Left side: Artwork section */}
        <div className="lg:flex-1 lg:max-w-[600px]">
          {/* Title and token number stacked - larger */}
          <h2 className="mb-0.5 text-sm tracking-tight text-ink/80">{fields.name ?? title}</h2>
          <div className="mb-6 text-xs text-ink/50">Token #{tokenId}</div>

          {/* Artwork - direct rendering, no spacing wrapper */}
          {fields.animationHtml ? (
            <HtmlFrame html={fields.animationHtml} bg="var(--color-bg)" height="calc(100dvh - 280px)" />
          ) : png ? (
            <PixelImage html={png} />
          ) : (
            <div className="text-xs text-ink/60">Loading…</div>
          )}

          {/* Bids on mobile - directly below artwork */}
          <div className="lg:hidden mt-4">
            <h3 className="text-[10px] uppercase tracking-wider text-ink/50 mb-4 font-medium">
              LIVE BIDS
            </h3>
            
            {sortedBids.length > 0 ? (
              <div className="space-y-4">
                {sortedBids.map((bid, i) => {
                  const isHighest = i === 0;
                  return (
                    <div 
                      key={i} 
                      className={`border-l-2 pl-3 ${
                        isHighest 
                          ? 'border-accent opacity-100' 
                          : 'border-ink/20 opacity-70'
                      }`}
                    >
                      <div className={`${isHighest ? 'text-base font-medium' : 'text-sm'} mb-1`}>
                        {bid.value} ETH
                      </div>
                      <div className="text-[10px] text-ink/50 mb-0.5">
                        {short(bid.bidder)}
                      </div>
                      <div className="text-[9px] text-ink/40">
                        {new Date(bid.time).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-ink/50">
                <div className="text-[10px] text-ink/40 mb-2">({status})</div>
                <div>waiting for bids…</div>
              </div>
            )}

            {/* Collector status - mobile */}
            <div className="mt-6">
              <div className="text-[10px] text-ink/50 mb-1">Collector:</div>
              <div className={`text-sm font-medium ${collectorStatus.color}`}>
                {collectorStatus.text}
              </div>
            </div>

            {/* Listing link - mobile */}
            {listingId && (
              <div className="mt-4">
                <a 
                  href={`https://manifold.xyz/@perrinexyz/id/${listingId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent hover:text-accent/80 transition"
                >
                  Listing ↗
                </a>
              </div>
            )}

            {/* Countdown - mobile */}
            {timeRemaining && (
              <div className="mt-4 font-mono text-xs text-ink/70">
                {timeRemaining.days}d {String(timeRemaining.hours).padStart(2, '0')}h {String(timeRemaining.minutes).padStart(2, '0')}m {String(timeRemaining.seconds).padStart(2, '0')}s
              </div>
            )}
          </div>
        </div>

        {/* Right side: Bids column - desktop only */}
        <div className="hidden lg:block lg:w-48 lg:flex-shrink-0 lg:pt-[12rem]">
          <div className="lg:sticky lg:top-24">
            <h3 className="text-[10px] uppercase tracking-wider text-ink/50 mb-4 font-medium">
              LIVE BIDS
            </h3>
            
            {sortedBids.length > 0 ? (
              <div className="space-y-4">
                {sortedBids.map((bid, i) => {
                  const isHighest = i === 0;
                  return (
                    <div 
                      key={i} 
                      className={`border-l-2 pl-3 ${
                        isHighest 
                          ? 'border-accent opacity-100' 
                          : 'border-ink/20 opacity-70'
                      }`}
                    >
                      <div className={`${isHighest ? 'text-base font-medium' : 'text-sm'} mb-1`}>
                        {bid.value} ETH
                      </div>
                      <div className="text-[10px] text-ink/50 mb-0.5">
                        {short(bid.bidder)}
                      </div>
                      <div className="text-[9px] text-ink/40">
                        {new Date(bid.time).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-ink/50">
                <div className="text-[10px] text-ink/40 mb-2">({status})</div>
                <div>waiting for bids…</div>
              </div>
            )}

            {/* Collector status - desktop */}
            <div className="mt-6">
              <div className="text-[10px] text-ink/50 mb-1">Collector:</div>
              <div className={`text-sm font-medium ${collectorStatus.color}`}>
                {collectorStatus.text}
              </div>
            </div>

            {/* Listing link - desktop */}
            {listingId && (
              <div className="mt-4">
                <a 
                  href={`https://manifold.xyz/@perrinexyz/id/${listingId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent hover:text-accent/80 transition"
                >
                  Listing ↗
                </a>
              </div>
            )}

            {/* Countdown - desktop */}
            {timeRemaining && (
              <div className="mt-4 font-mono text-xs text-ink/70">
                {timeRemaining.days}d {String(timeRemaining.hours).padStart(2, '0')}h {String(timeRemaining.minutes).padStart(2, '0')}m {String(timeRemaining.seconds).padStart(2, '0')}s
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}

function short(a?: string){ return a ? `${a.slice(0,6)}…${a.slice(-4)}` : ""; }