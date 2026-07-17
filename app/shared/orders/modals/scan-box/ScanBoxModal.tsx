import { debounce } from "lodash";
import { Barcode, CheckCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import BarcodeScan from "~/components/core/barcode-scan/BarcodeScan";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { Input } from "~/components/ui/input";
import { getScanData } from "./helper";
import useAppToast from "~/hooks/useAppToast";

const ScanBoxModal = ({
  show,
  callback,
}: {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
}) => {
  const { t } = useTranslation(["common"]);

  const appToast = useAppToast();

  const [scanning, setScanning] = useState(false);
  const [scannedBox, setScannedBox] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (show) {
      setScannedBox(null);
      setError("");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }, [show]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const debouncedBarcodeChange = useCallback(
    debounce((value: string) => {
      doScan(value);
    }, 1000),
    []
  );

  const onBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setError("");
    debouncedBarcodeChange(value);
  };

  const handleBarcodeScan = (r: { action: string; data: any }) => {
    if (r.action === "scan" && r.data) {
      doScan(r.data);
    }
  };

  const doScan = async (barcode: string) => {
    if (!barcode?.trim()) {
      setScannedBox(null);
      setScanning(false);
      setError("");
      return;
    }

    setScanning(true);
    const scanData: Record<string, any> = await getScanData(barcode?.trim());
    setScanning(false);

    if (scanData.response?.packageId) {
      setScannedBox(scanData);
    } else {
      setError(t("packageNotFound"));
      setScannedBox(null);
    }
  };

  const handleReceive = () => {
    const barcode = inputRef.current?.value;
    if (!barcode?.trim()) {
      appToast.show({
        msg: t("pleaseEnterBarcode"),
        color: "error",
      });
      return;
    }

    if (scannedBox) {
      callback({
        action: "receive",
        data: { box: scannedBox, barcode: inputRef.current?.value },
      });
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
              <Barcode className="tw:absolute tw:left-2 tw:top-1/2 tw:-translate-y-1/2 tw:text-xl tw:text-gray-500" />
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
          {scannedBox?.response?.packageId && (
            <div className="tw:flex tw:items-center tw:gap-3 tw:bg-green-50 tw:border tw:border-green-200 tw:rounded-lg tw:px-3 tw:py-2">
              <CheckCircle className="tw:text-green-600 tw:text-lg" />
              <div className="tw:flex-1 tw:text-sm">
                <span className="tw:font-medium tw:text-green-800">
                  {scannedBox.overview?.packageRefNo}
                </span>
                <span className="tw:text-gray-600 tw:ml-2">
                  • {scannedBox.overview?.totalItems} items
                </span>
              </div>
            </div>
          )}

          {/* Show error message if not found */}
          {error && (
            <div className="tw:bg-red-50 tw:border tw:border-red-200 tw:rounded-lg tw:p-4">
              <div className="tw:text-red-600 tw:font-medium">
                {t("packageNotFound")}
              </div>
              <div className="tw:text-sm tw:text-gray-700">
                {t("packageNotFoundDescription", {
                  barcode: inputRef.current?.value,
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

export default ScanBoxModal;
