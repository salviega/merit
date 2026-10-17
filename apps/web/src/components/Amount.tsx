import { formatAmount, type Amount as AmountValue } from "@/lib/format";

// A figure in mono with tabular numerals (09 §4), formatted per 09 §5.

export function Amount({
  amount,
  withCode = false,
  className = "",
}: {
  amount: AmountValue;
  withCode?: boolean;
  className?: string;
}) {
  return <span className={`num ${className}`}>{formatAmount(amount, { withCode })}</span>;
}
