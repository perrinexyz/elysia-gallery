import { JsonRpcProvider, Contract, EventLog } from "ethers";

// Manifold Marketplace contract address on Ethereum Mainnet
const MANIFOLD_MARKETPLACE_ADDRESS = "0x3a3548e060be10c2614d0a4cb0c03cc9093fd799";

// Simplified ABI - just the events we need
const MANIFOLD_MARKETPLACE_ABI = [
  "event BidEvent(uint40 indexed listingId, address indexed referrer, address indexed bidder, uint256 value)",
  "event ModifyListing(uint40 indexed listingId, uint256 initialAmount, uint48 startTime, uint48 endTime)",
];

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
const provider = rpcUrl ? new JsonRpcProvider(rpcUrl) : undefined;
const contract = provider 
  ? new Contract(MANIFOLD_MARKETPLACE_ADDRESS, MANIFOLD_MARKETPLACE_ABI, provider) 
  : undefined;

export interface ManifoldBid {
  listingId: number;
  bidder: string;
  value: string; // ETH value as string
  timestamp: number;
  txHash: string;
}

/**
 * Fetch all past bids for a specific Manifold listing
 */
export async function fetchManifoldBids(listingId: number): Promise<ManifoldBid[]> {
  if (!contract) {
    console.warn("No RPC provider configured");
    return [];
  }

  try {
    const filter = contract.filters.BidEvent(listingId);
    const currentBlock = await provider!.getBlockNumber();
    
    // Fetch last 2000 blocks (~7 hours of auction data)
    const fromBlock = Math.max(0, currentBlock - 2000);
    
    console.log(`Fetching bids for listing ${listingId} from blocks ${fromBlock} to ${currentBlock}`);
    
    const events = await contract.queryFilter(filter, fromBlock, currentBlock);
    
    console.log(`Found ${events.length} bid events`);
    
    if (events.length === 0) {
      return [];
    }
    
    const bids: ManifoldBid[] = await Promise.all(
      events.map(async (event) => {
        const log = event as EventLog;
        const block = await event.getBlock();
        
        return {
          listingId: Number(log.args[0]),
          bidder: log.args[2] as string,
          value: (Number(log.args[3]) / 1e18).toFixed(3),
          timestamp: block.timestamp * 1000,
          txHash: log.transactionHash,
        };
      })
    );
    
    return bids.sort((a, b) => b.timestamp - a.timestamp);
    
  } catch (error) {
    console.error("Error fetching Manifold bids:", error);
    return [];
  }
}

/**
 * Listen for new bids on a specific listing in real-time
 */
export function watchManifoldBids(
  listingId: number,
  callback: (bid: ManifoldBid) => void
): () => void {
  if (!contract) {
    console.warn("No RPC provider configured");
    return () => {};
  }

  const filter = contract.filters.BidEvent(listingId);
  
  const handleBid = async (...args: any[]) => {
    try {
      const event = args[args.length - 1]; // Last arg is the event object
      const block = await event.getBlock();
      
      const bid: ManifoldBid = {
        listingId: Number(args[0]),
        bidder: args[2] as string,
        value: (BigInt(args[3]) / BigInt(1e18)).toString(),
        timestamp: block.timestamp * 1000,
        txHash: event.log.transactionHash,
      };
      
      callback(bid);
    } catch (error) {
      console.error("Error processing bid event:", error);
    }
  };
  
  contract.on(filter, handleBid);
  
  // Return cleanup function
  return () => {
    contract.off(filter, handleBid);
  };
}

/**
 * Get your token's Manifold listing ID
 * You'll need to map your tokenIds to Manifold listingIds
 */
export function getListingIdForToken(tokenId: number): number | null {
  // TODO: Map your token IDs to Manifold listing IDs
  // For now, return null if no listing exists
  // Example mapping:
  const tokenToListingMap: Record<number, number> = {
    1: 15263, // Example: Token 1 is listed as listing 14900
    2: 15264,
    3: 15265,
    4: 15266,
    5: 15267,
    6: 15268,
    7: 15269,
    8: 15271,
    9: 15272,
    10: 15274,
    11: 15275,
    12: 15276,
    13: 15277,
    14: 15279,
    15: 15280,
    16: 15281,
    17: 15282,
    18: 15283,
    19: 15285,
    20: 14900,
    21: 15286,
  };
  
  return tokenToListingMap[tokenId] || null;
}