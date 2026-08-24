import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import Rbac from "~/components/core/rbac/Rbac";
import useAppNav from "~/hooks/useAppNav";
import FranchiseService from "~/services/FranchiseService";

const CREATE_PO_ROLES = ["PURCHASE-ORDER.CREATE"];

interface PurchaseOrderCreateButtonProps {
  className?: string;
  /** `from` query param passed to the vendors page. Defaults to "po". */
  createFrom?: string;
}

/**
 * Full-width Create PO button for the purchase-order side pane. Owns the same
 * platform-fee plan guard used by CreatePoFab / PoActionButtons.
 */
const PurchaseOrderCreateButton = ({
  className,
  createFrom = "po",
}: PurchaseOrderCreateButtonProps) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const [isCheckingPlan, setIsCheckingPlan] = useState(false);
  const [planAlertDialog, setPlanAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const handleCreatePurchaseOrder = async () => {
    setIsCheckingPlan(true);
    try {
      const planResp = await FranchiseService.getActivePlan();

      if (
        !planResp ||
        !planResp.isPlanActive ||
        planResp.availableAmount <= 0
      ) {
        setPlanAlertDialog({
          show: true,
          title: t("buyPlatformFeePlan", {
            defaultValue: "Buy Platform Fee Plan",
          }),
          description: t("platformFeePlanRequiredForPo", {
            defaultValue:
              "You need an active platform fee plan to create a purchase order. Please subscribe to a plan to continue.",
          }),
          onConfirm: () => {
            setPlanAlertDialog((prev) => ({ ...prev, show: false }));
            appNav.to(FranchiseService.getBuyPlanLink());
          },
          onCancel: () => {
            setPlanAlertDialog((prev) => ({ ...prev, show: false }));
          },
        });
        return;
      }

      appNav.to("/dashboard/purchase-order/vendors", { from: createFrom });
    } finally {
      setIsCheckingPlan(false);
    }
  };

  return (
    <>
      <Rbac roles={CREATE_PO_ROLES}>
        <AppButton
          className={`tw:w-full ${className ?? ""}`}
          onClick={handleCreatePurchaseOrder}
          isLoading={isCheckingPlan}
          disabled={isCheckingPlan}
        >
          <Plus className="tw:w-4 tw:h-4" />
          {t("createPO")}
        </AppButton>
      </Rbac>

      <AppAlertDialog
        title={planAlertDialog.title}
        description={planAlertDialog.description}
        show={planAlertDialog.show}
        onConfirm={planAlertDialog.onConfirm}
        onCancel={planAlertDialog.onCancel}
      />
    </>
  );
};

export default PurchaseOrderCreateButton;
