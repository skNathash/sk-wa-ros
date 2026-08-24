import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import useAppNav from "~/hooks/useAppNav";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import MiscService from "~/services/MiscService";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";
import { SUBSCRIBE_VERSION_OLD } from "~/routes/dashboard/inventory/subscribe/helper";
import { SUBSCRIBE_CHIPS, getActiveSubscribeChipKey } from "./helper";

interface SubscribePaneChipsProps {
  className?: string;
}

/**
 * Quick-nav chips over the subscribe (Create My Catalog) views, built on the
 * generic {@link PaneChips}. Replaces the SubscribeTabs row in the theme-2 side
 * pane: the chip set is fixed, the active chip comes from the `tab` query param
 * (the same key the tabs use), and a tap navigates to that view carrying the
 * active flow (`version=old`) along so the breadcrumb keeps resolving back to
 * the right landing.
 */
const SubscribePaneChips = ({ className }: SubscribePaneChipsProps) => {
  const { t } = useTranslation("inventorySubscribe");
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();

  const activeTab = getActiveSubscribeChipKey(
    pathname,
    searchParams.get("tab"),
  );
  const version = searchParams.get("version");
  const versionSuffix =
    version === SUBSCRIBE_VERSION_OLD ? `&version=${version}` : "";

  // Products the seller has submitted that are still awaiting approval. Shown
  // as a badge on the Approval History chip so the pending work is visible
  // without opening that view; refreshed when a submission changes anything.
  const [approvalPendingCount, setApprovalPendingCount] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchCount = async () => {
      const count = await InventorySubscribeService.getApprovalPendingCount();
      if (active) setApprovalPendingCount(count);
    };

    fetchCount();

    document.addEventListener("subscribe-item-added", fetchCount);
    MiscService.listenEvent("create-pending-updated", fetchCount);
    MiscService.listenEvent("subscribe-success", fetchCount);

    return () => {
      active = false;
      document.removeEventListener("subscribe-item-added", fetchCount);
      MiscService.removeEventListener("create-pending-updated", fetchCount);
      MiscService.removeEventListener("subscribe-success", fetchCount);
    };
  }, []);

  const data: PaneChipItem[] = SUBSCRIBE_CHIPS.map((chip) => ({
    key: chip.key,
    label: t(chip.langKey, { defaultValue: chip.label }),
    active: activeTab === chip.key,
    count: chip.key === "history" ? approvalPendingCount : undefined,
    path: `${chip.path}${versionSuffix}`,
  }));

  const handleCallback = ({ data: chip }: PaneChipsAction) => {
    if (chip.path) appNav.to(chip.path as string);
  };

  return (
    <PaneChips data={data} callback={handleCallback} className={className} />
  );
};

export default SubscribePaneChips;
