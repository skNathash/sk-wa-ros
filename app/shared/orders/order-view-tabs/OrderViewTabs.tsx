import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { SectionTab } from "~/types/CommonTypes";

/** The three ways of looking at the same order book. */
export type OrderViewTabKey = "board" | "directory" | "analytics";

interface OrderViewTabsProps {
  /** Key of the active view; omit on pages that map to none of them. */
  activeTab?: OrderViewTabKey | "";
  className?: string;
  /** Extra classes on the wrapper — use for page-level spacing. */
  outerClassName?: string;
  /**
   * Render as the sticky theme-2 mobile bar (see {@link SectionTabs}). Off by
   * default so the bar shows on every theme and breakpoint — the three views
   * are the page's primary navigation, not a mobile-only affordance.
   */
  sticky?: boolean;
  /** Tab styling — see {@link SectionTabs}. Defaults to the chip strip. */
  variant?: "tabs" | "pills" | "underline" | "chips";
}

const ORDER_VIEW_TABS: SectionTab[] = [
  {
    label: "Board",
    key: "board",
    icon: "kanban",
    description: "Pick, pack & hand over orders",
    redirect: { url: "/dashboard/fulfillment/list" },
  },
  {
    label: "All Orders",
    key: "directory",
    icon: "list",
    description: "Every order, filterable",
    redirect: { url: "/dashboard/orders/list" },
  },
  {
    label: "Analytics",
    key: "analytics",
    langKey: "orderAnalytics",
    icon: "chart-bar",
    description: "Order trends, customers & products",
    redirect: { url: "/dashboard/orders/dashboard" },
  },
];

/**
 * The order section's view switcher — the fulfilment board, the flat order
 * directory and the order analytics are three lenses on the same data, so
 * every one of those pages renders this same bar to move between them.
 */
const OrderViewTabs = ({
  activeTab = "",
  className,
  outerClassName,
  sticky = false,
  variant,
}: OrderViewTabsProps) => {
  const tabs = (
    <SectionTabs
      tabs={ORDER_VIEW_TABS}
      activeTab={activeTab}
      variant={variant}
      className={className}
      outerClassName={outerClassName}
      noShadow
      sticky={sticky}
      // The bar always sits inside the already-padded order top bar, so it
      // needs no leading/trailing inset of its own.
      slideOffset={0}
    />
  );

  // SectionTabs only honours `outerClassName` in its sticky wrapper, so the
  // plain bar gets its own wrapper for page-level spacing.
  return sticky ? tabs : <div className={outerClassName}>{tabs}</div>;
};

export default OrderViewTabs;
