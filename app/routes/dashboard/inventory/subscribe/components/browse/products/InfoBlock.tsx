import AppButton from "~/components/core/button/AppButton";
import { ChevronLeft } from "lucide-react";

const InfoBlock = ({
  onBack,
  title,
  description,
}: {
  onBack: () => void;
  title: string;
  description: string;
}) => {
  return (
    <div className="tw:mb-4 tw:flex tw:items-center tw:gap-2">
      <div>
        <AppButton size="small" onClick={onBack} noShadow fill="outline">
          <ChevronLeft size={16} className="tw:mr-1" aria-hidden />
          Back
        </AppButton>
      </div>
      <div>
        <div className="tw:text-lg tw:font-bold tw:mb-1">{title}</div>
        <div className="tw:text-xs tw:text-gray-500">{description}</div>
      </div>
    </div>
  );
};

export default InfoBlock;
