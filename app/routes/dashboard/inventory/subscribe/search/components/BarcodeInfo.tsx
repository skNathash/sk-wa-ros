import React from "react";
import { Barcode as BarcodeIcon } from "lucide-react";
import AppPopover from "~/components/core/popover/AppPopover";

interface BarcodeInfoProps {
  barcodeStr?: string | null;
  barcodes?: string[] | null;
  className?: string;
  showOnlyIcon?: boolean;
}

const BarcodeInfo: React.FC<BarcodeInfoProps> = ({
  barcodes,
  className,
  showOnlyIcon,
}) => {
  // Prefer barcodes list; ignore barcodeStr entirely
  const cleaned = (barcodes || [])
    .map((b) => (b ?? "").toString().trim())
    .filter((b) => b.length > 0);
  const primary = cleaned[0] || "";
  const rest = showOnlyIcon ? cleaned : cleaned.slice(1);
  const restCount = showOnlyIcon
    ? cleaned.length
    : Math.max(cleaned.length - 1, 0);

  if (!primary) return null;

  return (
    <div
      className={
        className
          ? className
          : "tw:flex tw:items-start tw:gap-1 tw:text-gray-500"
      }
    >
      {!showOnlyIcon ? <BarcodeIcon size={14} /> : null}
      <div className="tw:flex tw:flex-col tw:gap-1 tw:flex-1 tw:-mt-0.5">
        <div className="tw:flex tw:items-center tw:gap-2">
          {!showOnlyIcon && <code>{primary}</code>}
          {restCount > 0 && (
            <AppPopover
              triggerContent={
                <span>
                  {showOnlyIcon ? (
                    <BarcodeIcon size={18} />
                  ) : (
                    <span className="tw:cursor-pointer tw:text-blue-600 tw:hover:text-blue-800 tw:transition-colors tw:text-xs">
                      more+{restCount}
                    </span>
                  )}
                </span>
              }
              side="top"
              align="start"
            >
              <div className="tw:max-w-xs">
                <div className="tw:space-y-1">
                  {rest.map((barcode: string, index: number) => (
                    <div
                      key={index}
                      className="tw:flex tw:items-center tw:gap-2 tw:text-xs"
                    >
                      <BarcodeIcon size={10} className="tw:text-gray-400" />
                      <code className="tw:bg-gray-100 tw:px-2 tw:py-1 tw:rounded tw:font-mono">
                        {barcode}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </AppPopover>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeInfo;
