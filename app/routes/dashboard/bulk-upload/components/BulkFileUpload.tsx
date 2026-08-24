import { FileText } from "lucide-react";
import React from "react";
import AppCard from "~/components/core/card/AppCard";
import FileUpload from "~/components/core/file-upload/FileUpload";
import { useIsMobile } from "~/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  const handleFileUpload = (response: any) => {
    onUpload(response);
  };

  // Convert accepted formats to allowed extensions for FileUpload component
  const allowedExtensions = acceptedFormats.map((format) =>
    format.replace(".", "").toLowerCase()
  );

  return (
    <AppCard
      /* The drop zone already says "Upload your file"; a card heading above it
         saying the same thing is a wasted line on a phone. */
      title={isMobile ? undefined : title}
      className={`tw:mb-4 tw:sm:mb-6 ${className}`}
      noShadow
      bordered
    >
      <div className="tw:space-y-3 tw:sm:space-y-4">
        {/* Same reasoning as the info card: the description only paraphrases
            the title, so it stays out of the mobile viewport. */}
        {description && (
          <p className="tw:hidden tw:sm:block tw:text-sm tw:text-gray-600 tw:leading-relaxed">
            {description}
          </p>
        )}

        <div className="tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:p-4 tw:sm:p-8 tw:text-center">
          <FileUpload
            uploadUrl={uploadUrl}
            onFileUpload={handleFileUpload}
            maxSizeMB={maxSizeMB}
            allowedExtensions={allowedExtensions}
            accept={acceptedFormats.join(",")}
            dontUseNative={true} // Disable Cordova features for bulk upload
            label="Choose File"
            note={
              /* Mobile states the formats on the drop zone's own subline
                 instead — repeating them here made three stacked captions. */
              <div className="tw:hidden tw:sm:block tw:text-xs tw:text-gray-400 tw:mt-2">
                Supported formats: {acceptedFormats.join(", ")} (Max {maxSizeMB}
                MB)
              </div>
            }
          >
            {/* Icon sits beside the label on mobile — stacked it burns most of
                the fold on a decorative circle. */}
            <div className="tw:flex tw:items-center tw:justify-center tw:gap-3 tw:text-left tw:sm:flex-col tw:sm:gap-4 tw:sm:text-center">
              <div className="app-upload-icon tw:bg-blue-50 tw:text-blue-600 tw:rounded-full tw:p-2.5 tw:sm:p-4 tw:shrink-0">
                <FileText className="tw:size-6 tw:sm:size-7" />
              </div>
              <div>
                <h3 className="tw:text-base tw:sm:text-lg tw:font-medium tw:text-gray-900 tw:sm:mb-2">
                  Upload your file
                </h3>
                <p className="tw:text-xs tw:text-gray-500 tw:sm:hidden">
                  {acceptedFormats.join(", ")} · max {maxSizeMB}MB
                </p>
                <p className="tw:hidden tw:sm:block tw:text-sm tw:text-gray-500">
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
