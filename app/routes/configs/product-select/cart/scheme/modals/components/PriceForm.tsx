import React, { useMemo } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { AppDateInput, AppInput, AppSelect } from "~/components/core/form";
import { calculateOnOptions } from "../../helper";
import Amount from "~/components/core/amount/Amount";
import clsx from "clsx";
import CommonService from "~/services/CommonService";

const today = new Date();
const startDateConfig: DayPickerProps = {
  defaultMonth: today,
  startMonth: today,
  disabled: { before: today },
};

type Props = {
  showSchemePrice?: boolean;
  purchasePrice?: number;
  tax?: number;
  b2bPrice?: number;
  additionalCess?: number;
};

const PriceForm: React.FC<Props> = ({
  showSchemePrice = false,
  purchasePrice = 0,
  tax = 0,
  b2bPrice = 0,
  additionalCess = 0,
}) => {
  const { register, control, getValues, setValue } = useFormContext();

  const [offerPrice, profit] = useWatch({
    name: ["schemePrice", "profit"],
    control,
  });

  const onDiscountChange = () => {
    const value = getValues("offerDiscount");
    if (value === null || value === undefined || value === "") {
      setValue("offerDiscount", null);
      return;
    }
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      setValue("offerDiscount", null);
      return;
    }
    if (num > 100) {
      setValue("offerDiscount", 100);
    }

    if (showSchemePrice) {
      const discount = getValues("offerDiscount");
      const schemePrice = CommonService.calculateScheme(
        b2bPrice,
        discount || 0,
        getValues("calculateOn") === "afterTax",
        tax,
        purchasePrice,
        additionalCess,
      );
      setValue("schemePrice", Number(schemePrice?.offerPrice || 0));
      setValue("profit", Number(schemePrice?.profit || 0));
    }
  };

  // Watch start date
  const offerStartDate = useWatch({ name: "offerStartDate", control });

  // End date config starts from selected start date
  const endDateConfig = useMemo(() => {
    if (!offerStartDate) {
      return {
        defaultMonth: today,
        startMonth: today,
        disabled: { before: today },
      };
    }
    return {
      defaultMonth: offerStartDate,
      startMonth: offerStartDate,
      disabled: { before: offerStartDate },
    };
  }, [offerStartDate]);

  const handleStartDateChange =
    (chgnFn: (date: Date[] | Date | null) => void) => (dt: Date | Date[]) => {
      chgnFn(dt || null);
      setValue("offerEndDate", dt || null);
    };

  return (
    <div className="tw:mb-4 tw:space-y-4">
      <div className="tw:grid tw:grid-cols-2 tw:gap-4">
        <AppInput
          name="offerDiscount"
          register={register}
          type="number"
          size="sm"
          placeholder="Enter discount (%)"
          isRequired={true}
          className="tw:mb-2"
          label="Scheme Discount (%)"
          onChange={onDiscountChange}
        />

        <Controller
          control={control}
          name="calculateOn"
          render={({ field }) => (
            <AppSelect
              options={calculateOnOptions}
              value={field.value}
              onChange={field.onChange}
              size="sm"
              placeholder="Select calculate on"
              isRequired={true}
              className="tw:mb-2"
              label="Calculate On"
              inputClassName="tw:w-full"
            />
          )}
        />
      </div>

      {showSchemePrice && (
        <div className="tw:flex tw:items-center tw:gap-3 tw:mt-2 tw:py-2 tw:px-3 tw:rounded-md tw:bg-gray-50 dark:tw:bg-gray-800/50 tw:text-xs">
          <span className="tw:text-gray-500 dark:tw:text-gray-400">
            Scheme price:
          </span>
          <Amount
            value={offerPrice}
            decimalPlaces={2}
            className="tw:font-semibold tw:text-primary"
          />
          <span className="tw:text-gray-300 dark:tw:text-gray-600">|</span>
          <span className="tw:text-gray-500 dark:tw:text-gray-400">
            Profit:
          </span>
          <Amount
            value={profit}
            decimalPlaces={2}
            className={clsx("tw:font-semibold", {
              "tw:text-green-600": profit >= 0,
              "tw:text-red-600": profit < 0,
            })}
          />
        </div>
      )}
      <div>
        <Controller
          control={control}
          name="offerStartDate"
          render={({ field }) => (
            <AppDateInput
              callback={handleStartDateChange(field.onChange)}
              value={field.value}
              label="From Date"
              placeholder="Select Date"
              className="tw:w-full"
              isRequired
              size="sm"
              dateConfig={startDateConfig}
            />
          )}
        />
      </div>
      <div>
        <Controller
          control={control}
          name="offerEndDate"
          render={({ field }) => (
            <AppDateInput
              callback={field.onChange}
              value={field.value}
              label="To Date"
              placeholder="Select Date"
              className="tw:w-full"
              isRequired
              size="sm"
              dateConfig={endDateConfig}
            />
          )}
        />
      </div>
    </div>
  );
};

export default PriceForm;
