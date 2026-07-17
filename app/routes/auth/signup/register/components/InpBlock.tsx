import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "~/hooks/use-mobile";

const InpBlock = ({
  children,
  title,
  defaultExpanded = true,
  icon,
  expandOnDesktop = false,
  className = "",
}: {
  children: React.ReactNode;
  title: string;
  defaultExpanded?: boolean;
  icon?: React.ReactNode;
  expandOnDesktop?: boolean;
  className?: string;
}) => {
  const isMobile = useIsMobile();
  const shouldExpand = expandOnDesktop ? !isMobile : defaultExpanded;
  const [isExpanded, setIsExpanded] = useState(shouldExpand);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`tw:rounded-sm tw:bg-white tw:shadow-sm tw:mb-4 tw:overflow-hidden tw:flex tw:flex-col ${className}`}
    >
      <div
        className="tw:p-4 tw:cursor-pointer tw:flex tw:items-center tw:justify-between tw:border-b tw:border-gray-100 hover:tw:bg-gray-50 tw:transition-colors"
        onClick={toggleExpanded}
      >
        <div className="tw:flex tw:items-center tw:gap-2">
          {icon && <div className="tw:text-app-primary">{icon}</div>}
          <div className="tw:font-semibold tw:text-app-primary">{title}</div>
        </div>
        {isExpanded ? (
          <ChevronUp
            className="tw:text-app-primary tw:text-lg tw:transition-transform"
            size={18}
          />
        ) : (
          <ChevronDown
            className="tw:text-app-primary tw:text-lg tw:transition-transform"
            size={18}
          />
        )}
      </div>
      <div
        className={`tw:transition-all tw:duration-300 tw:ease-in-out ${isExpanded
          ? "tw:max-h-full tw:opacity-100"
          : "tw:max-h-0 tw:opacity-0"
          }`}
      >
        <div className="tw:p-4 tw:flex-1 tw:flex tw:flex-col">{children}</div>
      </div>
    </div>
  );
};

export default InpBlock;
