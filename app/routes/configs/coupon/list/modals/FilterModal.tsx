import { sub } from "date-fns";
import { useCallback, useEffect } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppModal from "~/components/core/modal/AppModal";
import MiscService from "~/services/MiscService";
import type { CouponFilterFields } from "../components/Filter";

const defaultFilter: CouponFilterFields = {
  search: "",
  applicableFor: "",
  discountKind: "",
  status: "",
  isActive: "",
  validityRange: [],
};

// shadcn/Radix Select rejects empty-string item values, so the "All" option
// uses a sentinel and we map it back to "" (no filter) in the handlers.
const ALL = "ALL";

const applicableForOptions = [
  { label: "All", value: ALL },
  { label: "B2C", value: "B2C" },
  { label: "B2B", value: "B2B" },
];

const discountKindOptions = [
  { label: "All Discounts", value: ALL },
  { label: "Percent", value: "PERCENT" },
  { label: "Fixed", value: "FLAT" },
];

const statusOptions = [
  { label: "All", value: ALL },
  { label: "Upcoming", value: "Approved" },
  { label: "Running", value: "Running" },
  { label: "Completed", value: "Completed" },
];

const activeOptions = [
  { label: "All", value: ALL },
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

type Props = {
  show: boolean;
  callback: (a: { data: CouponFilterFields; action: string }) => void;
  data: Partial<CouponFilterFields>;
};

const FilterModal = ({ show, callback, data }: Props) => {
  const { control, handleSubmit, reset } = useForm<CouponFilterFields>({
    defaultValues: { ...defaultFilter },
  });

  useEffect(() => {
    if (show) {
      reset({ ...defaultFilter, ...data });
    }
  }, [show, reset, data]);

  const onSubmit = useCallback(
    (formData: CouponFilterFields) => {
      callback({ data: formData, action: "apply" });
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
        <div className="tw:text-lg tw:font-semibold">Filters</div>
      </AppModal.Title>
      <AppModal.Content>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="tw:grid tw:grid-cols-1 tw:gap-4">
            <Controller
              control={control}
              name="validityRange"
              render={({ field }) => (
                <AppDateInput
                  callback={(v) => field.onChange(Array.isArray(v) ? v : [v])}
                  value={field.value}
                  dateConfig={dateConfig}
                  size="sm"
                  placeholder="Validity date range (from - to)"
                  label="Validity Range"
                />
              )}
            />

            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
              <Controller
                control={control}
                name="applicableFor"
                render={({ field }) => (
                  <AppSelect
                    options={applicableForOptions}
                    value={field.value || ALL}
                    onChange={(v) => field.onChange(v === ALL ? "" : v)}
                    placeholder="Applicable For"
                    inputClassName="tw:w-full"
                    label="Applicable For"
                  />
                )}
              />

              <Controller
                control={control}
                name="discountKind"
                render={({ field }) => (
                  <AppSelect
                    options={discountKindOptions}
                    value={field.value || ALL}
                    onChange={(v) => field.onChange(v === ALL ? "" : v)}
                    placeholder="Discount Kind"
                    inputClassName="tw:w-full"
                    label="Discount Kind"
                  />
                )}
              />
            </div>

            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mt-2">
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <AppSelect
                    options={statusOptions}
                    value={field.value || ALL}
                    onChange={(v) => field.onChange(v === ALL ? "" : v)}
                    placeholder="Status"
                    inputClassName="tw:w-full"
                    label="Status"
                  />
                )}
              />

              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <AppSelect
                    options={activeOptions}
                    value={field.value || ALL}
                    onChange={(v) => field.onChange(v === ALL ? "" : v)}
                    placeholder="Active / Inactive"
                    inputClassName="tw:w-full"
                    label="Active / Inactive"
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

const dateConfig: DayPickerProps = {
  mode: "range",
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

export default FilterModal;
