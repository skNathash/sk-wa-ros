import { Plus, ScanText, Users } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import Rbac from "~/components/core/rbac/Rbac";
import useAppNav from "~/hooks/useAppNav";
import FranchiseService from "~/services/FranchiseService";

const rbacRoles = {
  createPO: ["PURCHASE-ORDER.CREATE"],
  viewVendors: ["VENDOR.VIEW"],
};

type Props = {
  className?: string;
  /** Show the SK Invoice AI button. Defaults to true. */
  showInvoiceAi?: boolean;
  /**
   * Returns the query params for the Vendors navigation. Called on click so
   * pages with a live filter form can carry the current selection across.
   */
  getVendorParams?: () => Record<string, any>;
  /**
   * `from` query param passed to the vendors page by the Create PO flow.
   * Defaults to "po".
   */
  createFrom?: string;
};

/**
 * Desktop action buttons for the purchase-order pages (SK Invoice AI, Vendors,
 * Create PO). Hidden on mobile (`md` and up only) — mobile uses <CreatePoFab />.
 * Self-contained: owns the Create PO plan-check flow (and the "buy platform fee
 * plan" dialog), so pages only need to drop in <PoActionButtons />. Mirrors the
 * button row on the purchase-order summary page.
 */
const PoActionButtons = ({
  className = "",
  showInvoiceAi = true,
  getVendorParams,
  createFrom = "po",
}: Props) => {
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
          title: "Buy Platform Fee Plan",
          description:
            "You need an active platform fee plan to create a purchase order. Please subscribe to a plan to continue.",
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
      <div className={`tw:hidden tw:md:flex tw:gap-2 ${className}`}>
        {showInvoiceAi ? (
          <AppButton
            size="small"
            onClick={() => appNav.to("/dashboard/scan/invoice-scan")}
            noShadow={true}
            fill="outline"
            aria-label="SK Invoice AI"
          >
            <ScanText size={16} aria-hidden className="tw:mr-1" />
            SK Invoice AI
          </AppButton>
        ) : null}

        <Rbac roles={rbacRoles.viewVendors}>
          <AppButton
            size="small"
            onClick={() =>
              appNav.to(
                "/dashboard/vendor/list",
                getVendorParams ? getVendorParams() : {},
              )
            }
            noShadow={true}
            fill="outline"
          >
            <Users className="tw:mr-1" size={16} aria-hidden />
            {t("vendors")}
          </AppButton>
        </Rbac>

        <Rbac roles={rbacRoles.createPO}>
          <AppButton
            size="small"
            onClick={handleCreatePurchaseOrder}
            noShadow={true}
            isLoading={isCheckingPlan}
            disabled={isCheckingPlan}
          >
            <Plus className="tw:mr-1" size={16} aria-hidden />
            {t("createPO")}
          </AppButton>
        </Rbac>
      </div>

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

export default PoActionButtons;
