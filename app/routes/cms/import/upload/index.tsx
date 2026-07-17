import AppCard from "~/components/core/card/AppCard";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import { Info, UploadCloud } from "lucide-react";
import FileUpload from "~/components/core/file-upload/FileUpload";

export default function UploadImport() {
  return (
    <AppCard
      className="tw:mt-8"
      title="Upload from File"
      subtitle="Upload an Excel or CSV file with your product data."
    >
      <InfoBlock className="tw:mb-4" variant="info" size="sm">
        <div className="tw:flex tw:gap-4">
          <div>
            <Info size={20} className="tw:text-blue-500" />
          </div>
          <div className="tw:flex-1">
            <div className="tw:font-semibold">File Format</div>
            <div className="tw:text-gray-700 tw:text-sm">
              Ensure your file has a sheet named <b>'products'</b> with headers:{" "}
              <b>name, sku, brand_id, category_id</b>.{" "}
              <a href="#" className="tw:text-blue-600 tw:underline">
                Download template
              </a>
            </div>
          </div>
        </div>
      </InfoBlock>
      <div className="tw:mt-4">
        <FileUpload
          maxSizeMB={10}
          allowedExtensions={["xlsx", "xls", "csv"]}
          label="Choose a file"
        >
          <div className="tw:border-dashed tw:border-2 tw:border-gray-200 tw:rounded-lg tw:p-8 tw:bg-gray-50 tw:flex tw:flex-col tw:items-center tw:justify-center">
            <div className="tw:text-4xl tw:text-gray-400 tw:mb-2">
              <UploadCloud size={48} className="tw:w-12 tw:h-12" />
            </div>
            <div className="tw:text-lg tw:font-semibold tw:text-blue-600">
              Choose a file
            </div>
            <div className="tw:text-gray-500 tw:text-sm tw:mb-2">
              or drag and drop
            </div>
            <div className="tw:text-xs tw:text-gray-400">
              XLSX, XLS, CSV up to 10MB
            </div>
          </div>
        </FileUpload>
      </div>
    </AppCard>
  );
}
