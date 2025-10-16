import { JsonRpcProvider, Contract } from "ethers";

const ABI = [
  "function tokenURI(uint256) view returns (string)",
  "function name() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function ownerOf(uint256) view returns (address)", // ADDED: To fetch token owner
] as const;

const bodyMemo = new Map<number, Promise<string | null>>();
const ownerMemo = new Map<number, Promise<string | null>>();

export const CONTRACT_INFO = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
};

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
const provider = rpcUrl ? new JsonRpcProvider(rpcUrl) : undefined;
const contract = provider ? new Contract(CONTRACT_INFO.address, ABI, provider) : undefined;

export type TokenFields = {
  raw: string;            // decoded tokenURI body (JSON or HTML)
  name?: string;
  animationHtml?: string; // data:text/html… (decoded)
  imageDataUri?: string;  // data:image/png;base64…
};

export async function fetchTokenBody(tokenId: number): Promise<string | null> {
  if (!contract) return null;
  if (bodyMemo.has(tokenId)) return bodyMemo.get(tokenId)!;

  const p = (async () => {
    try {
      const uri: string = await contract.tokenURI(tokenId);
      if (!uri.startsWith("data:")) return uri;

      const comma = uri.indexOf(",");
      const header = uri.slice(5, comma);
      const payload = uri.slice(comma + 1);

      if (header.includes(";base64")) {
        if (typeof window !== "undefined" && typeof window.atob === "function") {
          try { return decodeURIComponent(escape(window.atob(payload))); }
          catch { return window.atob(payload); }
        }
        return Buffer.from(payload, "base64").toString("utf8");
      }
      try { return decodeURIComponent(payload); } catch { return payload; }
    } catch (e) {
      console.error("fetchTokenHTML error", e);
      return null;
    }
  })();

  bodyMemo.set(tokenId, p);
  return p;
}

// ADDED: Fetch the current owner of a token from the blockchain
export async function fetchTokenOwner(tokenId: number): Promise<string | null> {
  if (!contract) {
    console.warn("No contract available to fetch owner");
    return null;
  }
  
  if (ownerMemo.has(tokenId)) return ownerMemo.get(tokenId)!;

  const p = (async () => {
    try {
      const owner: string = await contract.ownerOf(tokenId);
      return owner;
    } catch (e) {
      console.error(`fetchTokenOwner error for token ${tokenId}:`, e);
      return null;
    }
  })();

  ownerMemo.set(tokenId, p);
  return p;
}

export function parseTokenFields(body: string): TokenFields {
  const out: TokenFields = { raw: body };
  // JSON tokenURI (OpenSea-style)
  try {
    const j = JSON.parse(body);
    if (typeof j.name === "string") out.name = j.name;

    if (typeof j.animation_url === "string" && j.animation_url.startsWith("data:text/html")) {
      out.animationHtml = decodeDataUrl(j.animation_url);
    }
    if (typeof j.image === "string" && j.image.startsWith("data:image/png")) {
      out.imageDataUri = j.image;
    }
    return out;
  } catch {
    // raw HTML tokenURI case
    if (/<!doctype|<html/i.test(body)) out.animationHtml = body;
    return out;
  }
}

function decodeDataUrl(url: string): string {
  const i = url.indexOf(",");
  if (i === -1) return url;
  const head = url.slice(5, i);  // after "data:"
  const data = url.slice(i + 1);
  if (head.includes(";base64")) {
    if (typeof window !== "undefined" && typeof window.atob === "function") {
      try { return decodeURIComponent(escape(window.atob(data))); } catch { return window.atob(data); }
    }
    return Buffer.from(data, "base64").toString("utf8");
  }
  try { return decodeURIComponent(data); } catch { return data; }
}

export function extractTitle(text: string): string | null {
  try {
    const j = JSON.parse(text);
    if (j && typeof j.name === "string") return j.name;
  } catch {}
  const lower = text.toLowerCase();
  const a = lower.indexOf("<title>");
  if (a !== -1) {
    const b = lower.indexOf("</title>", a + 7);
    if (b !== -1) return text.slice(a + 7, b).trim();
  }
  return null;
}