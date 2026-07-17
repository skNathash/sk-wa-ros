import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Info, Sparkles } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import AppButton from "~/components/core/button/AppButton";
import type { InvoiceItem, ItemFormData, SimilarDeal } from "../types";
import { calcDiscountPercent, calcPriceFromDiscount } from "../helper";

interface EditItemModalProps {
  show: boolean;
  item: InvoiceItem | null;
  callback: (params: {
    action: string;
    data?: ItemFormData;
    selectedDeal?: SimilarDeal;
  }) => void;
}

const EditItemModal = ({ show, item, callback }: EditItemModalProps) => {
  const [selectedDeal, setSelectedDeal] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<ItemFormData>({
    defaultValues: {
      name: "",
      hsn: "",
      barcode: "",
      price: 0,
      mrp: 0,
      discount: 0,
      qty: 0,
      tax: 0,
    },
  });

  useEffect(() => {
    if (show && item) {
      const sel = item.selected;
      const initMrp = sel?.mrp ?? item.mrp;
      const initPrice = sel?.price ?? item.price;
      reset({
        name: sel?.dealName ?? item.name,
        hsn: (sel?.hsn ?? item.hsn) || "",
        barcode: sel?.barcode ?? item.barcode,
        price: initPrice,
        mrp: initMrp,
        // Discount % derived from MRP and price.
        discount: calcDiscountPercent(initMrp, initPrice),
        qty: sel?.qty ?? item.qty,
        tax:
          sel?.gst ??
          (item.cgstPercent || 0) +
            (item.sgstPercent || 0) +
            (item.igstPercent || 0),
      });
      setSelectedDeal("");
    }
  }, [show, item, reset]);

  const onSubmit = (data: ItemFormData) => {
    const deal = item?.similarDeals?.find((d) => d.dealId === selectedDeal);
    callback({ action: "submit", data, selectedDeal: deal });
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleDealSelect = (dealId: string) => {
    setSelectedDeal(dealId);
    const deal = item?.similarDeals?.find((d) => d.dealId === dealId);
    if (deal) {
      setValue("name", deal.dealName);
      setValue("barcode", deal.barcode);
    }
  };

  const toNum = (v: unknown) => {
    const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
    return isNaN(n) ? 0 : n;
  };

  const clampNonNeg =
    (field: keyof ItemFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = toNum(e.target.value);
      if (n < 0) setValue(field, 0, { shouldValidate: true });
    };

  const handleMrpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toNum(e.target.value);
    const mrp = Math.max(0, raw);
    if (raw !== mrp) setValue("mrp", mrp, { shouldValidate: true });
    let price = toNum(getValues("price"));
    // If MRP drops below the price, cap the price at the new MRP.
    if (mrp < price) {
      price = mrp;
      setValue("price", price, { shouldValidate: true });
    }
    // Discount % is derived from MRP and price.
    setValue("discount", calcDiscountPercent(mrp, price), {
      shouldValidate: true,
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toNum(e.target.value);
    const price = Math.max(0, raw);
    if (raw !== price) setValue("price", price, { shouldValidate: true });
    const mrp = toNum(getValues("mrp"));
    setValue("discount", calcDiscountPercent(mrp, price), {
      shouldValidate: true,
    });
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toNum(e.target.value);
    const discount = Math.min(100, Math.max(0, raw));
    if (raw !== discount)
      setValue("discount", discount, { shouldValidate: true });
    const mrp = toNum(getValues("mrp"));
    // Price is derived from MRP and the discount %.
    setValue("price", calcPriceFromDiscount(mrp, discount), {
      shouldValidate: true,
    });
  };

  const dealOptions =
    item?.similarDeals?.map((deal) => ({
      value: deal.dealId,
      label: deal.dealName,
    })) || [];

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-w-lg">
      <AppModal.Title onClose={handleClose}>Edit Item</AppModal.Title>
      <AppModal.Content>
        <div className="tw:flex tw:items-start tw:gap-1.5 tw:text-[11px] tw:text-gray-500 tw:bg-gray-50 tw:rounded-md tw:px-2.5 tw:py-2 tw:mb-3">
          <Info size={13} className="tw:text-gray-400 tw:shrink-0 tw:mt-0.5" />
          <span>
            Review and correct AI-detected values. Pick a suggested deal to
            auto-fill name and barcode.
          </span>
        </div>
        <form
          id="edit-item-form"
          onSubmit={handleSubmit(onSubmit)}
          className="tw:space-y-3"
        >
          {dealOptions.length > 0 && (
            <div className="tw:bg-purple-50 tw:border tw:border-purple-200 tw:rounded-lg tw:p-3 tw:space-y-2 tw:overflow-hidden">
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-medium tw:text-purple-700">
                <Sparkles size={14} />
                StoreKing Suggested Deals
              </div>
              <div className="tw:min-w-0">
                <Controller
                  control={control}
                  name="name"
                  render={() => (
                    <AppSelect
                      label="Select a deal"
                      options={dealOptions}
                      value={selectedDeal}
                      onChange={(val) => handleDealSelect(val as string)}
                      placeholder="Choose from suggested deals"
                      size="sm"
                    />
                  )}
                />
              </div>
            </div>
          )}

          <AppInput
            name="name"
            label="Item Name"
            register={register}
            rules={{ required: "Item name is required" }}
            error={errors.name?.message}
            isRequired
          />
          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <AppInput
              name="hsn"
              label="HSN"
              register={register}
              error={errors.hsn?.message}
            />
            <AppInput
              name="barcode"
              label="Barcode"
              register={register}
              error={errors.barcode?.message}
            />
          </div>
          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <AppInput
              name="price"
              label="Price"
              type="number"
              step="any"
              register={register}
              rules={{ required: "Price is required", min: { value: 0, message: "Must be ≥ 0" } }}
              error={errors.price?.message}
              onChange={handlePriceChange}
              isRequired
            />
            <AppInput
              name="mrp"
              label="MRP"
              type="number"
              step="any"
              register={register}
              rules={{ required: "MRP is required", min: { value: 0, message: "Must be ≥ 0" } }}
              error={errors.mrp?.message}
              onChange={handleMrpChange}
              isRequired
            />
          </div>
          <div className="tw:grid tw:grid-cols-3 tw:gap-3">
            <AppInput
              name="discount"
              label="Discount %"
              type="number"
              step="any"
              register={register}
              rules={{
                min: { value: 0, message: "Must be ≥ 0" },
                max: { value: 100, message: "Must be ≤ 100" },
              }}
              error={errors.discount?.message}
              onChange={handleDiscountChange}
            />
            <AppInput
              name="qty"
              label="Quantity"
              type="number"
              register={register}
              rules={{ required: "Qty is required", min: { value: 0, message: "Must be ≥ 0" } }}
              error={errors.qty?.message}
              onChange={clampNonNeg("qty")}
              isRequired
            />
            <AppInput
              name="tax"
              label="Tax %"
              type="number"
              step="any"
              register={register}
              rules={{ min: { value: 0, message: "Must be ≥ 0" } }}
              error={errors.tax?.message}
              onChange={clampNonNeg("tax")}
            />
          </div>
        </form>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton size="small" color="light" onClick={handleClose}>
            Cancel
          </AppButton>
          <AppButton
            size="small"
            color="primary"
            type="submit"
            form="edit-item-form"
          >
            Save
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default EditItemModal;
