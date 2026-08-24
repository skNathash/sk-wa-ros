import { Controller, useFormContext, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import useAppToast from "~/hooks/useAppToast";
import UomPriceService from "~/services/UomPriceService";
import { UOM_OPTIONS, type SubscribeFormData } from "../helper";

type StockFormProps = {
  /** Which price the entered selling price configures. */
  type?: "b2b" | "b2c";
  saving?: boolean;
  disabled?: boolean;
  /** Named step of the in-flight subscribe sequence, shown on the button. */
  step?: string;
  onSubmit: (data: SubscribeFormData) => void;
};

/**
 * Stock & price capture — a subscribed product still can't be billed without
 * both, so they are taken here in one go. Reads its form off the
 * `FormProvider` the modal wraps around it.
 */
const StockForm = ({
  type = "b2c",
  saving = false,
  disabled = false,
  step = "",
  onSubmit,
}: StockFormProps) => {
  const appToast = useAppToast();
  const { register, control, handleSubmit, setValue, getValues } =
    useFormContext<SubscribeFormData>();

  const uom = useWatch({ control, name: "uom" });
  // gm/ml products are priced and stocked per kg/ltr in the form; the API wants
  // the base unit, so everything converts on submit.
  const isSmallUom = UomPriceService.isSmallUom(uom);
  const displayUom = UomPriceService.getDisplayUom(uom) || "unit";

  const clearField = (field: keyof SubscribeFormData) =>
    setValue(field, "" as any, { shouldValidate: false });

  // Typing a minus sign is simply not allowed on any of the numeric fields.
  const blockNegative =
    (field: keyof SubscribeFormData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (value !== "" && Number(value) < 0) clearField(field);
    };

  // MRP is the ceiling for the purchase price, so the two inputs police each
  // other as they are typed — the offending value is cleared right away
  // instead of only failing on submit.
  const handlePurchasePriceChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    if (value === "") return;
    const purchasePrice = Number(value);
    const mrp = Number(getValues("mrp"));
    if (purchasePrice < 0) {
      clearField("purchasePrice");
      return;
    }
    if (mrp > 0 && purchasePrice > mrp) {
      clearField("purchasePrice");
      appToast.show({
        msg: "Purchase price cannot be greater than MRP",
        color: "danger",
      });
    }
  };

  // Lowering the MRP below a purchase price that is already entered drops that
  // purchase price — the MRP the operator just typed is the one they meant.
  const handleMrpChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === "") return;
    const mrp = Number(value);
    if (mrp < 0) {
      clearField("mrp");
      return;
    }
    const purchasePrice = Number(getValues("purchasePrice"));
    if (purchasePrice > 0 && purchasePrice > mrp) {
      clearField("purchasePrice");
      appToast.show({
        msg: "Purchase price cannot be greater than MRP",
        color: "danger",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="tw:flex tw:flex-col tw:gap-3"
    >
      <div className="tw:grid tw:grid-cols-2 tw:gap-3">
        <Controller
          name="uom"
          control={control}
          render={({ field }) => (
            <AppSelect
              label="UOM"
              options={UOM_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              inputClassName="tw:w-full"
              isRequired
            />
          )}
        />

        <AppInput
          name="stock"
          label={`Stock (in ${displayUom})`}
          type="number"
          min={0}
          placeholder="0"
          register={register}
          onChange={blockNegative("stock")}
          isRequired
        />

        <AppInput
          name="mrp"
          label={`MRP (per ${displayUom})`}
          type="number"
          min={0}
          step="0.01"
          placeholder="0.00"
          register={register}
          onChange={handleMrpChange}
          isRequired
        />

        <AppInput
          name="purchasePrice"
          label={`Purchase price (per ${displayUom})`}
          type="number"
          min={0}
          step="0.01"
          placeholder="0.00"
          register={register}
          onChange={handlePurchasePriceChange}
          isRequired
        />

        <AppInput
          name="sellingPrice"
          label={`${type === "b2b" ? "B2B" : "B2C"} selling price (per ${displayUom})`}
          type="number"
          min={0}
          step="0.01"
          placeholder="0.00"
          register={register}
          onChange={blockNegative("sellingPrice")}
          isRequired
        />
      </div>

      {isSmallUom && (
        <p className="tw:text-[11px] tw:leading-snug tw:text-muted-foreground">
          Enter stock and prices per {displayUom} — they are saved per {uom}.
        </p>
      )}

      <AppButton
        type="submit"
        isLoading={saving}
        disabled={disabled}
        className="tw:w-full"
      >
        {saving && step ? step : "Subscribe & add stock"}
      </AppButton>
    </form>
  );
};

export default StockForm;
