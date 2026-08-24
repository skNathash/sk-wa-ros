import clsx from "clsx";
import { useTranslation } from "react-i18next";
import VendorPaneChips from "~/shared/vendor/components/vendor-pane-chips/VendorPaneChips";
import VendorPayablesSummary from "~/shared/vendor/components/vendor-payables-summary/VendorPayablesSummary";
import Vendors from "./vendors/Vendors";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

export interface VendorSidePaneProps {
  /** Pane header title (e.g. "Vendors"). */
  title?: string;
  /** Small muted label shown beside the title (e.g. "Supply"). */
  scopeLabel?: string;
  /** Render the quick-nav chips. Defaults to true. */
  showChips?: boolean;
  /** Vendor id currently open in the main pane — highlighted in the list. */
  activeVendorId?: string;
  className?: string;
}

/**
 * Reusable vendor side-pane contents used by the vendor views in theme-2
 * desktop. Bundles the pane header, quick-nav chips, vendor payables summary
 * and the compact vendor list so every vendor page renders the same pane
 * without duplicating the layout. Mirrors `CatalogSidePane` on the inventory
 * side.
 */
const VendorSidePane = ({
  title,
  scopeLabel,
  showChips = true,
  activeVendorId,
  className,
}: VendorSidePaneProps) => {
  const { t } = useTranslation();

  const effectiveTitle = title || t("vendors", { defaultValue: "Vendors" });
  const effectiveScopeLabel =
    scopeLabel || t("supply", { defaultValue: "Supply" });

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      {/* Pane header — section title + scope label. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:px-1">
        <PaneTitle title={effectiveTitle} />
        {/* Scope label removed — the pane header carries the title alone.
        <span className="tw:text-sm tw:text-slate-400">
          {effectiveScopeLabel}
        </span>
        */}
      </div>

      {/* Quick-nav chips over the vendor views. */}
      {showChips && <VendorPaneChips />}

      <VendorPayablesSummary />

      <Vendors activeVendorId={activeVendorId} />
    </div>
  );
};

export default VendorSidePane;
