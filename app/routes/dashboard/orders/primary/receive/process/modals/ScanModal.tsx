import React, { useRef, useState, useEffect } from "react";
import { Barcode, CheckCircle } from "lucide-react";
import { debounce } from "lodash";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { Input } from "~/components/ui/input";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { useTranslation } from "react-i18next";
import BarcodeScan from "~/components/core/barcode-scan/BarcodeScan";

interface ScanModalProps {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  orderId?: string;
  boxes?: any[];
}

const ScanModal: React.FC<ScanModalProps> = ({
  show,
  callback,
  orderId,
  boxes = [],
}) => {
  const { t } = useTranslation();

  const [scanning, setScanning] = useState(false);
  const [scannedBox, setScannedBox] = useState<any>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal is opened
  useEffect(() => {
    if (show) {
      setScannedBox(null);
      setScannedBarcode("");
      setScanning(false);
      // Clear the input field
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }, [show]);

  const barcodeDebounce = debounce(async (value: string) => {
    const barcode = value.trim();
    if (barcode) {
      setScanning(true);
      setScannedBarcode(barcode);

      try {
        // Check if the scanned barcode matches any packageRefNo in the boxes
        const matchedBox = boxes.find((box) => box.packageRefNo === barcode);

        setTimeout(() => {
          setScanning(false);
          if (matchedBox) {
            setScannedBox(matchedBox);
            callback({
              action: "scan",
              data: {
                box: matchedBox,
                barcode: barcode,
                found: true,
              },
            });
          } else {
            setScannedBox(null);
            callback({
              action: "scan",
              data: {
                box: null,
                barcode: barcode,
                found: false,
              },
            });
          }

          // Clear the input after scan
          if (inputRef.current) {
            inputRef.current.value = "";
          }
        }, 500);
      } catch (error) {
        setScanning(false);
        setScannedBox(null);
        callback({
          action: "scan",
          data: { box: null, barcode: barcode, found: false },
        });
      }
    }
  }, 1000);

  const onBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    barcodeDebounce(value);
  };

  const handleClose = () => {
    setScannedBox(null);
    setScannedBarcode("");
    callback({ action: "close" });
  };

  const handleReceive = () => {
    if (scannedBox) {
      callback({
        action: "receive",
        data: {
          box: scannedBox,
          barcode: scannedBarcode,
        },
      });
    }
  };

  const handleBarcodeScan = (data: { action: string; data: any }) => {
    if (data.action === "scan") {
      onBarcodeChange(data.data);
    }
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <span className="tw:text-lg tw:font-bold">{t("scanBox")}</span>
        <div className="tw:text-xs tw:text-gray-600">
          {t("scanPackageDescription")}
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:space-y-4">
          <div className="tw:space-y-3">
            <div className="tw:text-sm tw:font-medium tw:text-gray-700">
              {t("boxBarcode")}
            </div>
            <div className="tw:relative tw:w-full">
              <Input
                ref={inputRef}
                type="text"
                placeholder={t("scanOrEnterBoxBarcode")}
                onChange={onBarcodeChange}
                className="tw:pl-10 tw:w-full"
                autoFocus
              />
              {scanning ? (
                <div className="tw:absolute tw:right-2 tw:top-1/2 tw:-translate-y-1/2">
                  <AppSpinner />
                </div>
              ) : (
                <BarcodeScan
                  callback={handleBarcodeScan}
                  className="tw:absolute tw:right-2 tw:top-1/2 tw:-translate-y-1/2"
                />
              )}
            </div>
          </div>

          {/* Compact box details when found */}
          {scannedBox && (
            <div className="tw:flex tw:items-center tw:gap-3 tw:bg-green-50 tw:border tw:border-green-200 tw:rounded-lg tw:px-3 tw:py-2">
              <CheckCircle className="tw:text-green-600 tw:text-lg" />
              <div className="tw:flex-1 tw:text-sm">
                <span className="tw:font-medium tw:text-green-800">
                  {scannedBox.packageRefNo}
                </span>
                <span className="tw:text-gray-600 tw:ml-2">
                  • {scannedBox.totalQty} items • {scannedBox.packageType} Box
                </span>
              </div>
            </div>
          )}

          {/* Show error message if not found */}
          {scannedBarcode && !scannedBox && !scanning && (
            <div className="tw:bg-red-50 tw:border tw:border-red-200 tw:rounded-lg tw:p-4">
              <div className="tw:text-red-600 tw:font-medium">
                {t("packageNotFound")}
              </div>
              <div className="tw:text-sm tw:text-gray-700">
                {t("packageNotFoundDescription", {
                  barcode: scannedBarcode,
                })}
              </div>
            </div>
          )}
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:gap-4 tw:w-full">
          <AppButton
            size="small"
            fill="outline"
            color="light"
            onClick={handleClose}
            expand="block"
            className="tw:flex-1"
          >
            {t("cancel")}
          </AppButton>
          <AppButton
            size="small"
            color="primary"
            onClick={handleReceive}
            expand="block"
            className="tw:flex-1"
            disabled={!scannedBox}
          >
            {t("receive")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ScanModal;
