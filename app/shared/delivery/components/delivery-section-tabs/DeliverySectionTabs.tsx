import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { SectionTab } from "~/types/CommonTypes";

export type DeliverySectionTabKey =
  | "dispatch"
  | "in-transit"
  | "cod-reconciliation"
  | "hand-off"
  | "runner"
  | "tracker";

interface DeliverySectionTabsProps {
  /** Key of the active tab; omit on pages that map to none of them. */
  activeTab?: DeliverySectionTabKey | "";
  className?: string;
  /** Extra classes on the sticky wrapper — use for page-level spacing. */
  outerClassName?: string;
}

const TABS: SectionTab[] = [
  {
    label: "Dispatch",
    key: "dispatch",
    icon: "truck",
    description: "Orders ready to go out",
    redirect: {
      url: "/dashboard/delivery/dispatch",
      params: { tab: "dispatch" },
    },
  },
  {
    label: "HandOff",
    key: "hand-off",
    icon: "hand",
    description: "Orders ready to go out",
    redirect: {
      url: "/dashboard/delivery/hand-off",
      params: { tab: "hand-off" },
    },
  },
  {
    label: "Runners",
    key: "runner",
    icon: "bike",
    description: "Runner assigned to the order",
    redirect: {
      url: "/dashboard/delivery/marketplace-runners",
      params: { tab: "runner" },
    },
  },
  {
    label: "Tracker",
    key: "tracker",
    icon: "route",
    description: "Tracker assigned to the order",
    redirect: {
      url: "/dashboard/delivery/tracker",
      params: { tab: "tracker" },
    },
  },
  {
    label: "COD Reconciliation",
    key: "cod-reconciliation",
    icon: "indian-rupee",
    description: "Settle cash on delivery",
    redirect: {
      url: "/dashboard/delivery/cod-reconciliation",
      params: { tab: "cod-reconciliation" },
    },
  },
];

const DeliverySectionTabs = ({
  activeTab = "",
  className,
  outerClassName,
}: DeliverySectionTabsProps) => {
  return (
    <SectionTabs
      tabs={TABS}
      activeTab={activeTab}
      className={className}
      outerClassName={outerClassName}
      noShadow
      sticky
    />
  );
};

export default DeliverySectionTabs;
