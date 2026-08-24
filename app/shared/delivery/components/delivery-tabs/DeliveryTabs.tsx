import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import type { TabItem } from "~/types/CommonTypes";

/** The delivery section's pages — dispatch, in transit and COD handover. */
export const DELIVERY_TABS: TabItem[] = [
  {
    name: "Dispatch",
    key: "dispatch",
    icon: "truck",
    langKey: "dispatch",
  },
  {
    name: "In Transit",
    key: "in-transit",
    icon: "route",
    langKey: "inTransit",
  },
  {
    name: "COD Reconciliation",
    key: "cod-reconciliation",
    icon: "indian-rupee",
    langKey: "codReconciliation",
  },
];

interface DeliveryTabsProps {
  activeTab: string;
  /** Tab styling — pills on the white top strip, segmented control elsewhere. */
  variant?: "tabs" | "pills" | "underline" | "chips";
  className?: string;
}

/**
 * Sub-nav shared by every delivery page. The layout renders it for the pages
 * that keep the classic block; pages with their own top strip (dispatch) render
 * it inside that strip so the tabs and the search read as one white band.
 */
const DeliveryTabs = ({ activeTab, variant, className }: DeliveryTabsProps) => {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();

  return (
    <AppTab
      activeTab={activeTab}
      tabs={DELIVERY_TABS}
      variant={variant}
      className={className}
      /* "COD Reconciliation" pushes the row past a phone's width, and the strip
         these tabs sit on sizes after mount — the swiper track measures itself
         too early there and the overflowing tabs end up unreachable. A native
         scroll track has nothing to measure. */
      scrollable
      /* Mobile only: the strip's lead slot drops its side padding
         (`.app-top-bar-lead`), so the track supplies the leading/trailing inset
         itself — the first tab still lines up with the page gutter while the
         rest scroll out under it. From md up the slot keeps its padding. */
      slideOffset={isMobile ? 16 : 0}
      onTabChange={(tab) =>
        appNav.to(`/dashboard/delivery/${tab.key}`, { tab: tab.key })
      }
    />
  );
};

export default DeliveryTabs;
