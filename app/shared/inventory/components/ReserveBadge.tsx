import { AlertTriangle } from "lucide-react";
import React from "react";

interface ReserveBadgeProps {
  className?: string;
  template?: 1 | 2;
}

const ReserveBadge: React.FC<ReserveBadgeProps> = ({
  className = "",
  template = 1,
}) => {
  if (template === 2) {
    return (
      <div
        className={`tw:text-orange-600 tw:text-xs tw:font-medium tw:flex tw:items-center tw:gap-1 ${className}`}
      >
        <AlertTriangle size={14} />
        Reserve order
      </div>
    );
  }

  return (
    <div
      title="Reserve Product"
      className={`tw:flex tw:items-center tw:justify-center tw:w-4 tw:h-4 tw:rounded-full tw:bg-orange-500 tw:text-white tw:text-[9px] tw:font-bold tw:cursor-help tw:flex-shrink-0 ${className}`}
    >
      R
    </div>
  );
};

export default ReserveBadge;
