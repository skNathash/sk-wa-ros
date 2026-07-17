import { AlertTriangle } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";

interface PlatformFeeRequiredBlockProps {
  onSubscribe: () => void;
  title?: string;
  description?: string;
  className?: string;
}

const PlatformFeeRequiredBlock: React.FC<PlatformFeeRequiredBlockProps> = ({
  onSubscribe,
  title = "Platform Fee Plan Required",
  description = "Subscribe to add stock and manage inventory.",
  className = "",
}) => {
  return (
    <div
      className={`tw:rounded-md tw:p-3 tw:bg-red-50 tw:border tw:border-red-200 tw:flex tw:items-center tw:justify-between tw:mb-4 tw:shadow-sm ${className}`}
    >
      <div className="tw:flex tw:items-center tw:gap-2">
        <AlertTriangle className="tw:w-4 tw:h-4 tw:text-red-600" />
        <div>
          <p className="tw:text-sm tw:font-medium tw:text-red-800">{title}</p>
          <p className="tw:text-xs tw:text-red-700">{description}</p>
        </div>
      </div>
      <AppButton
        size="small"
        color="primary"
        onClick={onSubscribe}
        className="tw:bg-red-600 hover:tw:bg-red-700 tw:text-white"
      >
        Subscribe
      </AppButton>
    </div>
  );
};

export default PlatformFeeRequiredBlock;
