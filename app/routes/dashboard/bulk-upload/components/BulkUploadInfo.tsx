import React, { useState } from "react";
import { Download, FileText, Info } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import DownloadInventoryModal from "../modals/DownloadInventoryModal";

interface BulkUploadInfoProps {
  title: string;
  icon?: string | React.ReactNode;
  requiredFormat: string;
  onDownloadTemplate: () => void;
  showDownloadInventory?: boolean;
  description?: string;
  className?: string;
}

const BulkUploadInfo: React.FC<BulkUploadInfoProps> = ({
  title,
  icon = "info",
  requiredFormat,
  onDownloadTemplate,
  showDownloadInventory = false,
  description,
  className = "",
}) => {
  const [downloadModal, setDownloadModal] = useState<{
    show: boolean;
  }>({ show: false });

  const handleDownloadModal = ({ action }: any) => {
    if (action === "close") {
      setDownloadModal({ show: false });
    }
  };
  return (
    <AppCard
      title={title}
      icon={icon}
      className={`tw:mb-6 ${className}`}
      noShadow
      bordered
    >
      <div className="tw:space-y-4">
        {description && (
          <p className="tw:text-sm tw:text-gray-600 tw:leading-relaxed">
            {description}
          </p>
        )}

        <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:p-4">
          <div className="tw:flex tw:items-start tw:gap-3">
            <FileText
              className="tw:text-blue-600 tw:mt-0.5 tw:flex-shrink-0"
              size={18}
            />
            <div className="tw:flex-1">
              <h4 className="tw:text-sm tw:font-medium tw:text-blue-900 tw:mb-1">
                Required Format
              </h4>
              <p className="tw:text-sm tw:text-blue-800 tw:mb-3">
                {requiredFormat}
              </p>
              <div className="tw:flex tw:gap-3 tw:flex-wrap">
                <AppButton
                  size="small"
                  fill="outline"
                  color="primary"
                  onClick={onDownloadTemplate}
                  className="tw:inline-flex tw:items-center tw:gap-2"
                >
                  <Download size={16} />
                  Download Template
                </AppButton>
                {showDownloadInventory && (
                  <AppButton
                    size="small"
                    fill="outline"
                    color="secondary"
                    onClick={() => setDownloadModal({ show: true })}
                    className="tw:inline-flex tw:items-center tw:gap-2"
                  >
                    <Download size={16} />
                    Download Inventory
                  </AppButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showDownloadInventory && (
        <DownloadInventoryModal
          show={downloadModal.show}
          callback={handleDownloadModal}
        />
      )}
    </AppCard>
  );
};

export default BulkUploadInfo;
