import { Info, Tag } from "lucide-react";
import React, { useState } from "react";
import { useSearchParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppSwitch from "~/components/core/form/AppSwitch";
import AppPopover from "~/components/core/popover/AppPopover";
import useAppToast from "~/hooks/useAppToast";
import SellerCatalogService from "~/services/SellerCatalogService";

interface PromotionalDealConfigProps {
  dealId: string;
  isPromotionalDeal: boolean;
  isB2bConfigured: boolean;
}

const PromotionalDealConfig: React.FC<PromotionalDealConfigProps> = ({
  dealId,
  isPromotionalDeal,
  isB2bConfigured,
}) => {
  const [loading, setLoading] = useState(false);
  const [_, setSearchParams] = useSearchParams();
  const toast = useAppToast();

  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    action: string;
  }>({
    show: false,
    title: "",
    description: "",
    confirmText: "",
    cancelText: "",
    action: "",
  });

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      const response: any = await SellerCatalogService.updatePromotionalDeal(
        dealId,
        checked,
      );

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        toast.show({
          msg:
            response?.message ||
            `Promotional deal ${checked ? "enabled" : "disabled"} successfully`,
          color: "success",
        });
        setSearchParams(
          (prev) => {
            const params = new URLSearchParams(prev);
            params.set("t", new Date().getTime().toString());
            return params;
          },
          { replace: true },
        );
      } else {
        toast.show({
          msg:
            response?.message ||
            "Failed to update promotional deal configuration",
          color: "error",
        });
      }
    } catch (error: any) {
      toast.show({
        msg: error?.message || "Something went wrong",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const alertSuccessCb = () => {
    setAppAlertDialog((p) => ({ ...p, show: false }));
    if (appAlertDialog.action === "update") {
      handleToggle(true);
    }
    if (appAlertDialog.action === "cancel") {
      handleToggle(false);
    }
  };

  const alertCancelCb = () => {
    setAppAlertDialog((p) => ({ ...p, show: false }));
  };

  return (
    <>
      <div
        className={`tw:p-3 tw:rounded-xl tw:border tw:transition-all ${
          isPromotionalDeal
            ? "tw:bg-purple-50 tw:border-purple-100"
            : "tw:bg-gray-50 tw:border-gray-100"
        }`}
      >
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
          <div className="tw:flex tw:items-center tw:gap-3">
            <div className="tw:p-2 tw:rounded-lg tw:bg-purple-600 tw:text-white">
              <Tag size={18} />
            </div>
            <div>
              <div
                className={`tw:text-sm tw:font-bold tw:flex tw:items-center tw:gap-1 ${
                  isPromotionalDeal ? "tw:text-purple-900" : "tw:text-gray-700"
                }`}
              >
                Promotional Deal
                <AppPopover triggerContent={<Info size={12} />}>
                  <div className="tw:text-sm tw:font-bold">
                    What is Promotional Deal?
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    Promotional deal allows you to offer a discount on the
                    product.
                  </div>
                </AppPopover>
              </div>
            </div>
          </div>

          <div className="tw:flex tw:items-center tw:gap-2">
            <AppSwitch
              checked={isPromotionalDeal}
              onCheckedChange={(checked) => {
                if (!isB2bConfigured) {
                  toast.show({
                    msg: "Please configure B2B margin first",
                    color: "error",
                  });
                  return;
                }

                setAppAlertDialog({
                  title: "Promotional Deal",
                  description:
                    "Are you sure you want to update the promotional deal configuration?",
                  confirmText: checked ? "Enable" : "Disable",
                  cancelText: "Cancel",
                  show: true,
                  action: checked ? "update" : "cancel",
                });
              }}
              disabled={loading}
              label={
                <span
                  className={`tw:text-[10px] tw:font-bold tw:uppercase ${isPromotionalDeal ? "tw:text-purple-600" : "tw:text-gray-400"}`}
                >
                  {isPromotionalDeal ? "Active" : "Disabled"}
                </span>
              }
            />
            {loading && (
              <div className="tw:w-3 tw:h-3 tw:border-2 tw:border-purple-600 tw:border-t-transparent tw:rounded-full tw:animate-spin" />
            )}
          </div>
        </div>
      </div>

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        onConfirm={() => alertSuccessCb()}
        onCancel={() => alertCancelCb()}
        type="confirm"
        okText={appAlertDialog.confirmText}
        cancelText={appAlertDialog.cancelText}
      />
    </>
  );
};

export default PromotionalDealConfig;
