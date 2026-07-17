import { debounce } from "lodash";
import { Barcode } from "lucide-react";
import { useRef, useState } from "react";
import BarcodeScan from "~/components/core/barcode-scan/BarcodeScan";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { Input } from "~/components/ui/input";
import SellerCatalogService from "~/services/SellerCatalogService";
import VendorService from "~/services/VendorService";

type Props = {
  callback: (a: {
    action: string;
    data: { product: any; barcode: string };
  }) => void;
  dealIds: string[];
  vendorId?: string;
};

const ScanInput = ({ callback, dealIds, vendorId }: Props) => {
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const barcodeDebounce = debounce(async (value: string) => {
    const barcode = value.trim();
    if (barcode) {
      setScanning(true);
      // Use VendorService.getProducts instead of ProductService.getProducts
      const res = await SellerCatalogService.getProducts({
        barcode: barcode,
        filter: {
          barcodes: barcode,
          // _id: {
          //   $in: dealIds,
          // },
        },
      });
      if (res.data?.data.length > 0) {
        callback({
          action: "scan",
          data: { product: res.data.data[0], barcode: barcode },
        });
      } else {
        callback({ action: "scan", data: { product: null, barcode: barcode } });
      }
      setScanning(false);

      // Clear the barcode after scan
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }, 1000);

  const onBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    barcodeDebounce(value);
  };

  const handleBarcodeScan = (r: { action: string; data: any }) => {
    if (r.action === "scan" && r.data) {
      barcodeDebounce(r.data);
    }
  };

  return (
    <div className="tw:space-y-3 tw:w-full">
      <div className="tw:text-sm tw:font-medium tw:text-gray-700">
        Scan Product Barcode
      </div>
      <div className="tw:relative tw:w-full">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Scan Barcode"
          onChange={onBarcodeChange}
          className="tw:pr-10 tw:w-full"
        />
        {scanning ? (
          <div className="tw:absolute tw:right-2 tw:top-1/2 tw:-translate-y-1/2">
            <AppSpinner />
          </div>
        ) : (
          <BarcodeScan
            callback={handleBarcodeScan}
            className="tw:absolute tw:right-2 tw:top-1/2 tw:-translate-y-1/2 tw:text-xl tw:text-gray-500"
          />
        )}
      </div>
      <AppButton color="dark" className="tw:w-full">
        Find Item
      </AppButton>
    </div>
  );
};

export default ScanInput;
