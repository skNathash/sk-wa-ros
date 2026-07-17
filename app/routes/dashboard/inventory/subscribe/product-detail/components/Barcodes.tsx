import React, { useState } from "react";
import {
  Barcode as BarcodeIcon,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import CommonService from "~/services/CommonService";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";

interface BarcodesProps {
  barcodes?: string[];
  className?: string;
}

const Barcodes: React.FC<BarcodesProps> = ({
  barcodes = [],
  className = "",
}) => {
  const [expanded, setExpanded] = useState(false);
  const appToast = useAppToast();
  const { isMobile } = useScreenView();

  const VISIBLE_COUNT = isMobile ? 1 : 4;

  const handleCopy = (code: string) => {
    try {
      CommonService.copyToClipboard(code);
      appToast.show({ msg: "Copied to clipboard", color: "success" });
    } catch (e) {
      appToast.show({ msg: "Failed to copy", color: "danger" });
    }
  };

  const toggleExpanded = () => setExpanded((v) => !v);
  const hasMore = barcodes && barcodes.length > VISIBLE_COUNT;
  const visibleBarcodes =
    hasMore && !expanded ? barcodes.slice(0, VISIBLE_COUNT) : barcodes;

  return (
    <AppCard title={"PRODUCT BARCODES"} className={className}>
      <div className="tw:flex tw:flex-wrap tw:gap-3">
        {barcodes && barcodes.length > 0 ? (
          <>
            {visibleBarcodes.map((code) => (
              <button
                key={code}
                onClick={() => handleCopy(code)}
                className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-1.5 tw:bg-white tw:border tw:border-gray-200 tw:rounded-md tw:shadow-sm hover:tw:bg-gray-50 hover:tw:border-gray-300 tw:transition-colors tw:text-sm tw:text-gray-700"
                title="Click to copy"
                type="button"
              >
                <BarcodeIcon size={14} className="tw:text-gray-500" />
                <span className="tw:text-xs tw:font-medium">{code}</span>
                <Copy size={12} className="tw:text-gray-400 tw:ml-auto" />
              </button>
            ))}

            {hasMore ? (
              <button
                onClick={toggleExpanded}
                aria-expanded={expanded}
                className="tw:flex tw:items-center tw:gap-1.5 tw:px-3 tw:py-1.5 tw:bg-primary-50 tw:border tw:border-primary-200 tw:rounded-md hover:tw:bg-primary-100 hover:tw:border-primary-300 tw:transition-colors tw:text-xs tw:font-medium tw:text-primary-700"
                type="button"
                title={expanded ? "Show less barcodes" : "Show all barcodes"}
              >
                {expanded ? (
                  <>
                    <ChevronUp size={14} />
                    <span>Less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} />
                    <span>+{barcodes.length - VISIBLE_COUNT} more</span>
                  </>
                )}
              </button>
            ) : null}
          </>
        ) : (
          <div className="tw:text-sm tw:text-gray-500">
            No barcodes available
          </div>
        )}
      </div>
    </AppCard>
  );
};

export default Barcodes;
