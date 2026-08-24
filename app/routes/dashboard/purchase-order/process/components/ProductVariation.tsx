import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import { Barcode } from "lucide-react";
import InventoryVariationModal from "~/modals/feature/inventory/inventory-variation/InventoryVariationModal";
import useAppToast from "~/hooks/useAppToast";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

type Variation = {
  id: string;
  formData: {
    barcode: string;
    qty: number;
    manufactureDate?: Date;
    expiryDate?: Date;
    purchasePrice?: number;
    mrp?: number;
    notes?: string;
    location?: string;
    locationDetail?: any;
    rack?: string;
    rackDetails?: any;
    bin?: string;
    binDetails?: any;
  };
  // Legacy properties for backward compatibility (can be removed later)
  barcode?: string;
  qty?: number;
  manufactureDate?: Date;
  expiryDate?: Date;
  purchasePrice?: number;
  notes?: string;
};

type ProductVariationProps = {
  productIndex: number; // Add product index to identify which product in the form
  dealName?: string;
  receivedQty: number;
};

const ProductVariation = ({
  productIndex,
  dealName,
  receivedQty,
}: ProductVariationProps) => {
  const { t } = useTranslation();

  const { control, setValue, getValues } = useFormContext();
  const toast = useAppToast();

  // Watch the variations for this specific product
  const [variations] = useWatch({
    control,
    name: [`products.${productIndex}.formData.variations`],
  });

  // Get the product data from form context to access MRP and other fields
  const productData = getValues(`products.${productIndex}`);
  const productMrp = productData?.mrp || 0;
  const invoicedQty = Number(productData?.formData?.invoiceQty) || 0;
  const receivedQtyVal = Number(productData?.formData?.receivedQty) || 0;
  const damagedQty = Number(productData?.formData?.damageQty) || 0;
  const currentVariations = productData?.formData?.variations || [];
  const sumOfVariantQty = currentVariations.reduce(
    (sum: number, v: any) => sum + (v.formData?.qty || 0),
    0
  );
  const remainingQty = Math.max(
    invoicedQty - (receivedQtyVal + damagedQty + sumOfVariantQty),
    0
  );

  const [showModal, setShowModal] = useState(false);
  const [modalMaxQty, setModalMaxQty] = useState<number | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);

  const handleAddVariation = () => {
    if (invoicedQty <= 0) {
      toast.show({
        msg: t("enterInvoiceQtyBeforeAddingVariation"),
        color: "error",
      });
      return;
    }
    if (remainingQty <= 0) {
      toast.show({
        msg: t("noRemainingQtyForVariations"),
        color: "warning",
      });
      return;
    }
    setShowModal(true);
    setModalMaxQty(remainingQty);
  };

  const handleModalCallback = (response: { action: string; data?: any }) => {
    if (response.action === "add" && response.data) {
      const currentVariations =
        getValues(`products.${productIndex}.formData.variations`) || [];
      const productData = getValues(`products.${productIndex}`);
      const parentDealId = productData?.dealId || undefined;

      // Create variation with formData structure
      const newVariation = {
        id: Date.now().toString(), // Generate temporary ID
        parentDealId,
        formData: {
          barcode: response.data.barcode,
          qty: response.data.qty,
          manufactureDate: response.data.manufactureDate,
          expiryDate: response.data.expiryDate,
          purchasePrice: response.data.purchasePrice,
          mrp: response.data.mrp,
          notes: response.data.notes,
          location: response.data.location,
          locationDetail: response.data.locationDetail,
          locationDetails: response.data.locationDetail,
          rack: response.data.rack,
          rackDetails: response.data.rackDetails,
          bin: response.data.bin,
          binDetails: response.data.binDetails,
        },
      };

      const updatedVariations = [...currentVariations, newVariation];
      setValue(
        `products.${productIndex}.formData.variations`,
        updatedVariations
      );
    }
    setShowModal(false);
  };

  const handleRemoveVariation = (id: string) => {
    const currentVariations =
      getValues(`products.${productIndex}.formData.variations`) || [];
    const updatedVariations = currentVariations.filter(
      (v: Variation) => v.id !== id
    );
    setValue(`products.${productIndex}.formData.variations`, updatedVariations);
  };

  // Ensure variations is always an array
  const variationsArray = variations || [];

  return (
    <>
      <div>
        {/* Compact Header with better visual hierarchy */}
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:py-2 tw:px-3 tw:border-t tw:border-gray-200">
          <div
            className="tw:flex tw:items-center tw:gap-2 tw:cursor-pointer tw:min-w-0 tw:flex-1"
            onClick={() => setIsOpen((s) => !s)}
            role="button"
            aria-expanded={isOpen}
          >
            <ChevronDown
              className={`tw:transition-transform tw:duration-200 tw:text-gray-500 tw:shrink-0 ${
                isOpen ? "tw:rotate-180" : ""
              }`}
              size={16}
            />
            <h3 className="tw:text-sm tw:font-semibold tw:text-gray-700 tw:truncate">
              {t("variations")}
            </h3>
            <span className="tw:inline-flex tw:items-center tw:justify-center tw:min-w-5 tw:h-5 tw:px-1.5 tw:text-xs tw:font-medium tw:bg-blue-100 tw:text-blue-700 tw:rounded-full tw:shrink-0">
              {variationsArray.length}
            </span>
          </div>

          <AppButton
            size="small"
            fill="outline"
            onClick={handleAddVariation}
            className="tw:ml-2 tw:shrink-0"
          >
            <Plus size={14} />
            {t("addVariation")}
          </AppButton>
        </div>

        {/* Variations List (collapsible) - Compact & Readable */}
        <div
          className={`tw:transition-all tw:duration-200 ${isOpen ? "" : "tw:hidden"}`}
        >
          {variationsArray.length === 0 ? (
            <div className="tw:flex tw:items-center tw:justify-center tw:py-6 tw:px-4 tw:bg-gray-50 tw:border tw:border-dashed tw:border-gray-300">
              <div className="tw:text-sm tw:text-gray-500">
                {t("noVariationsAddedYet")}
              </div>
            </div>
          ) : (
            variationsArray.map((variation: Variation, idx: number) => (
              <div
                key={variation.id}
                className={`tw:rounded tw:p-3 tw:relative ${
                  idx % 2 === 0 ? "tw:bg-blue-50/85" : "tw:bg-gray-50"
                }`}
              >
                {/* Top Row: Quantity, Barcode & Delete Icon */}
                <div className="tw:flex tw:items-start tw:justify-between tw:mb-3">
                  <div className="tw:flex tw:items-center tw:gap-3 tw:flex-1">
                    <div className="tw:text-base tw:font-semibold tw:text-gray-900">
                      {variation.formData?.qty || 0} {t("units")}
                    </div>

                    {/* Barcode box next to units */}
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <div className="tw:flex tw:items-center tw:gap-2 tw:bg-gray-200 tw:px-2 tw:py-1 tw:rounded tw:text-sm tw:text-gray-700">
                        <Barcode size={16} className="tw:text-gray-400" />
                        <div className="tw:font-medium tw:text-xs tw:text-gray-700">
                          {variation.formData?.barcode || "--"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveVariation(variation.id)}
                    className="tw:text-red-500 hover:tw:text-red-600 tw:transition-colors"
                    title={t("removeVariation")}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Details Grid - use KeyValue for consistency */}
                <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-3 tw:text-xs tw:mb-2">
                  <KeyValue label={t("manufactureDate")} size="sm">
                    {variation.formData?.manufactureDate ? (
                      <DateFormat
                        value={variation.formData.manufactureDate || null}
                        formatStr="dd MMM yyyy"
                      />
                    ) : (
                      "--"
                    )}
                  </KeyValue>

                  <KeyValue label={t("expiryDate")} size="sm">
                    {variation.formData?.expiryDate ? (
                      <DateFormat
                        value={variation.formData.expiryDate || null}
                        formatStr="dd MMM yyyy"
                      />
                    ) : (
                      "--"
                    )}
                  </KeyValue>

                  <KeyValue label={t("mrp")} size="sm">
                    <Amount
                      value={variation.formData?.mrp || 0}
                      decimalPlaces={2}
                    />
                  </KeyValue>

                  <KeyValue label={t("purchasePrice")} size="sm">
                    <Amount
                      value={variation.formData?.purchasePrice || 0}
                      decimalPlaces={2}
                    />
                  </KeyValue>
                </div>

                {/* Notes (optional, below details) */}
                {variation.formData?.notes && (
                  <div className="tw:text-xs tw:text-gray-600 tw:leading-relaxed">
                    {variation.formData.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Inventory Variation Modal */}
      <InventoryVariationModal
        show={showModal}
        callback={handleModalCallback}
        dealName={dealName}
        maxQty={modalMaxQty}
        defaultMrp={productMrp}
        dealId={productData?.dealId}
      />
    </>
  );
};

export default ProductVariation;
