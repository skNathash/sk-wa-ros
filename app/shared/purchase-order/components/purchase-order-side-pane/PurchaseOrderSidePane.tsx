import clsx from "clsx";
import { useTranslation } from "react-i18next";
import PoScanBanners from "../PoScanBanners";
import PurchaseOrderCreateButton from "./PurchaseOrderCreateButton";
import PurchaseOrderPaneChips from "./PurchaseOrderPaneChips";
import PurchaseOrderRecentlyReceivedList from "./PurchaseOrderRecentlyReceivedList";
import PurchaseOrderSections from "./PurchaseOrderSections";
import PurchaseOrderSearchInput from "./search/PurchaseOrderSearchInput";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

export interface PurchaseOrderSidePaneProps {
  className?: string;
  /** Pane header title. Defaults to "Purchase Orders". */
  title?: string;
  /** Small muted label beside the title. Defaults to "Supply". */
  scopeLabel?: string;
  /** Show the pane header. Defaults to true. */
  showTitle?: boolean;
  /** Show the PO search Autocomplete. Defaults to true. */
  showSearch?: boolean;
  /** Show the PO List / Scan Box / Receive chips. Defaults to true. */
  showChips?: boolean;
  /** Show the Create PO button. Defaults to true. */
  showCreateButton?: boolean;
  /** Show the box-scan / invoice-AI banners. Defaults to true. */
  showScanBanners?: boolean;
  /** Show vendor / network / inward section links. Defaults to true. */
  showSections?: boolean;
  /** Show the recently-received preview list. Defaults to true. */
  showRecentlyReceivedList?: boolean;
  /** Number of recently received packages to preview. Defaults to 5. */
  recentlyReceivedLimit?: number;
}

/**
 * Shared purchase-order side-pane content for the theme-2 desktop split layout.
 * Mirrors VendorSidePane (supply section): header, search, chips, create CTA,
 * scan banners, section links, and a recently-received list.
 *
 * Intended to be dropped inside {@link AppPaneSide} on purchase-order pages.
 */
const PurchaseOrderSidePane = ({
  className,
  title,
  scopeLabel,
  showTitle = true,
  showSearch = true,
  showChips = true,
  showCreateButton = true,
  showScanBanners = true,
  showSections = true,
  showRecentlyReceivedList = true,
  recentlyReceivedLimit = 5,
}: PurchaseOrderSidePaneProps) => {
  const { t } = useTranslation(["common"]);

  const effectiveTitle =
    title || t("purchaseOrders", { defaultValue: "Purchase Orders" });
  const effectiveScopeLabel =
    scopeLabel || t("supply", { defaultValue: "Supply" });

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      {showTitle && (
        <div className="tw:flex tw:items-baseline tw:justify-between tw:px-1">
          <PaneTitle title={effectiveTitle} />
          {/* Scope label removed — the pane header carries the title alone.
          <span className="tw:text-sm tw:text-slate-400">
            {effectiveScopeLabel}
          </span>
          */}
        </div>
      )}

      {showSearch && <PurchaseOrderSearchInput />}

      {showChips && <PurchaseOrderPaneChips />}

      {showCreateButton && <PurchaseOrderCreateButton />}

      {showScanBanners && <PoScanBanners direction="column" />}

      {showSections && <PurchaseOrderSections />}

      {showRecentlyReceivedList && (
        <PurchaseOrderRecentlyReceivedList limit={recentlyReceivedLimit} />
      )}
    </div>
  );
};

export default PurchaseOrderSidePane;
