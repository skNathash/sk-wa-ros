import { ScanLine } from "lucide-react";
import MiscService from "~/services/MiscService";

import clsx from "clsx";
import React from "react";

type Props = {
  size?: number;
  className?: string;
  callback: (r: { action: string; data: any }) => void;
  children?: React.ReactNode;
};

const BarcodeScan = ({
  callback,
  size = 16,
  className = "",
  children,
}: Props) => {
  const scan = () => {
    const cordova = MiscService.getCordova();
    if (cordova) {
      cordova.plugins.barcodeScanner.scan(
        (r: any) => {
          if (r && r.text) {
            callback({ action: "scan", data: r.text });
          } else {
            callback({ action: "error", data: "Failed to scan" });
          }
        },
        () => {
          callback({ action: "error", data: "Failed to scan" });
        }
      );
    } else {
      callback({ action: "error", data: "Scanner is not available" });
    }
  };

  if (!MiscService.hasCordova()) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={scan}
      className={clsx(
        "tw:flex tw:items-center tw:gap-2 tw:transition-all tw:duration-200 tw:hover:scale-105 tw:active:scale-95",
        className
      )}
    >
      {children ? (
        children
      ) : (
        <>
          <ScanLine
            className="tw:w-5 tw:h-5 tw:text-blue-600 tw:animate-pulse"
            size={size}
          />
        </>
      )}
    </button>
  );
};

export default BarcodeScan;
