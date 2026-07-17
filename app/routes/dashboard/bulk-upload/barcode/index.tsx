import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import {
  QrCode,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
  FileText,
  Scan,
} from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";

export async function clientLoader() {
  return {};
}

const BarcodeTab = () => {
  const { t } = useTranslation(["common"]);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    // TODO: Implement download template functionality
    console.log("Download barcode template clicked");
  };

  const handleFileUpload = (fileData: any) => {
    setUploadedFile(fileData);
    setUploadStatus("success");
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadStatus("idle");
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel"
      ) {
        // Handle Excel file upload
        console.log("Excel file dropped:", file);
      } else {
        setUploadStatus("error");
      }
    }
  };

  return (
    <div className="tw:space-y-6">
      {/* Header Section */}
      <div className="tw:text-center tw:mb-8">
        <div className="tw:mb-4">
          <div className="tw:inline-flex tw:items-center tw:justify-center tw:w-16 tw:h-16 tw:bg-purple-100 tw:rounded-full tw:mb-4">
            <QrCode className="tw:text-purple-600" size={32} />
          </div>
        </div>
        <h2 className="tw:text-2xl tw:font-bold tw:text-gray-900 tw:mb-2">
          Barcode Management
        </h2>
        <p className="tw:text-gray-600 tw:max-w-2xl tw:mx-auto">
          Manage product barcodes in bulk. Update, add, or modify barcode
          information for your entire inventory.
        </p>
      </div>

      {/* Template Download Section */}
      <div className="tw:bg-gradient-to-r tw:from-purple-50 tw:to-violet-50 tw:rounded-lg tw:p-6 tw:border tw:border-purple-200">
        <div className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:flex tw:items-center tw:gap-3">
            <div className="tw:bg-purple-100 tw:p-2 tw:rounded-lg">
              <FileSpreadsheet className="tw:text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="tw:font-semibold tw:text-gray-900">
                Download Barcode Template
              </h3>
              <p className="tw:text-sm tw:text-gray-600">
                Get the Excel template with current barcode data
              </p>
            </div>
          </div>
          <AppButton
            color="secondary"
            onClick={handleDownloadTemplate}
            className="tw:flex tw:items-center tw:gap-2"
          >
            <Download size={16} />
            Download Template
          </AppButton>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="tw:space-y-4">
        <h3 className="tw:text-lg tw:font-semibold tw:text-gray-900">
          Upload Your Barcode File
        </h3>

        {!uploadedFile ? (
          <div
            className={`tw:border-2 tw:border-dashed tw:rounded-lg tw:p-8 tw:text-center tw:transition-colors ${
              dragActive
                ? "tw:border-purple-400 tw:bg-purple-50"
                : "tw:border-gray-300 tw:hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="tw:mb-4">
              <Scan className="tw:mx-auto tw:text-gray-400" size={48} />
            </div>
            <h4 className="tw:text-lg tw:font-medium tw:text-gray-900 tw:mb-2">
              Drag & drop your barcode file here
            </h4>
            <p className="tw:text-gray-600 tw:mb-4">or click to browse files</p>
            <FileUpload
              accept=".xlsx,.xls"
              onFileUpload={handleFileUpload}
              label="Choose Barcode File"
            />
            <p className="tw:text-xs tw:text-gray-500 tw:mt-2">
              Supported formats: .xlsx, .xls (Max 10MB)
            </p>
          </div>
        ) : (
          <div className="tw:bg-green-50 tw:border tw:border-green-200 tw:rounded-lg tw:p-4">
            <div className="tw:flex tw:items-center tw:justify-between">
              <div className="tw:flex tw:items-center tw:gap-3">
                <CheckCircle className="tw:text-green-600" size={24} />
                <div>
                  <h4 className="tw:font-medium tw:text-green-900">
                    Barcode File Uploaded Successfully
                  </h4>
                  <p className="tw:text-sm tw:text-green-700">
                    barcode_data.xlsx (1.2 MB)
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="tw:text-gray-400 tw:hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="tw:bg-red-50 tw:border tw:border-red-200 tw:rounded-lg tw:p-4">
            <div className="tw:flex tw:items-center tw:gap-3">
              <AlertCircle className="tw:text-red-600" size={24} />
              <div>
                <h4 className="tw:font-medium tw:text-red-900">
                  Upload Failed
                </h4>
                <p className="tw:text-sm tw:text-red-700">
                  Please ensure you're uploading a valid Excel file (.xlsx or
                  .xls)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barcode Preview Section */}
      {uploadedFile && (
        <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:p-6">
          <h4 className="tw:font-semibold tw:text-gray-900 tw:mb-4 tw:flex tw:items-center tw:gap-2">
            <Scan size={20} />
            Barcode Preview
          </h4>
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mb-4">
            <div className="tw:bg-white tw:rounded-lg tw:p-4 tw:border tw:border-blue-100">
              <div className="tw:text-2xl tw:font-bold tw:text-blue-600">
                89
              </div>
              <div className="tw:text-sm tw:text-gray-600">
                Products to Update
              </div>
            </div>
            <div className="tw:bg-white tw:rounded-lg tw:p-4 tw:border tw:border-blue-100">
              <div className="tw:text-2xl tw:font-bold tw:text-green-600">
                45
              </div>
              <div className="tw:text-sm tw:text-gray-600">New Barcodes</div>
            </div>
            <div className="tw:bg-white tw:rounded-lg tw:p-4 tw:border tw:border-blue-100">
              <div className="tw:text-2xl tw:font-bold tw:text-orange-600">
                12
              </div>
              <div className="tw:text-sm tw:text-gray-600">
                Duplicates Found
              </div>
            </div>
          </div>
          <div className="tw:flex tw:gap-3">
            <AppButton
              color="primary"
              className="tw:flex tw:items-center tw:gap-2"
            >
              <CheckCircle size={16} />
              Apply Barcode Changes
            </AppButton>
            <AppButton
              color="light"
              fill="outline"
              className="tw:flex tw:items-center tw:gap-2"
            >
              <X size={16} />
              Cancel
            </AppButton>
          </div>
        </div>
      )}

      {/* Instructions Section */}
      <div className="tw:bg-gray-50 tw:rounded-lg tw:p-6">
        <h4 className="tw:font-semibold tw:text-gray-900 tw:mb-4 tw:flex tw:items-center tw:gap-2">
          <FileText size={20} />
          Instructions
        </h4>
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
          <div className="tw:space-y-3">
            <div className="tw:flex tw:items-start tw:gap-3">
              <div className="tw:bg-purple-100 tw:text-purple-600 tw:rounded-full tw:w-6 tw:h-6 tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-medium tw:flex-shrink-0 tw:mt-0.5">
                1
              </div>
              <div>
                <h5 className="tw:font-medium tw:text-gray-900">
                  Download Barcode Template
                </h5>
                <p className="tw:text-sm tw:text-gray-600">
                  Get the Excel template with current barcode information
                </p>
              </div>
            </div>
            <div className="tw:flex tw:items-start tw:gap-3">
              <div className="tw:bg-purple-100 tw:text-purple-600 tw:rounded-full tw:w-6 tw:h-6 tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-medium tw:flex-shrink-0 tw:mt-0.5">
                2
              </div>
              <div>
                <h5 className="tw:font-medium tw:text-gray-900">
                  Update Barcodes
                </h5>
                <p className="tw:text-sm tw:text-gray-600">
                  Add new barcodes or modify existing ones in the Excel file
                </p>
              </div>
            </div>
          </div>
          <div className="tw:space-y-3">
            <div className="tw:flex tw:items-start tw:gap-3">
              <div className="tw:bg-purple-100 tw:text-purple-600 tw:rounded-full tw:w-6 tw:h-6 tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-medium tw:flex-shrink-0 tw:mt-0.5">
                3
              </div>
              <div>
                <h5 className="tw:font-medium tw:text-gray-900">
                  Upload Updated File
                </h5>
                <p className="tw:text-sm tw:text-gray-600">
                  Upload the modified Excel file with barcode changes
                </p>
              </div>
            </div>
            <div className="tw:flex tw:items-start tw:gap-3">
              <div className="tw:bg-purple-100 tw:text-purple-600 tw:rounded-full tw:w-6 tw:h-6 tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-medium tw:flex-shrink-0 tw:mt-0.5">
                4
              </div>
              <div>
                <h5 className="tw:font-medium tw:text-gray-900">
                  Review & Apply
                </h5>
                <p className="tw:text-sm tw:text-gray-600">
                  Review the barcode changes and apply them to your products
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeTab;

export function meta() {
  return [
    {
      title: "Bulk Upload - Barcode",
    },
  ];
}
