import { Copy, PenLine, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import CommonService from "~/services/CommonService";
import ProductService from "~/services/ProductService";
import useAppToast from "~/hooks/useAppToast";
import AppButton from "~/components/core/button/AppButton";

type ProductBarcodeProps = {
  barcodes: string[];
  className?: string;
};

const ProductBarcode = ({ barcodes, className }: ProductBarcodeProps) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const handleCopy = (barcode: string) => {
    CommonService.copyToClipboard(barcode);
    appToast.show({
      msg: t("copiedToClipboard"),
      color: "success",
    });
  };

  return (
    <div className={className}>
      <div className="tw:flex tw:flex-wrap tw:gap-2">
        {barcodes.map((barcode, idx) => (
          <div
            className="tw:bg-white tw:px-2 tw:py-1 tw:rounded-md tw:flex tw:justify-between tw:gap-2 tw:border tw:border-blue-200 tw:items-center"
            key={idx}
          >
            <code className="tw:text-sm tw:text-gray-600">{barcode}</code>
            <AppButton
              size="small"
              fill="clear"
              noPadding={true}
              onClick={() => {
                handleCopy(barcode);
              }}
              className="tw:h-6"
            >
              <Copy
                size={16}
                className="tw:text-gray-600 tw:hover:text-blue-600"
              />
            </AppButton>
          </div>
        ))}
      </div>

      {barcodes.length === 0 ? (
        <div className="tw:text-sm tw:text-gray-600 tw:text-center">
          {t("noBarcodesFound")}
        </div>
      ) : null}
    </div>
  );
};

export default ProductBarcode;
