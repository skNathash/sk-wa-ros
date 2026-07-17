import { useEffect, useState } from "react";
import { AppSelect } from "~/components/core/form";
import PaylaterService from "~/services/PaylaterService";
import useAppToast from "~/hooks/useAppToast";
import AppButton from "~/components/core/button/AppButton";
import { Save, Settings, AlertCircle } from "lucide-react";
import AppTextarea from "~/components/core/form/AppTextarea";
import { Controller, useForm, useWatch } from "react-hook-form";
import AuthService from "~/services/AuthService";
import InfoBlock from "~/components/core/info-blk/InfoBlock";

type WalletStatusProps = {
  status: string;
  userId: string;
  requestId: string;
  callback: (args: { action: "submit" | "close"; data?: any }) => void;
  routeType?: string;
};

const WALLET_STATUS_OPTIONS = [
  { value: "Approved", label: "Active - Allow transactions" },
  { value: "Paused", label: "Paused - Temporarily disabled" },
  { value: "Cancelled", label: "Stopped - Completely disabled" },
];

const WalletStatus = ({
  status,
  userId,
  requestId,
  callback,
  routeType,
}: WalletStatusProps) => {
  const appToast = useAppToast();

  const { control, register, setValue, getValues } = useForm();

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValue("status", status);
  }, [status]);

  const handleSubmit = async () => {
    const formData = getValues();

    const { status, remarks } = formData;

    if (!status) {
      appToast.show({
        msg: "Please select a status",
        color: "error",
      });
      return;
    }

    if (!remarks?.trim()) {
      appToast.show({
        msg: "Please enter remarks",
        color: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        userInfo: {
          id: userId,
          type: routeType === "b2b" ? "franchise" : "customer",
        },
        franchiseInfo: {
          id: AuthService.getLoggedInUserId(),
        },
        status,
        reason: remarks,
      };

      const res = await PaylaterService.updateStatus(requestId, payload);

      setSubmitting(false);

      if (res.statusCode === 200) {
        appToast.show({
          msg: "Wallet status updated successfully",
          color: "success",
        });
        callback({
          action: "submit",
          data: { status: status, remarks: remarks },
        });
      } else {
        appToast.show({
          msg: res.data?.message || "Failed to update wallet status",
          color: "error",
        });
      }
    } catch (error) {
      appToast.show({
        msg: "Failed to update wallet status",
        color: "error",
      });
    }
  };

  return (
    <div className="tw:space-y-4">
      {/* Status Selection Card */}
      <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:p-4">
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <div>
              <label className="tw:block tw:text-sm tw:font-semibold tw:text-gray-700 tw:mb-2">
                <span className="tw:flex tw:items-center tw:gap-2">
                  <Settings size={16} className="tw:text-blue-600" />
                  Wallet Status
                </span>
              </label>
              <AppSelect
                options={WALLET_STATUS_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                isRequired
                placeholder="Select wallet status"
                inputClassName="tw:w-full tw:bg-white"
              />
              <p className="tw:text-xs tw:text-gray-600 tw:mt-2 tw:leading-relaxed">
                Choose the new status for the wallet: Active allows
                transactions, Paused temporarily disables, Stopped completely
                disables access.
              </p>
            </div>
          )}
        />
      </div>

      {/* Remarks Card */}
      <div className="tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-lg tw:p-4">
        <label className="tw:block tw:text-sm tw:font-semibold tw:text-gray-700 tw:mb-2">
          <span className="tw:flex tw:items-center tw:gap-2">
            <AlertCircle size={16} className="tw:text-amber-600" />
            Reason for Change
          </span>
        </label>
        <AppTextarea
          name="remarks"
          isRequired
          register={register}
          rows={2}
          placeholder="Explain why you're changing the wallet status..."
          className="tw:text-sm"
          inputClassName="tw:bg-white"
        />
        <p className="tw:text-xs tw:text-gray-600 tw:mt-2">
          This will be recorded in the audit log
        </p>
      </div>

      {/* Action Button */}
      <div className="tw:flex tw:justify-end tw:pt-2">
        <AppButton
          onClick={handleSubmit}
          type="button"
          color="success"
          isLoading={submitting}
          className="tw:px-6"
        >
          <Save size={18} />
          Update Status
        </AppButton>
      </div>
    </div>
  );
};

export default WalletStatus;
