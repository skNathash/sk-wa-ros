import { sub } from "date-fns";
import { useCallback, useEffect } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppModal from "~/components/core/modal/AppModal";
import MiscService from "~/services/MiscService";
import OmsService from "~/services/OmsService";
import { defaultFilter } from "../helper";

const statusOptions = OmsService.getOrderStatuses().map((e) => ({
  label: e.name,
  value: e.value,
}));
statusOptions.unshift({ label: "All Statuses", value: "all" });

const paymentOptions = [
  { label: "All", value: "all", langKey: "all" },
  { label: "Paylater", value: "PAYLATER" },
  { label: "COD", value: "COD" },
  { label: "Prepaid", value: "PREPAID" },
];

const paymentStatusOptions = [
  { label: "All", value: "all" },
  { label: "Approval Pending", value: "Approval Pending" },
  { label: "Paid", value: "Paid" },
  { label: "Unpaid", value: "Unpaid" },
  { label: "Rejected", value: "Rejected" },
];

const orderSubTypeOptions = [
  { label: "All Orders", value: "all" },
  // { label: "CoinStore Orders", value: "COINSTORE" },
  { label: "POS Orders", value: "POS" },
  { label: "Walkin Orders", value: "WALKIN" },
  { label: "CLUB Orders", value: "CLUB" },
  { label: "Reserve Order", value: "RESERVE" },
];

type Props = {
  show: boolean;
  callback: (a: { data: any; action: string }) => void;
  data: Record<string, any>;
  hidePaymentStatus?: boolean;
};

const FilterModal = ({ show, callback, data, hidePaymentStatus }: Props) => {
  const { t } = useTranslation(["common"]);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: { ...defaultFilter },
  });

  useEffect(() => {
    if (show) {
      reset({ ...defaultFilter, ...data });
    }
  }, [show, reset, defaultFilter, data]);

  const onSubmit = useCallback(
    (data: any) => {
      callback({ data, action: "apply" });
    },
    [callback],
  );

  const handleReset = useCallback(() => {
    reset({ ...defaultFilter });
  }, [reset]);

  const handleClose = () => {
    callback({ data: defaultFilter, action: "close" });
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">{t("filters")}</div>
      </AppModal.Title>
      <AppModal.Content>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="tw:grid tw:grid-cols-1 tw:gap-4">
            <Controller
              control={control}
              name="dateRange"
              render={({ field }) => (
                <AppDateInput
                  callback={(v) => field.onChange(Array.isArray(v) ? v : [v])}
                  value={field.value}
                  dateConfig={dateConfig}
                  size="sm"
                  placeholder={t("selectDate")}
                  label="Date Range"
                />
              )}
            />

            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <AppSelect
                    options={statusOptions}
                    value={field.value}
                    onChange={(v) => field.onChange(v)}
                    placeholder={t("selectStatus")}
                    inputClassName="tw:w-full"
                    label="Status"
                  />
                )}
              />

              <Controller
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                  <AppSelect
                    options={paymentOptions}
                    value={field.value}
                    onChange={(v) => field.onChange(v)}
                    placeholder={t("selectPaymentMethod")}
                    inputClassName="tw:w-full"
                    label="Payment Method"
                  />
                )}
              />
            </div>

            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mt-2">
              {!hidePaymentStatus && (
                <Controller
                  control={control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <AppSelect
                      options={paymentStatusOptions}
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                      placeholder={t("selectPaymentStatus")}
                      inputClassName="tw:w-full"
                      label="Payment Status"
                    />
                  )}
                />
              )}

              <Controller
                control={control}
                name="orderSubType"
                render={({ field }) => (
                  <AppSelect
                    options={orderSubTypeOptions}
                    value={field.value}
                    onChange={(v) => field.onChange(v)}
                    placeholder={t("selectOrderSubType")}
                    inputClassName="tw:w-full"
                    label="Order Sub Type"
                  />
                )}
              />
            </div>
          </div>
        </form>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:w-full tw:justify-end tw:gap-2">
          <AppButton
            onClick={handleReset}
            color="light"
            fill="outline"
            size="small"
          >
            {t("reset")}
          </AppButton>
          <AppButton
            onClick={handleSubmit(onSubmit)}
            color="primary"
            size="small"
          >
            {t("apply")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

export default FilterModal;
