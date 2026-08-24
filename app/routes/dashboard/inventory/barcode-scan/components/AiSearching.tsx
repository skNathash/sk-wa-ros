import { useEffect, useState } from "react";
import { Bot, SearchX, Sparkles } from "lucide-react";

const MESSAGES = [
  "Reading the product details…",
  "Fetching name, brand & MRP…",
  "Finding the best matches for you…",
];

interface Props {
  barcode: string;
}

/**
 * Friendly animated waiting state shown while the AI search runs.
 * A pulsing bot with orbiting sparkles and rotating plain-language messages
 * keeps first-time users confident that something good is happening.
 */
const AiSearching: React.FC<Props> = ({ barcode }) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setMsgIndex((i) => (i + 1) % MESSAGES.length),
      2200,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="tw:relative tw:overflow-hidden tw:rounded-xl tw:border tw:border-violet-200 tw:bg-linear-to-br tw:from-violet-50 tw:via-white tw:to-blue-50 tw:px-4 tw:py-8 tw:flex tw:flex-col tw:items-center tw:text-center">
      {/* soft glow backdrop */}
      <div className="tw:absolute tw:-top-10 tw:-right-10 tw:w-40 tw:h-40 tw:rounded-full tw:bg-violet-100/60 tw:blur-2xl" />
      <div className="tw:absolute tw:-bottom-10 tw:-left-10 tw:w-40 tw:h-40 tw:rounded-full tw:bg-blue-100/60 tw:blur-2xl" />

      <div className="tw:relative tw:mb-3">
        <span className="tw:absolute tw:inset-0 tw:rounded-full tw:bg-violet-300/40 tw:animate-ping" />
        <div className="tw:relative tw:flex tw:items-center tw:justify-center tw:w-16 tw:h-16 tw:rounded-full tw:bg-linear-to-br tw:from-violet-500 tw:to-blue-600 tw:text-white tw:shadow-lg">
          <Bot className="tw:w-8 tw:h-8" />
        </div>
        <Sparkles className="tw:absolute tw:-top-1.5 tw:-right-2 tw:w-5 tw:h-5 tw:text-amber-400 tw:animate-bounce" />
      </div>

      {/* Headline: clearly state the product was NOT found in the SK Library */}
      <div className="tw:relative tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-medium tw:text-gray-500">
        <SearchX className="tw:w-3.5 tw:h-3.5" />
        Barcode not found in SK Library
      </div>

      <div className="tw:relative tw:flex tw:items-center tw:gap-1 tw:text-base tw:font-bold tw:text-violet-900 tw:mt-2">
        StoreKing AI is fetching details
        <Sparkles className="tw:w-4 tw:h-4 tw:text-amber-400 tw:animate-pulse" />
      </div>
      <div className="tw:relative tw:text-xs tw:font-medium tw:text-violet-700 tw:mt-2 tw:min-h-4">
        {MESSAGES[msgIndex]}
      </div>
      <div className="tw:relative tw:mt-3 tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[10px] tw:font-mono tw:text-gray-500 tw:bg-white/80 tw:border tw:border-gray-200 tw:rounded-full tw:px-2.5 tw:py-1">
        Barcode: {barcode}
      </div>

      {/* bouncing dots */}
      <div className="tw:relative tw:flex tw:gap-1.5 tw:mt-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="tw:w-2 tw:h-2 tw:rounded-full tw:bg-violet-500 tw:animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
};

export default AiSearching;
