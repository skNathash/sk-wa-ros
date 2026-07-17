import { Copy, PenLine, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import CommonService from "~/services/CommonService";
import ProductService from "~/services/ProductService";
import useAppToast from "~/hooks/useAppToast";
import AppButton from "~/components/core/button/AppButton";

type ProductBarcodeProps = {
  dealId: string;
  className?: string;
};

const ProductBarcode = ({ dealId, className }: ProductBarcodeProps) => {
  const appToast = useAppToast();

  const [barcodes, setBarcodes] = useState<
    {
      barcode: string;
      type: "primary" | "secondary";
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBarcodes = async () => {
      setLoading(true);
      const response = await ProductService.getDealBarcodes([dealId]);
      const data = response.data?.[0] || {};
      const primaryBarcodes = (data?.primaryBarcodesList || []).map(
        (barcode: any) => ({
          barcode: barcode,
          type: "primary",
        })
      );
      const secondaryBarcodes = (data?.secondaryBarcodesList || []).map(
        (barcode: any) => ({
          barcode: barcode,
          type: "secondary",
        })
      );

      setBarcodes([...primaryBarcodes, ...secondaryBarcodes]);
      setLoading(false);
    };
    fetchBarcodes();
  }, [dealId]);

  const handleCopy = (barcode: string) => {
    CommonService.copyToClipboard(barcode);
    appToast.show({
      msg: "Copied to clipboard",
      color: "success",
    });
  };

  return (
    <div className={`tw:bg-blue-50 tw:p-4 tw:rounded-md ${className}`}>
      <div className="tw:flex tw:justify-between tw:items-center tw:mb-4">
        <div className="tw:text-sm tw:font-medium tw:text-blue-600">
          Barcodes ({barcodes.length})
        </div>
        <AppButton size="small" fill="outline" color="primary">
          <PenLine size={16} />
          Manage Barcodes
        </AppButton>
      </div>

      {loading ? <AppSpinner /> : null}

      <div className="tw:flex tw:flex-wrap tw:gap-2">
        {barcodes.map((barcode, idx) => (
          <div
            className="tw:bg-white tw:p-2 tw:rounded-md tw:flex tw:justify-between tw:gap-2 tw:border tw:border-blue-200"
            key={idx}
          >
            <code className="tw:text-sm tw:text-gray-600">
              {barcode.barcode}
            </code>
            <button
              onClick={() => {
                handleCopy(barcode.barcode);
              }}
              className="tw:cursor-pointer"
            >
              <Copy
                size={16}
                className="tw:text-gray-600 tw:hover:text-blue-600"
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductBarcode;
