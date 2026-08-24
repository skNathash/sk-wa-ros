import { Info, ShoppingCart } from "lucide-react";
import React, { useState } from "react";
import { useSearchParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppSwitch from "~/components/core/form/AppSwitch";
import AppPopover from "~/components/core/popover/AppPopover";
import { MAX_RESERVE_QTY } from "~/constants";
import useAppToast from "~/hooks/useAppToast";
import SellerCatalogService from "~/services/SellerCatalogService";

interface ReserveConfigProps {
  dealId: string;
  isReserve: boolean;
  sellerDealObjId: string;
}

const ReserveConfig: React.FC<ReserveConfigProps> = ({
  dealId,
  isReserve,
  sellerDealObjId,
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
      const response: any = await SellerCatalogService.updateReserveConfig({
        configType: "Deal",
        dealId,
        sellerDealObjId: dealId,
        isActive: checked,
        maxReserveQty: checked ? MAX_RESERVE_QTY : 0,
        remarks: `${checked ? "Enable" : "Disable"} reserve for specific deal`,
      });

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        toast.show({
          msg:
            response?.message ||
            `Reserve ${checked ? "enabled" : "disabled"} successfully`,
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
          msg: response?.message || "Failed to update reserve configuration",
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
          isReserve
            ? "tw:bg-blue-50 tw:border-blue-100"
            : "tw:bg-gray-50 tw:border-gray-100"
        }`}
      >
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
          <div className="tw:flex tw:items-center tw:gap-3">
            <div className="tw:p-2 tw:rounded-lg tw:bg-blue-600 tw:text-white">
              <ShoppingCart size={18} />
            </div>
            <div>
              <div
                className={`tw:text-sm tw:font-bold tw:flex tw:items-center tw:gap-1 ${
                  isReserve ? "tw:text-blue-900" : "tw:text-gray-700"
                }`}
              >
                Reserve Mode
                <AppPopover triggerContent={<Info size={12} />}>
                  <div className="tw:text-sm tw:font-bold">
                    What is Reserve Mode?
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    Reserve mode allows you to accept upcoming orders even when
                    the stock is low.
                  </div>
                </AppPopover>
              </div>
              <div className="tw:text-[11px] tw:text-gray-500">
                {isReserve
                  ? "Accepted for upcoming orders"
                  : "Reserve ordering is disabled"}
              </div>
            </div>
          </div>

          <div className="tw:flex tw:items-center tw:gap-2">
            <AppSwitch
              checked={isReserve}
              onCheckedChange={(checked) =>
                setAppAlertDialog({
                  title: "Reserve Mode",
                  description: `Are you sure you want to ${checked ? "enable" : "disable"} reserve mode?`,
                  confirmText: checked ? "Enable" : "Disable",
                  cancelText: "Cancel",
                  show: true,
                  action: checked ? "update" : "cancel",
                })
              }
              disabled={loading}
              label={
                <span
                  className={`tw:text-[10px] tw:font-bold tw:uppercase ${isReserve ? "tw:text-blue-600" : "tw:text-gray-400"}`}
                >
                  {isReserve ? "Active" : "Disabled"}
                </span>
              }
            />
            {loading && (
              <div className="tw:w-3 tw:h-3 tw:border-2 tw:border-blue-600 tw:border-t-transparent tw:rounded-full tw:animate-spin" />
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

export default ReserveConfig;
