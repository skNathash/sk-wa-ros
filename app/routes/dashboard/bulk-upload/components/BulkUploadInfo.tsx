import React, { useState } from "react";
import { Download, FileText, Info } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import DownloadInventoryModal from "../modals/DownloadInventoryModal";

interface BulkUploadInfoProps {
  title: string;
  icon?: string | React.ReactNode;
  requiredFormat: string;
  /** Column names to show as chips. Preferred over the `requiredFormat`
   *  sentence, which stays as the fallback (and the desktop long form). */
  columns?: string[];
  /** Short constraint line shown under the chips, e.g. "Max 50 products". */
  limitNote?: string;
  /** Heading above the chips. Defaults to the Excel-template wording. */
  formatTitle?: string;
  /** Noun for the download action ("Download {templateLabel}"). */
  templateLabel?: string;
  onDownloadTemplate: () => void;
  showDownloadInventory?: boolean;
  description?: string;
  className?: string;
}

const BulkUploadInfo: React.FC<BulkUploadInfoProps> = ({
  title,
  icon = "info",
  requiredFormat,
  columns,
  limitNote,
  formatTitle = "Required Format",
  templateLabel = "Template",
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
      className={`tw:mb-4 tw:sm:mb-6 ${className}`}
      noShadow
      bordered
    >
      <div className="tw:space-y-3 tw:sm:space-y-4">
        {/* The description restates the card title in longer words — it earns
            its space on desktop only, where nothing is competing for it. */}
        {description && (
          <p className="tw:hidden tw:sm:block tw:text-sm tw:text-gray-600 tw:leading-relaxed">
            {description}
          </p>
        )}

        {/* Flat on mobile: boxing this inside the card produced a panel inside
            a panel for what is the card's only content. Desktop keeps the
            callout chrome, where the card holds a description above it.
            app-note-* are the seams the active theme repaints (theme-2.css). */}
        <div className="app-note-panel tw:rounded-lg tw:sm:bg-blue-50 tw:sm:border tw:sm:border-blue-200 tw:sm:p-4">
          <div className="tw:flex tw:items-start tw:gap-2 tw:sm:gap-3">
            {/* The card title already carries an icon; a second one directly
                under it is noise at mobile width. */}
            <FileText
              className="app-accent-icon tw:hidden tw:sm:block tw:text-blue-600 tw:mt-0.5 tw:shrink-0"
              size={18}
            />
            <div className="tw:flex-1 tw:min-w-0">
              <h4 className="app-note-title tw:text-xs tw:uppercase tw:tracking-wide tw:text-gray-500 tw:font-medium tw:mb-2 tw:sm:text-sm tw:sm:normal-case tw:sm:tracking-normal tw:sm:text-blue-900">
                {formatTitle}
              </h4>
              {columns?.length ? (
                <>
                  {/* Column names scan far faster as chips than buried in a
                      sentence; the sentence stays for desktop. */}
                  <div className="tw:flex tw:flex-wrap tw:gap-1.5 tw:sm:hidden">
                    {columns.map((column) => (
                      <span
                        key={column}
                        className="tw:rounded-md tw:bg-gray-50 tw:border tw:border-gray-200 tw:px-2 tw:py-1 tw:text-xs tw:font-medium tw:text-gray-700"
                      >
                        {column}
                      </span>
                    ))}
                  </div>
                  {limitNote && (
                    <p className="app-note-text tw:mt-2 tw:text-xs tw:text-gray-500 tw:sm:hidden">
                      {limitNote}
                    </p>
                  )}
                  <p className="app-note-text tw:hidden tw:sm:block tw:text-sm tw:text-blue-800">
                    {requiredFormat}
                  </p>
                </>
              ) : (
                <p className="app-note-text tw:text-sm tw:text-blue-800">
                  {requiredFormat}
                </p>
              )}

              {/* Two up on mobile so the pair reads as one action row instead
                  of two full-width bars pushing the upload box off screen. */}
              <div className="tw:mt-4 tw:pt-3 tw:border-t tw:border-gray-100 tw:grid tw:grid-cols-2 tw:gap-2 tw:sm:mt-3 tw:sm:pt-0 tw:sm:border-t-0 tw:sm:flex tw:sm:flex-wrap tw:sm:gap-3">
                <AppButton
                  size="small"
                  fill="outline"
                  color="primary"
                  onClick={onDownloadTemplate}
                  className="tw:inline-flex tw:w-full tw:items-center tw:justify-center tw:gap-1.5 tw:sm:w-auto tw:sm:gap-2"
                >
                  <Download size={16} />
                  <span className="tw:truncate">
                    <span className="tw:hidden tw:sm:inline">Download </span>
                    {templateLabel}
                  </span>
                </AppButton>
                {showDownloadInventory && (
                  <AppButton
                    size="small"
                    fill="outline"
                    color="primary"
                    onClick={() => setDownloadModal({ show: true })}
                    className="tw:inline-flex tw:w-full tw:items-center tw:justify-center tw:gap-1.5 tw:sm:w-auto tw:sm:gap-2"
                  >
                    <Download size={16} />
                    <span className="tw:truncate">
                      <span className="tw:hidden tw:sm:inline">Download </span>
                      Inventory
                    </span>
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
