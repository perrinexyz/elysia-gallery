import Link from "next/link";
import Container from "@/components/Container";

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-sm bg-bg/70 border-b border-accent/10">
      <Container className="py-3 flex items-center justify-between">
        <Link href="/" className="font-bold tracking-tight">perrine</Link>
        <nav className="text-xs flex items-center gap-4">
          <a href="https://etherscan.io/address/0x32236815e4095e53ba61589622d275b38d60592b" className="hover:text-accent" target="_blank" rel="noreferrer">Etherscan</a>
          <a href="https://manifold.xyz/@perrinexyz" className="hover:text-accent" target="_blank" rel="noreferrer">Manifold</a>
          <a href="https://onchainchecker.xyz/collection/ethereum/0x32236815e4095e53ba61589622d275b38d60592b/1" className="hover:text-accent" target="_blank" rel="noreferrer">OnChainChecker</a>
        </nav>
      </Container>
    </header>
  );
}