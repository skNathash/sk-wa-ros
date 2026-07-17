import React from "react";
import { Sparkles } from "lucide-react";

/** AI pill with a spinning ring — shown while StoreKing AI is still resolving. */
const MatchingBadge: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <span
    className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[10px] tw:font-semibold tw:rounded-full tw:px-2 tw:py-0.5 tw:text-violet-700 tw:bg-violet-50 ${className}`}
  >
    <span className="tw:w-2.5 tw:h-2.5 tw:rounded-full tw:border-2 tw:border-violet-500 tw:border-t-transparent tw:animate-spin" />
    SK AI is Finding…
    <Sparkles className="tw:w-2.5 tw:h-2.5 tw:text-amber-400 tw:animate-pulse" />
  </span>
);

export default MatchingBadge;
