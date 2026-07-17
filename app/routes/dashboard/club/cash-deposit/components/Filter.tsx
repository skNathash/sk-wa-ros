import { Controller, useForm } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppSelect } from "~/components/core/form/AppSelect";
import { debounce } from "lodash";
import type { Options } from "flatpickr/dist/types/options";

type Props = {
  callback: (a: { action: string; formData: any }) => void;
};

const dateOptions: Options = {
  mode: "range",
  dateFormat: "Y-m-d",
  maxDate: new Date(),
};

const paymentModesOptions = [
  {
    label: "All Payment Modes",
    value: "",
  },
  {
    label: "Cash",
    value: "CASH",
  },
  {
    label: "UPI",
    value: "UPI",
  },
  {
    label: "Purchase",
    value: "PURCHASE",
  },
];

const statusOptions = [
  {
    label: "All Status",
    value: "",
  },
  {
    label: "Deposit pending",
    value: "Created",
  },
  {
    label: "Approval Pending ",
    value: "PendingApproval",
  },
  {
    label: "Rejected",
    value: "ProofPending",
  },
  {
    label: "Approved",
    value: "Approved",
  },
];

const Filter = ({ callback }: Props) => {
  const { register, control, getValues } = useForm();

  const triggerCallback = () => {
    callback({
      action: "submit",
      formData: getValues(),
    });
  };

  const handleDateRangeChange =
    (chngFn: (dt: Date | Date[]) => void) => (dt: Date | Date[]) => {
      chngFn(dt);
      triggerCallback();
    };

  const handleSearch = debounce((e: any) => {
    triggerCallback();
  }, 500);

  return (
    <AppCard>
      <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-center tw:gap-2">
        <AppInput
          name="search"
          placeholder="Search"
          register={register}
          onChange={handleSearch}
          size="sm"
          className="tw:w-full"
        />
        <Controller
          control={control}
          name="dateRange"
          render={({ field }) => (
            <AppDateInput
              callback={handleDateRangeChange(field.onChange)}
              value={field.value}
              size="sm"
              placeholder="Select Date Range"
              dateConfig={dateOptions}
              className="tw:w-full"
            />
          )}
        />
        <AppSelect
          name="status"
          options={statusOptions}
          register={register}
          onChange={triggerCallback}
          size="sm"
          placeholder="Status"
          className="tw:w-full"
        />

        <AppSelect
          name="paymentModes"
          options={paymentModesOptions}
          register={register}
          onChange={triggerCallback}
          size="sm"
          placeholder="Payment Mode"
          className="tw:w-full"
        />
      </div>
    </AppCard>
  );
};

export default Filter;
