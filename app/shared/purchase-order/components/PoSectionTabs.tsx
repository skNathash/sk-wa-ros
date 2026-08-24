import { format, subMonths } from "date-fns";
import { useMemo } from "react";
import { useSearchParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { SectionTab } from "~/types/CommonTypes";

export type PoSectionTabKey =
  | "boxes"
  | "all-po"
  | "scan-ai"
  | "scan-box"
  | "vendors"
  | "purchases";

/** Which tab set to render. */
export type PoSectionTabType = "po" | "vendor";

interface PoSectionTabsProps {
  /** Key of the active tab; omit on pages that map to none of them. */
  activeTab?: PoSectionTabKey | "";
  /** Tab set: the purchase-order bar (default) or the vendor bar. */
  type?: PoSectionTabType;
  className?: string;
  /** Extra classes on the sticky wrapper — use for page-level spacing. */
  outerClassName?: string;
}

const PO_TABS: SectionTab[] = [
  {
    label: "All PO",
    key: "all-po",
    icon: "box",
    description: "Every purchase order",
    redirect: { url: "/dashboard/purchase-order/summary-po" },
  },
  {
    label: "Boxes",
    key: "boxes",
    icon: "inbox",
    description: "Boxes yet to be received",
    redirect: { url: "/dashboard/purchase-order/not-received" },
  },
  {
    label: "SK Invoice AI",
    key: "scan-ai",
    icon: "sparkles",
    description: "Scan an invoice to auto-create your PO",
    // The one AI entry on the bar — carries its own violet fill instead of the
    // brand green so it reads as a different kind of destination (see app.css).
    className: "app-tab-ai",
    redirect: { url: "/dashboard/scan/invoice-scan" },
  },
  {
    label: "Scan Box",
    key: "scan-box",
    icon: "scan-line",
    description: "Scan box barcodes to receive",
    redirect: { url: "/dashboard/purchase-order/box-receive" },
  },
  {
    label: "Vendors",
    key: "vendors",
    icon: "store",
    description: "Your own suppliers",
    redirect: { url: "/dashboard/vendor/list" },
  },
];

const VENDOR_TABS: SectionTab[] = [
  {
    label: "Vendors",
    key: "vendors",
    icon: "store",
    description: "Your own suppliers",
    redirect: { url: "/dashboard/vendor/list" },
  },
  {
    label: "Purchases",
    key: "purchases",
    icon: "clipboard-list",
    description: "Purchase orders you raised",
    redirect: { url: "/dashboard/purchase-order/summary-po" },
  },
  {
    label: "SK Invoice AI",
    key: "scan-ai",
    icon: "sparkles",
    // Same violet AI treatment as on the PO bar (see app.css).
    className: "app-tab-ai",
    description: "Scan an invoice to auto-create your PO",
    redirect: { url: "/dashboard/scan/invoice-scan" },
  },
];

const TAB_SETS: Record<PoSectionTabType, SectionTab[]> = {
  po: PO_TABS,
  vendor: VENDOR_TABS,
};

/** Tabs that land on the PO summary list and need a default date range. */
const DATE_RANGE_TABS = new Set(["all-po", "purchases"]);

/**
 * Purchase-order tab bar shown in the theme-2 mobile view, in place of the
 * legacy {@link PoListTabs}. Sticks under the app header and breaks out of the
 * page padding so the underline runs edge to edge.
 */
const PoSectionTabs = ({
  activeTab = "",
  type = "po",
  className,
  outerClassName,
}: PoSectionTabsProps) => {
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();

  const tabs = TAB_SETS[type] ?? PO_TABS;

  // "All PO" defaults to the last six months unless the current URL already
  // carries a range, mirroring PoListTabs.
  const handleTabChange = useMemo(
    () => (tab: SectionTab) => {
      if (!DATE_RANGE_TABS.has(tab.key)) {
        appNav.to(tab.redirect.url, tab.redirect.params);
        return;
      }

      const today = new Date();
      const dateFromParam = searchParams.get("dateFrom");
      const dateToParam = searchParams.get("dateTo");

      appNav.to(tab.redirect.url, {
        dateFrom: format(
          dateFromParam ? new Date(dateFromParam) : subMonths(today, 6),
          "yyyy-MM-dd",
        ),
        dateTo: format(
          dateToParam ? new Date(dateToParam) : today,
          "yyyy-MM-dd",
        ),
        groupByType: "total",
      });
    },
    [appNav, searchParams],
  );

  return (
    <SectionTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      className={className}
      outerClassName={outerClassName}
      noShadow
      sticky
    />
  );
};

export default PoSectionTabs;
