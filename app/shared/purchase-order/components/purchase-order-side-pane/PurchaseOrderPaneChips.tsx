import { ClipboardList, Inbox, ScanLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";

interface PurchaseOrderPaneChipsProps {
  className?: string;
}

/**
 * Quick-nav chips for the purchase-order side pane: PO List → summary-po,
 * Scan Box → box-receive, Receive → not-received.
 */
const PurchaseOrderPaneChips = ({
  className,
}: PurchaseOrderPaneChipsProps) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const location = useLocation();

  const path = location.pathname;
  const isPoListActive =
    path.startsWith("/dashboard/purchase-order/summary-po") ||
    path.startsWith("/dashboard/purchase-order/list");
  const isScanBoxActive = path.startsWith(
    "/dashboard/purchase-order/box-receive",
  );
  const isReceiveActive = path.startsWith(
    "/dashboard/purchase-order/not-received",
  );

  const data: PaneChipItem[] = [
    {
      key: "po-list",
      label: t("poList", { defaultValue: "PO List" }),
      icon: <ClipboardList size={16} />,
      active: isPoListActive,
      path: "/dashboard/purchase-order/summary-po",
    },
    {
      key: "scan-box",
      label: t("scanBox", { defaultValue: "Scan Box" }),
      icon: <ScanLine size={16} />,
      active: isScanBoxActive,
      path: "/dashboard/purchase-order/box-receive",
    },
    {
      key: "receive",
      label: t("receive", { defaultValue: "Receive" }),
      icon: <Inbox size={16} />,
      active: isReceiveActive,
      path: "/dashboard/purchase-order/not-received",
    },
  ];

  const handleCallback = ({ data: chip }: PaneChipsAction) => {
    if (chip.key === "po-list") {
      appNav.to(chip.path as string, { groupByType: "total" });
      return;
    }
    if (chip.path) {
      appNav.to(chip.path as string);
    }
  };

  return (
    <PaneChips data={data} callback={handleCallback} className={className} />
  );
};

export default PurchaseOrderPaneChips;
