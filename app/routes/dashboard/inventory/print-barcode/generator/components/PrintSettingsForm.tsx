import { Copy } from "lucide-react";
import { AppInput, AppSelect } from "~/components/core/form";
import { useFormContext, useWatch } from "react-hook-form";
import {
  printTypeOptions,
  priceTypeOptions,
  sizeOptionsMap,
  templateOptions,
  type PriceType,
} from "~/services/PrintBarcodeService";

export type PrintSettingsValue = {
  printType: string;
  size: string;
  template: string;
  priceType: PriceType;
  quantity: number | null;
};

type Props = {
  callback: (a: { action: string; data?: any }) => void;
  className?: string;
  compact?: boolean;
  /** Hide the global "Number of copies" field (e.g. bulk mode sets copies per product). */
  hideQuantity?: boolean;
};

const PrintSettingsForm: React.FC<Props> = ({
  callback,
  className = "",
  compact = false,
  hideQuantity = false,
}) => {
  const {
    control,
    getValues,
    register,
    setValue,
  } = useFormContext<PrintSettingsValue>();
  const watchedValue = useWatch({ control }) as PrintSettingsValue | undefined;
  const value = watchedValue ?? (getValues() as PrintSettingsValue);

  const sizeOptions = sizeOptionsMap[value.printType] || [];

  const emit = (next: PrintSettingsValue) => {
    callback({ action: "change", data: next });
  };

  const onPrintTypeChange = (v: string) => {
    const firstSize = sizeOptionsMap[v]?.[0]?.value || "";
    const next = { ...value, printType: v, size: firstSize };
    setValue("printType", v, { shouldDirty: true });
    setValue("size", firstSize, { shouldDirty: true });
    emit(next);
  };

  const onSizeChange = (v: string) => {
    const next = { ...value, size: v };
    setValue("size", v, { shouldDirty: true });
    emit(next);
  };

  const onTemplateChange = (v: string) => {
    const next = { ...value, template: v };
    setValue("template", v, { shouldDirty: true });
    emit(next);
  };

  const onPriceTypeChange = (v: string) => {
    const next = { ...value, priceType: v as PriceType };
    setValue("priceType", v as PriceType, { shouldDirty: true });
    emit(next);
  };

  const handleQtyInput = () => {
    const qty = getValues("quantity");
    if (qty === null || qty === undefined) {
      setValue("quantity", 1, { shouldDirty: true });
      emit({ ...value, quantity: 1 });
      return;
    }

    const num = Number(qty);
    if (num <= 0) {
      setValue("quantity", null, { shouldDirty: true });
      emit({ ...value, quantity: null });
      return;
    }

    const nextQty = Number.isInteger(num) ? num : Math.floor(num);
    if (nextQty !== num) {
      setValue("quantity", nextQty, { shouldDirty: true });
    }
    emit({ ...value, quantity: nextQty });
  };

  return (
    <div className={className}>
      <div className={compact ? "tw:space-y-3" : "tw:space-y-4"}>
        <div className="tw:grid tw:grid-cols-2 tw:gap-2">
          <div className="tw:col-span-2">
            <AppSelect
              label="Print Type"
              options={printTypeOptions}
              value={value.printType}
              onChange={onPrintTypeChange}
              inputClassName="tw:w-full"
            />
          </div>
          <AppSelect
            label="Size"
            options={sizeOptions}
            value={value.size}
            onChange={onSizeChange}
            inputClassName="tw:w-full"
          />
          <AppSelect
            label="Template"
            options={templateOptions}
            value={value.template}
            onChange={onTemplateChange}
            inputClassName="tw:w-full"
          />
          {value.template === "retail" && (
            <AppSelect
              label="Price Type"
              options={priceTypeOptions}
              value={value.priceType}
              onChange={onPriceTypeChange}
              inputClassName="tw:w-full"
            />
          )}
        </div>

        {!hideQuantity && (
          <div className="tw:max-w-[180px]">
            <AppInput
              name="quantity"
              label="Number of copies"
              type="number"
              register={register}
              className="tw:w-full"
              leftIcon={<Copy size={14} className="tw:text-gray-600" />}
              onChange={handleQtyInput}
              isRequired
              min={1}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintSettingsForm;
