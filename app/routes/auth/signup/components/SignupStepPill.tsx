import { CheckCircle, ChevronDown } from "lucide-react";

interface SignupStepPillProps {
  title: string;
  onClick: () => void;
  className?: string;
}

const SignupStepPill = ({ title, onClick, className }: SignupStepPillProps) => {
  return (
    <div onClick={onClick} className={`tw:cursor-pointer ${className || ""}`}>
      <div className="tw:flex tw:items-center tw:bg-white tw:rounded-md tw:shadow tw:px-4 tw:py-2 tw:gap-3">
        <span className="tw:inline-flex tw:items-center tw:justify-center tw:bg-green-100 tw:text-green-700 tw:rounded-full tw:w-6 tw:h-6">
          <CheckCircle className="tw:w-4 tw:h-4" />
        </span>

        <div className="tw:text-sm tw:font-medium tw:text-gray-800 tw:flex-1">
          {title}
        </div>

        <span className="tw:inline-flex tw:items-center tw:ml-2 tw:text-gray-400">
          <ChevronDown className="tw:w-4 tw:h-4" />
        </span>
      </div>
    </div>
  );
};

export default SignupStepPill;
