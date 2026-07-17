import { add, sub } from "date-fns";
import { AlertCircle, Camera, Trash } from "lucide-react";
import { useRef, useState } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { Swiper, SwiperOptions } from "swiper/types";
import FileUpload from "~/components/core/file-upload/FileUpload";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import ImgRender from "~/components/core/img/ImgRender";
import AppSwiper from "~/components/core/swiper";
import LocationInput from "~/components/feature/inventory/location-input/LocationInput";
import ProductVariation from "./ProductVariation";

const swiperConfig: SwiperOptions = {
  breakpoints: {
    0: { slidesPerView: 1.5 }, // mobile
    768: { slidesPerView: 4 }, // desktop (md and up)
  },
};

type Props = {
  orderedQty: number;
  dealName?: string;
  productIndex: number;
};

const allowedExtensions = ["jpg", "jpeg", "png"];

const manufactureDateConfig: DayPickerProps = {
  defaultMonth: new Date(),
  disabled: { after: new Date(), before: sub(new Date(), { years: 10 }) },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
};

const expiryDateConfig: DayPickerProps = {
  defaultMonth: new Date(),
  disabled: { before: new Date(), after: add(new Date(), { years: 10 }) },
  startMonth: new Date(),
  endMonth: add(new Date(), { years: 10 }),
};

const ProductItemForm = ({ orderedQty, dealName, productIndex }: Props) => {
  const { t } = useTranslation();

  const { control, getValues, setValue, register } = useFormContext();

  const swiperRef = useRef<Swiper | null>(null);

  const [damageQty, receivedQty, damageDocs] = useWatch({
    control,
    name: [
      `products.${productIndex}.formData.damageQty`,
      `products.${productIndex}.formData.receivedQty`,
      `products.${productIndex}.formData.damageDocs`,
    ],
  });

  const handleNonNegativeNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
    additionalCallback?: () => void
  ) => {
    let value = e.target.value;
    const numValue = Number(value);

    if (numValue < 0) {
      value = "";
    }

    // Get current values for validation
    const currentReceivedQty =
      getValues(`products.${productIndex}.formData.receivedQty`) || 0;
    const currentInvoiceQty =
      getValues(`products.${productIndex}.formData.invoiceQty`) || 0;

    // Apply validation rules based on field type
    let finalValue = Number(value) || 0;

    if (fieldName === "invoiceQty") {
      // Allow invoice quantity to be greater than ordered quantity.
      // No cap applied here so users can enter invoiceQty > orderedQty.
    } else if (fieldName === "receivedQty") {
      // Received qty cannot exceed invoice quantity (if provided).
      // If invoiceQty is not provided (0 or falsy), fall back to orderedQty.
      const cap = currentInvoiceQty > 0 ? currentInvoiceQty : orderedQty;
      if (finalValue > cap) {
        finalValue = cap;
      }
    } else if (fieldName === "damageQty") {
      // Damaged qty cannot exceed the received qty
      // This ensures damaged qty doesn't exceed the total quantity received
      if (finalValue > currentReceivedQty) {
        finalValue = currentReceivedQty;
      }
    }

    setValue(`products.${productIndex}.formData.${fieldName}`, finalValue);

    if (additionalCallback) {
      additionalCallback();
    }
  };

  const handleLocationChange = ({
    location,
    locationDetail,
    rack,
    rackDetails,
    bin,
    binDetails,
  }: {
    location: string;
    locationDetail: any;
    rack: string;
    rackDetails: any;
    bin: string;
    binDetails: any;
  }) => {
    setValue(`products.${productIndex}.formData.location`, location);
    setValue(
      `products.${productIndex}.formData.locationDetails`,
      locationDetail
    );
    setValue(`products.${productIndex}.formData.rack`, rack);
    setValue(`products.${productIndex}.formData.rackDetails`, rackDetails);
    setValue(`products.${productIndex}.formData.bin`, bin);
    setValue(`products.${productIndex}.formData.binDetails`, binDetails);
  };

  const handleFileUpload = (file: any) => {
    const existingFiles =
      getValues(`products.${productIndex}.formData.damageDocs`) || [];
    setValue(`products.${productIndex}.formData.damageDocs`, [
      { id: file._id },
      ...existingFiles,
    ]);

    if (swiperRef.current) {
      const t = setTimeout(() => {
        clearTimeout(t);
        swiperRef.current?.update();
      }, 200);
    }
  };

  const handleSwiperCallback = (a: {
    swiper: Swiper;
    action: "init" | "slideChange";
  }) => {
    if (a.action === "init") {
      swiperRef.current = a.swiper;
    }
  };

  const handleRemoveDamageDoc = (id: string) => {
    const existingFiles =
      getValues(`products.${productIndex}.formData.damageDocs`) || [];
    setValue(
      `products.${productIndex}.formData.damageDocs`,
      existingFiles.filter((doc: any) => doc.id !== id)
    );
  };

  return (
    <>
      <div className="tw:p-4">
        <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4 tw:mb-4">
          <AppInput
            type="number"
            name={`products.${productIndex}.formData.invoiceQty`}
            label={t("invoiceQty")}
            register={register}
            inputClassName="tw:bg-white"
            onChange={(e) => handleNonNegativeNumberChange(e, "invoiceQty")}
            isRequired={true}
          />
          <AppInput
            type="number"
            name={`products.${productIndex}.formData.receivedQty`}
            label={t("receivedQty")}
            register={register}
            inputClassName="tw:bg-white"
            onChange={(e) => handleNonNegativeNumberChange(e, "receivedQty")}
            isRequired={true}
          />
          <AppInput
            type="number"
            name={`products.${productIndex}.formData.damageQty`}
            label={t("damageQty")}
            register={register}
            inputClassName="tw:bg-white"
            onChange={(e) => handleNonNegativeNumberChange(e, "damageQty")}
            labelClassName="tw:!text-red-500"
          />
          <AppInput
            type="number"
            name={`products.${productIndex}.formData.purchasePrice`}
            label={t("purchasePrice") + " (Rs.)"}
            register={register}
            inputClassName="tw:bg-white"
            isRequired={true}
          />
        </div>

        {damageQty > 0 && (
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:md:col-span-2 tw:mb-4 tw:border tw:border-red-100 tw:p-4 tw:rounded-md">
            <div>
              <div className="tw:mb-2">
                <label className="tw:text-sm tw:font-medium tw:text-red-800 tw:flex tw:items-center tw:gap-2">
                  <AlertCircle className="tw:w-4 tw:h-4" />
                  {t("damageDocuments")}
                </label>
              </div>
              <AppSwiper config={swiperConfig} callback={handleSwiperCallback}>
                <AppSwiper.Slide>
                  <FileUpload
                    onFileUpload={handleFileUpload}
                    allowedExtensions={allowedExtensions}
                  >
                    <div className="tw:border-2 tw:border-dashed tw:border-red-300 tw:rounded-lg tw:p-2 tw:text-red-500 tw:h-20 tw:flex tw:items-center tw:justify-center">
                      <div className="tw:flex tw:flex-col tw:items-center tw:gap-1">
                        <Camera className="tw:w-4 tw:h-4" />
                        <div className="tw:text-xs">{t("addPhoto")}</div>
                      </div>
                    </div>
                  </FileUpload>
                </AppSwiper.Slide>

                {damageDocs?.map((doc: any) => (
                  <AppSwiper.Slide key={doc.id}>
                    <div className="tw:bg-white tw:rounded-lg tw:p-1 tw:h-20 tw:relative tw:border tw:border-gray-200">
                      <ImgRender
                        assetId={doc.id}
                        className="tw:w-full tw:h-full"
                      />
                      <div className="tw:flex tw:items-center tw:gap-2 tw:absolute tw:top-2 tw:right-2 tw:bg-white tw:rounded-full tw:p-1">
                        <button
                          className="tw:text-xs tw:text-red-500 tw:cursor-pointer"
                          onClick={() => handleRemoveDamageDoc(doc.id)}
                        >
                          <Trash className="tw:w-4 tw:h-4" />
                        </button>
                      </div>
                    </div>
                  </AppSwiper.Slide>
                ))}
              </AppSwiper>
            </div>
            <AppInput
              name={`products.${productIndex}.formData.damageRemarks`}
              register={register}
              inputClassName="tw:bg-white tw:mt-2"
              placeholder={t("damageRemarks")}
            />
          </div>
        )}

        {/* Notes and Damage Documentation Grid */}
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-4">
          <div>
            <LocationInput
              layout="horizontal"
              locationId={
                getValues(`products.${productIndex}.formData.location`) || ""
              }
              rackId={getValues(`products.${productIndex}.formData.rack`) || ""}
              binId={getValues(`products.${productIndex}.formData.bin`) || ""}
              dealId={getValues(`products.${productIndex}.dealId`) || ""}
              qty={receivedQty}
              callback={handleLocationChange}
              locationType="sellable"
              isRequired={true}
              hideLocationDropdown={true}
            />
          </div>

          <AppInput
            name={`products.${productIndex}.formData.notes`}
            label={t("notes")}
            register={register}
            inputClassName="tw:bg-white"
            placeholder={t("enterAdditionalNotes")}
          />
        </div>

        <div className="tw:grid tw:grid-cols-2 tw:gap-4">
          <Controller
            control={control}
            name={`products.${productIndex}.formData.manufactureDate`}
            render={({ field }) => (
              <AppDateInput
                label={t("manufactureDate")}
                size="sm"
                isRequired={false}
                callback={field.onChange}
                value={field.value}
                inputClassName="tw:bg-white"
                dateConfig={manufactureDateConfig}
              />
            )}
          />

          <Controller
            control={control}
            name={`products.${productIndex}.formData.expiryDate`}
            render={({ field }) => (
              <AppDateInput
                label={t("expiryDate")}
                size="sm"
                isRequired={false}
                callback={field.onChange}
                value={field.value}
                inputClassName="tw:bg-white"
                dateConfig={expiryDateConfig}
              />
            )}
          />
        </div>
      </div>

      <ProductVariation
        productIndex={productIndex}
        dealName={dealName}
        receivedQty={receivedQty}
      />
    </>
  );
};
export default ProductItemForm;
