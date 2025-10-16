"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchManifoldBids, watchManifoldBids, getListingIdForToken, ManifoldBid } from "./manifold-blockchain";

export type BidEvent = { value: string; bidder: string; time: number };

const USE_BLOCKCHAIN = process.env.NEXT_PUBLIC_USE_BLOCKCHAIN === "true";

export function useLiveBids(tokenId: number) {
    console.log("🔍 USE_BLOCKCHAIN:", USE_BLOCKCHAIN);
  console.log("🔍 Token ID:", tokenId);
  console.log("🔍 Listing ID:", getListingIdForToken ? getListingIdForToken(tokenId) : "function not found");
  const [events, setEvents] = useState<BidEvent[]>([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let stop = false;
    setEvents([]);
    setStatus("connecting");

    // Blockchain mode - Read directly from Manifold contract
    if (USE_BLOCKCHAIN) {
      const listingId = getListingIdForToken(tokenId);
      
      if (!listingId) {
        setStatus("no listing");
        // Fall through to demo mode
      } else {
        setStatus("loading from blockchain");
        
        // Fetch historical bids
        fetchManifoldBids(listingId).then((bids) => {
          if (stop) return;
          
          const bidEvents: BidEvent[] = bids.map((bid) => ({
            value: bid.value,
            bidder: bid.bidder,
            time: bid.timestamp,
          }));
          
          setEvents(bidEvents);
          setStatus("live (blockchain)");
        });

        // Watch for new bids in real-time
        const unsubscribe = watchManifoldBids(listingId, (bid: ManifoldBid) => {
          if (stop) return;
          
          const bidEvent: BidEvent = {
            value: bid.value,
            bidder: bid.bidder,
            time: bid.timestamp,
          };
          
          setEvents((arr) => [bidEvent, ...arr].slice(0, 100));
        });

        return () => {
          stop = true;
          unsubscribe();
        };
      }
    }

    // Demo mode (fallback)
    setStatus("demo");
    
    const initialBids: BidEvent[] = [];
    const baseValue = 0.15;
    const now = Date.now();
    
    for (let i = 0; i < 8; i++) {
      initialBids.push({
        value: (baseValue + (Math.random() * 0.3) + (i * 0.05)).toFixed(3),
        bidder: demoAddr(),
        time: now - (i * 120000),
      });
    }
    
    setEvents(initialBids);

    const addBid = () => {
      setEvents((arr) => {
        const currentHighest = arr.length > 0 
          ? Math.max(...arr.map(b => parseFloat(b.value))) 
          : 0.1;
        const newBid = {
          value: (currentHighest + 0.01 + Math.random() * 0.1).toFixed(3),
          bidder: demoAddr(),
          time: Date.now()
        };
        return [newBid, ...arr].slice(0, 20);
      });
    };

    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 7000;
      return setTimeout(() => {
        if (!stop) {
          addBid();
          scheduleNext();
        }
      }, delay);
    };

    const timeoutId = scheduleNext();
    return () => {
      stop = true;
      clearTimeout(timeoutId);
    };
  }, [tokenId]);

  const highest = useMemo(() => {
    if (!events.length) return undefined;
    return events.reduce((a, b) => (parseFloat(a.value) >= parseFloat(b.value) ? a : b));
  }, [events]);

  return { events, highest, status } as const;
}

function demoAddr() {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(20)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}`;
}