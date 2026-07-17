import clsx from "clsx";
import React from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import Amount from "~/components/core/amount/Amount";
import { AppInput, AppSelect } from "~/components/core/form";
import { priceModeOptions } from "../helper";

type Props = {
  showSchemePrice?: boolean;
  purchasePrice?: number;
  tax?: number;
  b2bPrice?: number;
  mrp?: number;
  restrictToMrp?: boolean;
};

const PriceForm: React.FC<Props> = ({
  showSchemePrice = false,
  mrp,
  restrictToMrp = false,
}) => {
  const { register, control, setValue } = useFormContext();

  const [priceValue, profit, type] = useWatch({
    name: ["price", "profit", "type"],
    control,
  });

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (v === "" || v === "-") {
      setValue("discount", "");
      return;
    }
    v = v.replace(/-/g, "");
    const num = Number(v);
    if (isNaN(num)) {
      setValue("discount", "");
      return;
    }
    const clamped = Math.min(Math.max(num, 0), 100);
    if (String(clamped) !== v) {
      e.target.value = String(clamped);
    }
    setValue("discount", clamped);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (v === "" || v === "-") {
      setValue("price", "");
      return;
    }
    v = v.replace(/-/g, "");
    const num = Number(v);
    if (isNaN(num)) {
      setValue("price", "");
      return;
    }
    const upper =
      restrictToMrp && typeof mrp === "number" ? mrp : Number.POSITIVE_INFINITY;
    const clamped = Math.min(Math.max(num, 0), upper);
    if (String(clamped) !== v) {
      e.target.value = String(clamped);
    }
    setValue("price", clamped);
  };

  return (
    <div className="tw:mb-4 tw:space-y-4">
      <div className="tw:grid tw:grid-cols-2 tw:gap-4">
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <AppSelect
              options={priceModeOptions}
              value={field.value}
              onChange={(v) => {
                field.onChange(v);
              }}
              size="sm"
              className="tw:mb-2"
              label="Price Type"
              inputClassName="tw:w-full"
              isRequired={true}
            />
          )}
        />

        {type === "on_mrp" ? (
          <AppInput
            name="discount"
            register={register}
            type="number"
            size="sm"
            placeholder="Enter discount %"
            className="tw:mb-2"
            label="Discount (%)"
            isRequired={true}
            onChange={handleDiscountChange}
          />
        ) : (
          <AppInput
            name="price"
            register={register}
            type="number"
            size="sm"
            placeholder="Enter price"
            className="tw:mb-2"
            label="Price"
            isRequired={true}
            onChange={handlePriceChange}
          />
        )}
      </div>

      {showSchemePrice && (
        <div className="tw:flex tw:items-center tw:gap-3 tw:mt-2 tw:py-2 tw:px-3 tw:rounded-md tw:bg-gray-50 dark:tw:bg-gray-800/50 tw:text-xs">
          <span className="tw:text-gray-500 dark:tw:text-gray-400">Price:</span>
          <Amount
            value={priceValue}
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
    </div>
  );
};

export default PriceForm;
