import { FileText, Upload } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import FileUpload from "~/components/core/file-upload/FileUpload";
import { API } from "~/constants";
import BulkBarcodeInfo from "./BulkBarcodeInfo";

interface BarcodeFileUploadProps {
  onFileUpload: (response: any) => void;
  uploadedFile: any;
  handleDownloadTemplate: () => void;
}

const BarcodeFileUpload = ({
  onFileUpload,
  uploadedFile,
  handleDownloadTemplate,
}: BarcodeFileUploadProps) => {
  return (
    <AppCard title="Upload Barcode List File" icon="upload">
      <FileUpload
        allowedExtensions={["xlsx", "xls", "csv"]}
        accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        dontUseNative={true}
        maxSizeMB={20}
        onFileUpload={onFileUpload}
        uploadUrl={`${API}purchase/inventory/excel/barcode-upload`}
      >
        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-4 tw:w-full tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:p-8 tw:bg-gray-50 tw:hover:bg-gray-100 tw:transition-colors">
          {/* Document Icon */}
          <div className="tw:text-gray-400">
            <FileText className="tw:text-6xl" />
          </div>

          {/* Upload Text */}
          <div className="tw:text-center">
            <h3 className="tw:text-lg tw:font-semibold tw:text-gray-700 tw:mb-2">
              Upload barcode list
            </h3>
            <p className="tw:text-sm tw:text-gray-500 tw:mb-2">
              Upload a CSV or Excel file to fetch product details. Please
              download the sample template first and use it as a guide.
            </p>
            <p className="tw:text-xs tw:text-gray-400">
              Supported formats: Excel (.xlsx, .xls) and CSV
            </p>
          </div>

          {/* Choose File Button */}
          <AppButton className="tw:flex tw:items-center tw:gap-2 tw:mt-2">
            <Upload />
            Choose File
          </AppButton>
        </div>
      </FileUpload>
      <BulkBarcodeInfo onDownloadTemplate={handleDownloadTemplate} />

      {/* Show uploaded file info if available */}
      {uploadedFile && (
        <div className="tw:mt-4 tw:p-4 tw:bg-green-50 tw:border tw:border-green-200 tw:rounded-md">
          <div className="tw:flex tw:items-center tw:gap-2 tw:text-green-700">
            <FileText />
            <span className="tw:font-medium">
              Barcode list file uploaded successfully!
            </span>
          </div>
          <p className="tw:text-sm tw:text-green-600 tw:mt-1">
            Product details are being fetched for each barcode. File ID:{" "}
            {uploadedFile._id || uploadedFile.id}
          </p>
        </div>
      )}
    </AppCard>
  );
};

export default BarcodeFileUpload;
