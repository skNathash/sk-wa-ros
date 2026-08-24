import { ScanLine, ScanText, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import useAppNav from "~/hooks/useAppNav";

type PoScanBannersProps = {
  /** Additional classes merged onto the root grid. Use theme-2 pane helpers such
   * as `app-pane-hide` or `app-pane-only` when the banners move between the
   * feed and the fixed side pane. */
  className?: string;
  /** Layout direction. `row` renders the two banners side by side (default for
   * the feed). `column` stacks them vertically (useful in the narrow side pane). */
  direction?: "row" | "column";
};

/**
 * Pair of action banners used on purchase-order pages to jump to the box-scan
 * and SK Invoice AI flows. Extracted into a shared component so it can be reused
 * in the main feed and the theme-2 side pane without duplicating markup.
 */
const PoScanBanners = ({
  className = "",
  direction = "row",
}: PoScanBannersProps) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  return (
    <div
      className={clsx(
        "tw:grid tw:gap-2 tw:md:gap-3",
        direction === "row" ? "tw:grid-cols-2" : "tw:grid-cols-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => appNav.to("/dashboard/purchase-order/box-receive")}
        aria-label={t("scanBox")}
        className="tw:group tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:gap-2 tw:md:gap-3 tw:cursor-pointer tw:rounded-lg tw:bg-primary tw:p-3 tw:md:p-4 tw:text-left tw:transition-colors tw:hover:bg-primary/90"
      >
        <div className="tw:flex tw:shrink-0 tw:items-center tw:justify-center tw:w-9 tw:h-9 tw:rounded-md tw:bg-white/15 tw:text-primary-foreground">
          <ScanLine className="tw:w-4.5 tw:h-4.5" />
        </div>
        <div className="tw:min-w-0">
          <div className="tw:text-[13px] tw:md:text-sm tw:font-bold tw:leading-tight tw:text-primary-foreground">
            {t("scanBox")}
          </div>
          <div className="tw:mt-0.5 tw:text-[11px] tw:md:text-xs tw:leading-snug tw:text-primary-foreground/80 tw:line-clamp-2">
            Scan the box barcode to receive your stock
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => appNav.to("/dashboard/scan/invoice-scan")}
        aria-label={t("invoiceAiTitle")}
        className="tw:group tw:relative tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:gap-2 tw:md:gap-3 tw:cursor-pointer tw:rounded-lg tw:bg-violet-600 tw:p-3 tw:md:p-4 tw:text-left tw:transition-colors tw:hover:bg-violet-700"
      >
        <span className="tw:absolute tw:top-2 tw:right-2 tw:inline-flex tw:items-center tw:justify-center tw:w-5 tw:h-5 tw:rounded-full tw:bg-white/20 tw:text-white">
          <Sparkles className="tw:w-3 tw:h-3" />
        </span>
        <div className="tw:flex tw:shrink-0 tw:items-center tw:justify-center tw:w-9 tw:h-9 tw:rounded-md tw:bg-white/15 tw:text-white">
          <ScanText className="tw:w-4.5 tw:h-4.5" />
        </div>
        <div className="tw:min-w-0">
          <div className="tw:text-[13px] tw:md:text-sm tw:font-bold tw:leading-tight tw:text-white">
            {t("invoiceAiTitle")}
          </div>
          <div className="tw:mt-0.5 tw:text-[11px] tw:md:text-xs tw:leading-snug tw:text-white/80 tw:line-clamp-2">
            Scan an invoice to auto-create your PO
          </div>
        </div>
      </button>
    </div>
  );
};

export default PoScanBanners;
