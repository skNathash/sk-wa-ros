import React from "react";
import { Download } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import InfoBlock from "~/components/core/info-blk/InfoBlock";

interface DownloadSampleBlockProps {
  onDownloadTemplate: () => void;
  className?: string;
  template?: number;
}

const DownloadSampleBlock: React.FC<DownloadSampleBlockProps> = ({
  onDownloadTemplate,
  className,
  template = 1,
}) => {
  if (template === 2) {
    return (
      <div className="tw:flex tw:gap-2 tw:items-center">
        <div className="tw:text-sm">Sample template</div>
        <div>
          <AppButton
            onClick={onDownloadTemplate}
            className="tw:flex-shrink-0 tw:text-blue-600 tw:font-semibold"
            size="small"
            fill="clear"
          >
            <Download />
            Download Template
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <InfoBlock size="sm" bordered className={`tw:mb-4 ${className ?? ""}`}>
      <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-2 tw:md:items-center tw:justify-between">
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:text-gray-600 tw:flex-shrink-0">
            <Download className="tw:w-5 tw:h-5" />
          </div>
          <div className="tw:text-sm tw:text-gray-700">
            Download the template file to ensure the correct format for bulk
            barcode uploads. You can upload a maximum of 50 products in a single
            file.
          </div>
        </div>

        <AppButton
          onClick={onDownloadTemplate}
          className="tw:flex-shrink-0"
          size="small"
        >
          <Download />
          Download Template
        </AppButton>
      </div>
    </InfoBlock>
  );
};

export default DownloadSampleBlock;
