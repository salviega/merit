import { abbreviateWallet } from "@/lib/format";

// `$host/path` in mono; the full URL is in the title and behind "Detalles"
// wherever the screen offers it.

export function WalletAddress({ url, className = "" }: { url: string; className?: string }) {
  return (
    <span className={`num ${className}`} title={url}>
      {abbreviateWallet(url)}
    </span>
  );
}
