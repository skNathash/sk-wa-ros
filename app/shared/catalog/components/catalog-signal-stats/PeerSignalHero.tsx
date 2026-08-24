import { ChevronRight } from "lucide-react";
import { formatCount } from "./helper";

interface PeerSignalHeroProps {
  /** Radius the peer signal was computed for; shown in the eyebrow. */
  radiusKms: number;
  /** SKUs nearby retailers have subscribed to that this retailer hasn't. */
  gapCount: number;
  /** How many retailers in the radius contributed to the signal. */
  peerRetailers: number;
  /** A few product names to make the number concrete. */
  sampleNames: string[];
  onSeeGaps: () => void;
}

/**
 * The one number in the strip that asks for an action, so it gets the fill, the
 * headline and the only button.
 */
const PeerSignalHero = ({
  radiusKms,
  gapCount,
  peerRetailers,
  sampleNames,
  onSeeGaps,
}: PeerSignalHeroProps) => (
  // Wider than the count tiles — it carries the headline and the only CTA.
  <div className="tw:relative tw:col-span-full tw:overflow-hidden tw:rounded-2xl tw:bg-linear-to-br tw:from-emerald-800 tw:to-emerald-500 tw:p-3 tw:text-white tw:shadow-md tw:md:col-span-2 tw:md:p-5">
    {/* Soft highlight so the flat fill doesn't read as a solid block. */}
    <span
      aria-hidden="true"
      className="tw:pointer-events-none tw:absolute tw:-top-10 tw:-right-8 tw:h-36 tw:w-36 tw:rounded-full tw:bg-white/10"
    />

    <div className="tw:relative">
      <div className="tw:text-[11px] tw:font-semibold tw:tracking-wide tw:text-white/70 tw:uppercase">
        Retailer signal · {radiusKms}km radius
      </div>

      <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-end tw:justify-between tw:gap-3">
        <h3 className="tw:max-w-88 tw:text-sm tw:leading-snug tw:font-bold tw:md:text-xl">
          {formatCount(gapCount)} SKUs nearby retailers subscribed — you haven't
        </h3>

        <button
          type="button"
          onClick={onSeeGaps}
          className="tw:inline-flex tw:shrink-0 tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-full tw:bg-white tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:md:px-4 tw:md:py-2 tw:md:text-sm tw:text-emerald-800 tw:shadow-sm tw:transition-transform hover:tw:scale-[1.02] active:tw:scale-95 tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-white"
        >
          See gaps
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Clamped on mobile so the sample list stays a footnote, full on desktop. */}
      {sampleNames.length > 0 && (
        <p className="tw:mt-2 tw:line-clamp-3 tw:text-[11px] tw:leading-relaxed tw:text-white/85 tw:md:mt-3 tw:md:line-clamp-none tw:md:text-xs">
          {peerRetailers > 0
            ? `${formatCount(peerRetailers)} retailers near you subscribed `
            : "Retailers near you subscribed "}
          {sampleNames.map((name, index) => (
            <span key={name}>
              <span className="tw:font-semibold tw:text-white">{name}</span>
              {index < sampleNames.length - 2
                ? ", "
                : index === sampleNames.length - 2
                  ? ", and "
                  : ""}
            </span>
          ))}
          .
        </p>
      )}
    </div>
  </div>
);

export default PeerSignalHero;
