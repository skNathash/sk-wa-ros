import { Plus, ScanText } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import Rbac from "~/components/core/rbac/Rbac";
import useAppNav from "~/hooks/useAppNav";
import FranchiseService from "~/services/FranchiseService";

const rbacRoles = {
  createPO: ["PURCHASE-ORDER.CREATE"],
};

type Props = {
  /**
   * `from` query param passed to the vendors page by the default Create PO
   * flow. Defaults to "po".
   */
  createFrom?: string;
  /**
   * Override the default Create PO flow (plan check → vendors). When set, this
   * is called instead and the built-in plan check / dialog are skipped.
   */
  onCreatePO?: () => void;
  /** Show the SK Invoice AI scan FAB. Defaults to false. */
  showScan?: boolean;
  /** Override the default scan action (→ /dashboard/scan/invoice-scan). */
  onScan?: () => void;
};

/**
 * Action FABs shown on mobile in every theme (hidden at `md` and up).
 * Self-contained: owns the Create PO plan-check flow (and the "buy platform
 * fee plan" dialog) plus the optional SK Invoice AI scan action, so pages only
 * need to drop in `<CreatePoFab />`. Sits above the bottom tab bar (the sticky
 * `.app-footer` is hidden on mobile — see the purchase-order pages).
 */
const CreatePoFab = ({ createFrom = "po", onCreatePO, onScan, showScan }: Props) => {
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

  const handleCreatePO = async () => {
    if (onCreatePO) {
      onCreatePO();
      return;
    }

    setIsCheckingPlan(true);
    try {
      const planResp = await FranchiseService.getActivePlan();

      if (!planResp || !planResp.isPlanActive || planResp.availableAmount <= 0) {
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

  const handleScan = () => {
    if (onScan) {
      onScan();
      return;
    }
    appNav.to("/dashboard/scan/invoice-scan");
  };

  return (
    <>
      <div
        className="tw:fixed tw:right-4 tw:z-50 tw:flex tw:md:hidden tw:flex-col tw:items-end tw:gap-3"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        {showScan ? (
          <button
            type="button"
            onClick={handleScan}
            aria-label={t("invoiceAiTitle")}
            className="tw:bg-violet-600 tw:text-white tw:w-11 tw:h-11 tw:rounded-full tw:shadow-lg tw:flex tw:items-center tw:justify-center tw:transition-transform tw:duration-200 tw:cursor-pointer tw:active:scale-95"
          >
            <ScanText className="tw:w-5 tw:h-5" />
          </button>
        ) : null}

        <Rbac roles={rbacRoles.createPO}>
          <button
            type="button"
            disabled={isCheckingPlan}
            onClick={handleCreatePO}
            aria-label={t("createPO")}
            className="tw:bg-primary tw:text-primary-foreground tw:h-11 tw:px-4 tw:rounded-full tw:shadow-lg tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-semibold tw:transition-transform tw:duration-200 tw:cursor-pointer tw:disabled:opacity-60 tw:disabled:cursor-not-allowed"
          >
            <Plus className="tw:w-5 tw:h-5" />
            {t("createPO")}
          </button>
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

export default CreatePoFab;
