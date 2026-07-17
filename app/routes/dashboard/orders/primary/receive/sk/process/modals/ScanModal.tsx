import React, { useRef, useState, useEffect } from "react";
import { Barcode, CheckCircle } from "lucide-react";
import { debounce } from "lodash";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { Input } from "~/components/ui/input";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

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
        const matchedBox = boxes.find((box) => box.boxNo === barcode);

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

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <span className="tw:text-lg tw:font-bold">Scan Package</span>
        <div className="tw:text-xs tw:text-gray-600">
          Scan the barcode of the package/box you want to receive for this
          order.
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:space-y-4">
          <div className="tw:space-y-3">
            <div className="tw:text-sm tw:font-medium tw:text-gray-700">
              Package Barcode
            </div>
            <div className="tw:relative tw:w-full">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Scan or enter package barcode"
                onChange={onBarcodeChange}
                className="tw:pl-10 tw:w-full"
                autoFocus
              />
              {scanning ? (
                <div className="tw:absolute tw:right-2 tw:top-1/2 tw:-translate-y-1/2">
                  <AppSpinner />
                </div>
              ) : (
                <Barcode className="tw:absolute tw:left-2 tw:top-1/2 tw:-translate-y-1/2 tw:text-xl tw:text-gray-500" />
              )}
            </div>
          </div>

          {/* Compact box details when found */}
          {scannedBox && (
            <div className="tw:flex tw:items-center tw:gap-3 tw:bg-green-50 tw:border tw:border-green-200 tw:rounded-lg tw:px-3 tw:py-2">
              <CheckCircle className="tw:text-green-600 tw:text-lg" />
              <div className="tw:flex-1 tw:text-sm">
                <span className="tw:font-medium tw:text-green-800">
                  {scannedBox.boxNo}
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
                Package Not Found
              </div>
              <div className="tw:text-sm tw:text-gray-700">
                Package with barcode "{scannedBarcode}" was not found in this
                order.
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
            Cancel
          </AppButton>
          <AppButton
            size="small"
            color="primary"
            onClick={handleReceive}
            expand="block"
            className="tw:flex-1"
            disabled={!scannedBox}
          >
            Receive
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ScanModal;
