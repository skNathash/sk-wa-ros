import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { Power } from "lucide-react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import SellerCatalogService from "~/services/SellerCatalogService";
import useAppToast from "~/hooks/useAppToast";
import Rbac from "~/components/core/rbac/Rbac";

const rbacRoles = {
  toggleProductStatus: ["CATALOG.UPDATE-PRODUCT-STATUS"],
};

interface Props {
  dealId: string;
  status: string; // Expecting values like 'Active' / 'Inactive' (case-insensitive handled)
  callback: (data: { action: string; data?: any }) => void;
  // Use same size values as AppButton
  size?: "small" | "large" | "default" | "icon";
  className?: string;
}

const ToggleProductStatus = ({
  dealId,
  status,
  callback,
  size = "default",
  className,
}: Props) => {
  const { t } = useTranslation(["common"]);
  const { show: showToast } = useAppToast();
  const [isLoading, setIsLoading] = useState(false);

  const isActive = String(status || "").toLowerCase() === "active";

  const buttonColor = isActive ? "danger" : "success";
  const buttonLabel = isActive ? t("deactivate") : t("activate");

  const dialogTitle = isActive ? t("deactivateProduct") : t("activateProduct");
  const dialogDescription = isActive
    ? `${t("areYouSureYouWantToDeactivateThisProduct")} ${t(
        "dealNotAllowedForSales"
      )}`
    : `${t("areYouSureYouWantToActivateThisProduct")} ${t(
        "dealAllowedForSales"
      )}`;

  const [appAlertDialog, setAppAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const handleClick = () => {
    setAppAlertDialog({
      show: true,
      title: dialogTitle,
      description: dialogDescription,
      onConfirm: async () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        await new Promise((r) => setTimeout(r, 200));
        await doToggle();
      },
      onCancel: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const doToggle = async () => {
    if (!dealId) {
      showToast({ msg: t("invalidProductId"), color: "error" });
      return;
    }

    setIsLoading(true);
    const newStatus = isActive ? "Inactive" : "Active";
    try {
      const resp = await SellerCatalogService.updateProductStatus(dealId, {
        status: newStatus,
      });

      if (resp?.statusCode === 200) {
        showToast({ msg: t("statusUpdatedSuccessfully"), color: "success" });
        callback({ action: "submit", data: { success: true, response: resp } });
      } else {
        showToast({
          msg: resp?.data?.message || t("failedToUpdateStatus"),
          color: "error",
        });
        callback({ action: "error", data: resp });
      }
    } catch (error: any) {
      console.error("Error updating product status:", error);
      showToast({ msg: t("errorUpdatingStatus"), color: "error" });
      callback({ action: "error", data: error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Rbac roles={rbacRoles.toggleProductStatus}>
        <AppButton
          color={buttonColor}
          onClick={handleClick}
          isLoading={isLoading}
          size={size}
          className={className}
          fill={isActive ? "outline" : "solid"}
        >
          <Power />
          {isLoading
            ? isActive
              ? t("deactivating")
              : t("activating")
            : buttonLabel}
        </AppButton>
      </Rbac>

      <AppAlertDialog
        title={appAlertDialog.title || dialogTitle}
        description={appAlertDialog.description || dialogDescription}
        show={appAlertDialog.show}
        onConfirm={appAlertDialog.onConfirm}
        onCancel={appAlertDialog.onCancel}
      />
    </>
  );
};

export default ToggleProductStatus;
