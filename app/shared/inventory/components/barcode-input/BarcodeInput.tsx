import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useTranslation } from "react-i18next";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import AddProductModal from "~/shared/catalog/modals/AddProductModal";
import BarcodeLinkedProductsModal from "./BarcodeLinkedProductsModal";
import ProductCreatedSuccessModal from "./ProductCreatedSuccessModal";

type BarcodeInputProps = {
  value: string;
  onChange: (barcode: string) => void;
  callback?: (params: { action: string; data?: any }) => void;
  placeholder?: string;
  className?: string;
  dealId?: string;
  // Kept for backwards compatibility with existing callers; the linked
  // products modal now always offers "create new product" instead.
  useSubscribeBtn?: boolean;
  // Kept for backwards compatibility with existing callers; no longer
  // used — isLocalDeal does not depend on the uom.
  uom?: string;
  // When the input is already inside the add-product form, offering
  // "create new product" makes no sense — hide it and offer
  // "use barcode anyway" instead.
  hideCreateProduct?: boolean;
};

const BarcodeInput = ({
  value,
  onChange,
  callback,
  placeholder,
  className,
  dealId = "",
  hideCreateProduct = false,
}: BarcodeInputProps) => {
  const { t } = useTranslation(["common"]);

  const [localValue, setLocalValue] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const [linkedModal, setLinkedModal] = useState<{
    show: boolean;
    barcode: string;
    linkedDeals: any[];
  }>({ show: false, barcode: "", linkedDeals: [] });
  const [addProductModal, setAddProductModal] = useState<{
    show: boolean;
    barcode: string;
  }>({ show: false, barcode: "" });
  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    productName: string;
  }>({ show: false, productName: "" });

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const validate = useDebouncedCallback(async (barcode: string) => {
    if (!barcode) {
      setLoading(false);
      return;
    }
    try {
      const response = await InventorySubscribeService.searchBarcode(
        barcode,
        undefined,
        dealId,
      );
      const linkedDeals = [
        ...(response?.data?.data?.dealResults || []),
        ...(response?.data?.data?.sellerDealResults || []),
      ];

      if (response?.data?.isNewbarcode === false && linkedDeals.length) {
        setLinkedModal({ show: true, barcode, linkedDeals });
        setLocalValue("");
        onChange("");
      } else {
        onChange(barcode);
      }
    } finally {
      setLoading(false);
    }
  }, 500);

  const closeLinkedModal = () =>
    setLinkedModal({ show: false, barcode: "", linkedDeals: [] });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocalValue(next);
    setLoading(!!next);
    validate(next);
  };

  return (
    <div className={`tw:relative tw:w-full ${className ?? ""}`}>
      <input
        className="tw:w-full tw:border tw:border-gray-300 tw:rounded-md tw:h-8 tw:p-2 tw:pr-8 tw:text-sm tw:outline-none tw:placeholder:text-sm"
        value={localValue}
        placeholder={placeholder ?? t("enterBarcode")}
        onChange={handleChange}
      />
      {loading && (
        <div className="tw:absolute tw:right-2 tw:top-1/2 tw:-translate-y-1/2">
          <AppSpinner size="xs" />
        </div>
      )}

      {linkedModal.show && (
        <BarcodeLinkedProductsModal
          show={linkedModal.show}
          barcode={linkedModal.barcode}
          linkedDeals={linkedModal.linkedDeals}
          hideCreateProduct={hideCreateProduct}
          callback={(params) => {
            if (params.action === "useBarcode") {
              // Keep the scanned barcode in the form field despite it
              // being linked to other deals, and let the parent know so
              // it can mark the product as a local deal.
              setLocalValue(linkedModal.barcode);
              onChange(linkedModal.barcode);
              callback?.({
                action: "useBarcode",
                data: { barcode: linkedModal.barcode },
              });
              closeLinkedModal();
              return;
            }
            if (params.action === "createProduct") {
              // Hide the linked-products modal and open the add-product
              // modal with the scanned barcode pre-filled.
              setAddProductModal({ show: true, barcode: linkedModal.barcode });
              closeLinkedModal();
              return;
            }
            if (params.action === "subscribed") {
              // Tell the parent to refresh; keep the modal open on its
              // success screen so the user can choose to go to the cart.
              callback?.({ action: "subscribed", data: params.data });
              return;
            }
            closeLinkedModal();
          }}
        />
      )}

      {addProductModal.show && (
        <AddProductModal
          show={addProductModal.show}
          mode="localDeal"
          title="Create New Product"
          data={{ barcode: addProductModal.barcode }}
          allowImageUpload
          callback={(params) => {
            if (params.action === "created") {
              // Clear the input — the barcode now belongs to the newly
              // created product, which is pending StoreKing review.
              setLocalValue("");
              onChange("");
              callback?.({
                action: "created",
                data: { ...params.data, barcode: addProductModal.barcode },
              });
              // Let the user know the product went to StoreKing for review.
              setSuccessModal({
                show: true,
                productName:
                  params.data?.product?.productName ||
                  params.data?.product?.name ||
                  "",
              });
            }
            setAddProductModal({ show: false, barcode: "" });
          }}
        />
      )}

      {successModal.show && (
        <ProductCreatedSuccessModal
          show={successModal.show}
          productName={successModal.productName}
          callback={() => setSuccessModal({ show: false, productName: "" })}
        />
      )}
    </div>
  );
};

export default BarcodeInput;
