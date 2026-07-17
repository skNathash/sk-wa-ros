import { Download, FileText } from "lucide-react";
import { useCallback } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";

interface ReportDownloadOptionModalProps {
  show: boolean;
  callback: (data: { action: string; option?: string }) => void;
}

// Logo SVG components
const TallyLogo = () => (
  <svg
    viewBox="0 0 100 100"
    className="tw:w-12 tw:h-12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" fill="#E8E8E8" rx="8" />
    <text
      x="50"
      y="60"
      fontSize="48"
      fontWeight="bold"
      textAnchor="middle"
      fill="#1F1F1F"
      fontFamily="Arial, sans-serif"
    >
      T
    </text>
  </svg>
);

const ZohoLogo = () => (
  <svg
    viewBox="0 0 100 100"
    className="tw:w-12 tw:h-12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" fill="#3B82F6" rx="8" />
    <circle cx="35" cy="35" r="15" fill="white" />
    <circle cx="65" cy="35" r="15" fill="white" />
    <circle cx="35" cy="65" r="15" fill="white" />
    <circle cx="65" cy="65" r="15" fill="white" />
  </svg>
);

const QuickBooksLogo = () => (
  <svg
    viewBox="0 0 100 100"
    className="tw:w-12 tw:h-12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" fill="#1A7F64" rx="8" />
    <path d="M30 30H70V45H30V30Z" fill="white" opacity="0.9" />
    <path d="M30 50H50V70H30V50Z" fill="white" opacity="0.7" />
    <path d="M55 50H70V70H55V50Z" fill="white" opacity="0.8" />
  </svg>
);

const ExcelLogo = () => (
  <svg
    viewBox="0 0 100 100"
    className="tw:w-12 tw:h-12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" fill="#217245" rx="8" />
    <g fill="white" opacity="0.9">
      <rect x="25" y="25" width="12" height="12" />
      <rect x="40" y="25" width="12" height="12" />
      <rect x="55" y="25" width="12" height="12" />
      <rect x="25" y="42" width="12" height="12" />
      <rect x="40" y="42" width="12" height="12" />
      <rect x="55" y="42" width="12" height="12" />
      <rect x="25" y="59" width="12" height="12" />
      <rect x="40" y="59" width="12" height="12" />
      <rect x="55" y="59" width="12" height="12" />
    </g>
  </svg>
);

interface DownloadOption {
  key: string;
  label: string;
  description: string;
  Icon: React.FC;
  color: string;
}

const downloadOptions: DownloadOption[] = [
  {
    key: "tally",
    label: "Tally",
    description: "Export for Tally ERP",
    Icon: TallyLogo,
    color: "tw:bg-gray-100 hover:tw:bg-gray-200",
  },
  {
    key: "zoho",
    label: "Zoho Books",
    description: "Export for Zoho",
    Icon: ZohoLogo,
    color: "tw:bg-blue-50 hover:tw:bg-blue-100",
  },
  {
    key: "quickbooks",
    label: "QuickBooks",
    description: "Export for QB",
    Icon: QuickBooksLogo,
    color: "tw:bg-green-50 hover:tw:bg-green-100",
  },
  {
    key: "excel",
    label: "Excel",
    description: "Export as .xlsx file",
    Icon: ExcelLogo,
    color: "tw:bg-emerald-50 hover:tw:bg-emerald-100",
  },
];

const ReportDownloadOptionModal = ({
  show,
  callback,
}: ReportDownloadOptionModalProps) => {
  const handleClose = useCallback(() => {
    callback({ action: "close" });
  }, [callback]);

  const handleDownload = useCallback(
    (option: string) => {
      callback({ action: "download", option });
    },
    [callback],
  );

  return (
    <AppModal
      show={show}
      callback={() => handleClose()}
      className="tw:max-w-2xl"
    >
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <Download size={20} />
          <div>
            <div className="tw:text-lg tw:font-semibold">Download Report</div>
            <div className="tw:text-sm tw:text-gray-500 tw:font-normal tw:mt-1">
              Select your preferred format to export
            </div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:px-6 tw:py-6">
        <div className="tw:grid tw:grid-cols-2 md:tw:grid-cols-4 tw:gap-3">
          {downloadOptions.map((option) => {
            const { Icon } = option;
            return (
              <button
                key={option.key}
                onClick={() => handleDownload(option.key)}
                className={`tw:p-4 tw:rounded-lg tw:border-2 tw:border-gray-200 tw:transition-all tw:duration-200 ${option.color} hover:tw:border-gray-300 tw:flex tw:flex-col tw:items-center tw:gap-2 tw:text-center tw:cursor-pointer active:tw:scale-95`}
              >
                <Icon />
                <div className="tw:font-semibold tw:text-sm tw:text-gray-900">
                  {option.label}
                </div>
                <div className="tw:text-xs tw:text-gray-600">
                  {option.description}
                </div>
              </button>
            );
          })}
        </div>

        <div className="tw:mt-6 tw:p-3 tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:flex tw:gap-2">
          <FileText
            size={16}
            className="tw:text-blue-600 tw:flex-shrink-0 tw:mt-0.5"
          />
          <p className="tw:text-xs tw:text-blue-800">
            Choose a format that works best with your accounting software
          </p>
        </div>
      </AppModal.Content>

      <AppModal.Footer className="tw:flex tw:justify-end tw:gap-2">
        <AppButton color="light" onClick={handleClose}>
          Cancel
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ReportDownloadOptionModal;
