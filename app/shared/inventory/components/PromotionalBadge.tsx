import { Tag } from "lucide-react";
import React from "react";

interface PromotionalBadgeProps {
  className?: string;
  template?: 1 | 2;
}

const PromotionalBadge: React.FC<PromotionalBadgeProps> = ({
  className = "",
  template = 1,
}) => {
  if (template === 2) {
    return (
      <div
        className={`tw:text-purple-600 tw:text-xs tw:font-medium tw:flex tw:items-center tw:gap-1 ${className}`}
      >
        <Tag size={14} />
        Promotional Deal
      </div>
    );
  }

  return (
    <div
      title="Promotional Deal"
      className={`tw:flex tw:items-center tw:justify-center tw:w-4 tw:h-4 tw:rounded-full tw:bg-purple-500 tw:text-white tw:text-[9px] tw:font-bold tw:cursor-help tw:flex-shrink-0 ${className}`}
    >
      P
    </div>
  );
};

export default PromotionalBadge;
