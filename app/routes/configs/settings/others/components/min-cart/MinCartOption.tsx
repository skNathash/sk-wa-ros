import React, { useEffect, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import { IndianRupee, History, Save, ShoppingCart } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import { AppCheckbox } from "~/components/core/form/AppCheckbox";
import FranchiseService from "~/services/FranchiseService";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import { useForm, Controller } from "react-hook-form";

type ActionPayload = {
  action: string;
  data?: any;
};

type Props = {
  configType: string;
  title?: string;
  subtitle?: string;
  initialValue?: string | number;
  initialAutoApprove?: boolean;
  onAction: (p: ActionPayload) => void;
};

const MinCartOption: React.FC<Props> = ({
  configType,
  title,
  subtitle,
  initialValue,
  initialAutoApprove,
  onAction,
}) => {
  const toast = useAppToast();
  const { register, handleSubmit, setValue, control, formState } = useForm<{
    amount: string;
    autoApprove: boolean;
  }>({
    defaultValues: {
      amount:
        typeof initialValue !== "undefined" && initialValue !== null
          ? String(initialValue)
          : "",
      autoApprove: initialAutoApprove || false,
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof initialValue !== "undefined" && initialValue !== null) {
      setValue("amount", String(initialValue));
    }
    if (typeof initialAutoApprove !== "undefined") {
      setValue("autoApprove", initialAutoApprove);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue, initialAutoApprove]);

  const franchiseId = AuthService.getLoggedInUserId();

  const validateAndSubmit = async (data: {
    amount: string;
    autoApprove: boolean;
  }) => {
    const val = Number(data.amount || 0);
    if (Number.isNaN(val) || val < 0) {
      toast.show({
        msg: `Please enter a valid non-negative amount`,
        color: "error",
      });
      onAction({ action: "error", data: { message: "Invalid amount" } });
      return;
    }

    try {
      setLoading(true);
      const r = await FranchiseService.getFranchiseSettings({
        configType,
      });

      const existing = r?.data?.data;
      const payload: any = {
        franchiseId,
        configType,
        configValue: {
          ...(existing && existing.configValue ? existing.configValue : {}),
        },
      };

      payload.configValue.minOrderAmount = val;
      payload.configValue.autoApprove = data.autoApprove;

      const upd = await FranchiseService.updateFranchiseSettings(payload);
      if (upd.statusCode === 200) {
        setValue("amount", String(val));
        toast.show({ msg: "Minimum cart updated", color: "success" });
        onAction({
          action: "saved",
          data: { configType, minOrderAmount: val, response: upd },
        });
      } else {
        const msg = upd?.data?.message || "Failed to update minimum cart";
        toast.show({ msg, color: "error" });
        onAction({ action: "error", data: { message: msg } });
      }
    } catch (e: any) {
      toast.show({
        msg: e?.message || "Error updating setting",
        color: "error",
      });
      onAction({ action: "error", data: { message: e?.message } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppCard title={title} subtitle={subtitle} icon={<ShoppingCart />}>
      <form
        onSubmit={handleSubmit(validateAndSubmit)}
        className="tw:flex tw:flex-col tw:gap-3"
      >
        {/* Minimum Cart Amount Input */}
        <div className="tw:space-y-1">
          <label className="tw:text-sm tw:font-medium tw:text-gray-700 tw:flex tw:items-center tw:gap-1">
            Minimum Cart Amount
            <span className="tw:text-xs tw:text-gray-500 tw:font-normal">
              ({configType.includes("B2B") ? "B2B" : "B2C"})
            </span>
          </label>
          <AppInput
            name="amount"
            label=""
            placeholder="0"
            className="tw:flex-1"
            inputClassName="tw:w-full"
            leftIcon={<IndianRupee size={16} className="tw:text-gray-500" />}
            type="number"
            register={register}
          />
        </div>

        {/* Auto Approve Option */}
        <Controller
          name="autoApprove"
          control={control}
          render={({ field }) => (
            <div className="tw:bg-gray-50 tw:rounded-lg tw:p-3 tw:space-y-1">
              <AppCheckbox
                label="Auto-approve orders"
                value={field.value}
                onChange={field.onChange}
              />
              <p className="tw:text-xs tw:text-gray-600 tw:ml-6 tw:leading-relaxed">
                When ticked, orders will be auto-approved
              </p>
            </div>
          )}
        />

        {/* Action Buttons */}
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:pt-1">
          <AppButton
            type="button"
            color="light"
            fill="outline"
            size="small"
            onClick={() =>
              onAction({ action: "openLogs", data: { configType } })
            }
          >
            <History size={14} />
            View History
          </AppButton>

          <AppButton
            type="submit"
            size="small"
            disabled={loading || formState.isSubmitting}
          >
            <Save size={14} />
            {loading ? "Saving..." : "Save Changes"}
          </AppButton>
        </div>
      </form>
    </AppCard>
  );
};

export default MinCartOption;
