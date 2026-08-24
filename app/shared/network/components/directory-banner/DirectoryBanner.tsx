import clsx from "clsx";
import { format } from "date-fns";

export interface DirectoryBannerProps {
  /** Mono eyebrow noun — "Customers", "Retailers". Rendered uppercase. */
  scopeLabel?: string;
  /**
   * Headline count. Comes from the directory network API (the same count the
   * list page reads for its pagination summary).
   */
  total?: number;
  /** Plural noun used in the headline beside {@link total}. */
  entityLabel?: string;
  /**
   * Lifetime-value figure shown beside the count. Pre-formatted (e.g. "₹2.4L")
   * by the caller, which owns the summary payload.
   */
  ltv?: string;
  /** Supporting line under the headline — the directory mix breakdown. */
  description?: string;
  /** Bold tail appended to {@link description} (the actionable bit). */
  descriptionHighlight?: string;
  /** Right-hand tile — label over value. Dropped when either is missing. */
  highlightLabel?: string;
  highlightValue?: string;
  /** Renders the placeholder shimmer instead of the figures. */
  loading?: boolean;
  className?: string;
}

/**
 * Theme-2 hero strip for the network directory pages — a deep-green banner
 * carrying the headline directory size, the mix of the book underneath it and
 * one call-out tile on the right.
 *
 * Every figure is supplied by the caller, which reads them off the directory
 * summary aggregate; nothing here falls back to sample copy.
 */
const DirectoryBanner = ({
  scopeLabel = "Customers",
  total,
  entityLabel = "customers",
  ltv,
  description,
  descriptionHighlight,
  highlightLabel,
  highlightValue,
  loading = false,
  className,
}: DirectoryBannerProps) => {
  const period = format(new Date(), "MMM yyyy");

  return (
    <div
      className={clsx(
        // Mobile runs tighter: less padding, smaller type and the call-out
        // tile laid on one line. From `sm` up it is the full-size hero.
        "tw:relative tw:overflow-hidden tw:rounded-2xl tw:bg-gradient-to-br tw:from-emerald-800 tw:via-emerald-700 tw:to-teal-700 tw:p-3 tw:sm:p-4 tw:text-emerald-50",
        className,
      )}
    >
      {/* Decorative glow, top-right — mirrors the inventory insight hero. */}
      <div
        aria-hidden
        className="tw:pointer-events-none tw:absolute tw:-top-16 tw:-right-10 tw:h-44 tw:w-44 tw:rounded-full tw:bg-emerald-400/20"
      />

      <div className="tw:relative tw:flex tw:flex-col tw:gap-2 tw:sm:gap-4 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between">
        <div className="tw:min-w-0">
          <div className="tw:font-mono tw:text-[10px] tw:sm:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-emerald-200">
            {scopeLabel} · {period}
          </div>

          {loading ? (
            <div className="tw:mt-2 tw:animate-pulse tw:space-y-2">
              <div className="tw:h-6 tw:sm:h-7 tw:w-48 tw:sm:w-64 tw:rounded tw:bg-white/20" />
              <div className="tw:h-3 tw:w-80 tw:max-w-full tw:rounded tw:bg-white/10" />
            </div>
          ) : (
            <>
              <h2 className="tw:mt-0.5 tw:sm:mt-1.5 tw:text-lg tw:sm:text-2xl tw:font-bold tw:leading-tight tw:sm:leading-snug tw:text-white">
                {(total ?? 0).toLocaleString("en-IN")} {entityLabel}
                {ltv ? ` · ${ltv}` : ""}
              </h2>
              {description || descriptionHighlight ? (
                <p className="tw:mt-0.5 tw:sm:mt-1 tw:text-[11px] tw:sm:text-xs tw:text-emerald-100/90">
                  {description}
                  {descriptionHighlight ? (
                    <strong className="tw:font-semibold tw:text-white">
                      {" "}
                      {descriptionHighlight}
                    </strong>
                  ) : null}
                </p>
              ) : null}
            </>
          )}
        </div>

        {/* Mobile lays the tile out as one line — label left, value right —
            instead of the stacked block the desktop hero carries. */}
        {highlightLabel && highlightValue ? (
          <div className="tw:shrink-0 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-lg tw:sm:rounded-xl tw:bg-white/10 tw:px-3 tw:py-1.5 tw:sm:block tw:sm:px-4 tw:sm:py-2 tw:sm:text-right">
            <div className="tw:font-mono tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-emerald-200">
              {highlightLabel}
            </div>
            <div className="tw:text-base tw:sm:mt-0.5 tw:sm:text-xl tw:font-bold tw:leading-none tw:text-white">
              {highlightValue}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DirectoryBanner;
