import { FileText, Upload } from "lucide-react";
import React from "react";
import AppCard from "~/components/core/card/AppCard";
import FileUpload from "~/components/core/file-upload/FileUpload";

interface BulkFileUploadProps {
  onUpload: (file: File) => void;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  title?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  uploadUrl?: string;
}

const BulkFileUpload: React.FC<BulkFileUploadProps> = ({
  onUpload,
  acceptedFormats = [".xlsx", ".xls", ".csv"],
  maxSizeMB = 10,
  title = "Upload File",
  description,
  className = "",
  uploadUrl,
}) => {
  const handleFileUpload = (response: any) => {
    onUpload(response);
  };

  // Convert accepted formats to allowed extensions for FileUpload component
  const allowedExtensions = acceptedFormats.map((format) =>
    format.replace(".", "").toLowerCase()
  );

  return (
    <AppCard title={title} className={`tw:mb-6 ${className}`} noShadow bordered>
      <div className="tw:space-y-4">
        {description && (
          <p className="tw:text-sm tw:text-gray-600 tw:leading-relaxed">
            {description}
          </p>
        )}

        <div className="tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:p-8 tw:text-center">
          <FileUpload
            uploadUrl={uploadUrl}
            onFileUpload={handleFileUpload}
            maxSizeMB={maxSizeMB}
            allowedExtensions={allowedExtensions}
            accept={acceptedFormats.join(",")}
            dontUseNative={true} // Disable Cordova features for bulk upload
            label="Choose File"
            note={
              <div className="tw:text-xs tw:text-gray-400 tw:mt-2">
                Supported formats: {acceptedFormats.join(", ")} (Max {maxSizeMB}
                MB)
              </div>
            }
          >
            <div className="tw:flex tw:flex-col tw:items-center tw:gap-4">
              <div className="tw:bg-blue-50 tw:rounded-full tw:p-4">
                <FileText className="tw:text-blue-600" size={32} />
              </div>
              <div>
                <h3 className="tw:text-lg tw:font-medium tw:text-gray-900 tw:mb-2">
                  Upload your file
                </h3>
                <p className="tw:text-sm tw:text-gray-500">
                  Click here to select your file
                </p>
              </div>
            </div>
          </FileUpload>
        </div>
      </div>
    </AppCard>
  );
};

export default BulkFileUpload;
