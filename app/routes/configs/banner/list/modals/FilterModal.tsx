import { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { DayPickerProps } from "react-day-picker";
import { sub } from "date-fns";
import AppModal from "~/components/core/modal/AppModal";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppSelect } from "~/components/core/form";
import AppButton from "~/components/core/button/AppButton";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "Approved", label: "Approved" },
  { value: "Pending", label: "Pending" },
  { value: "Rejected", label: "Rejected" },
];

export const defaultFilterData = {
  validityDateRange: undefined as Date[] | undefined,
  createdDateRange: undefined as Date[] | undefined,
  status: "all",
};

type Props = {
  show: boolean;
  initialData: Record<string, any>;
  callback: (payload: { action: string; data: any }) => void;
};

const FilterModal = ({ show, initialData, callback }: Props) => {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: { ...defaultFilterData },
  });

  useEffect(() => {
    if (show) {
      reset({ ...defaultFilterData, ...initialData });
    }
  }, [show, reset, initialData]);

  const onSubmit = useCallback(
    (data: any) => {
      callback({ action: "apply", data });
    },
    [callback],
  );

  const handleReset = useCallback(() => {
    reset({ ...defaultFilterData });
    callback({ action: "reset", data: { ...defaultFilterData } });
  }, [reset, callback]);

  const handleClose = () => {
    callback({ action: "close", data: {} });
  };

  return (
    <AppModal show={show} callback={handleClose} className="offcanvas-modal">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">Filters</div>
      </AppModal.Title>
      <AppModal.Content className="modal-bg ion-padding">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="tw:grid tw:grid-cols-1 tw:gap-4">
            <Controller
              control={control}
              name="validityDateRange"
              render={({ field }) => (
                <AppDateInput
                  callback={(v) => field.onChange(Array.isArray(v) ? v : [v])}
                  value={field.value}
                  dateConfig={dateRangeConfig}
                  size="sm"
                  placeholder="Select validity date range"
                  label="Validity Date Range"
                />
              )}
            />

            <Controller
              control={control}
              name="createdDateRange"
              render={({ field }) => (
                <AppDateInput
                  callback={(v) => field.onChange(Array.isArray(v) ? v : [v])}
                  value={field.value}
                  dateConfig={createdDateConfig}
                  size="sm"
                  placeholder="Select created on date range"
                  label="Created On Date Range"
                />
              )}
            />

            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <AppSelect
                  options={statusOptions}
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  placeholder="Select Status"
                  label="Status"
                  size="sm"
                  inputClassName="tw:w-full"
                />
              )}
            />
          </div>
        </form>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:w-full tw:justify-end tw:gap-2 tw:p-2">
          <AppButton
            onClick={handleReset}
            color="light"
            fill="outline"
            size="small"
          >
            Reset
          </AppButton>
          <AppButton
            onClick={handleSubmit(onSubmit)}
            color="primary"
            size="small"
          >
            Apply
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

const dateRangeConfig: DayPickerProps = {
  mode: "range",
  startMonth: sub(new Date(), { years: 10 }),
};

const createdDateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
};

export default FilterModal;
