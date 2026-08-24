import { User } from "lucide-react";
import React from "react";
import AppCard from "~/components/core/card/AppCard";
import type { EmployeeDetails } from "../helper";

interface EmployeeBasicInfoProps {
  employee: EmployeeDetails;
  className?: string;
}

const EmployeeBasicInfo: React.FC<EmployeeBasicInfoProps> = ({
  employee,
  className,
}) => {
  return (
    <AppCard className={`tw:py-3! ${className || ""}`}>
      <div className="tw:mb-2 tw:flex tw:items-center tw:gap-1.5 tw:border-b tw:border-gray-100 tw:pb-1.5 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
        <User size={13} className="tw:text-gray-400" />
        Employee Details
      </div>
      <div className="tw:flex tw:items-center tw:gap-2.5">
        <div className="tw:flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full tw:bg-blue-50 tw:text-blue-600 tw:shrink-0">
          <User size={18} />
        </div>
        <div className="tw:min-w-0">
          <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:line-clamp-1">
            {employee.name || "-"}
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:line-clamp-1">
            {employee.email || "-"}
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default EmployeeBasicInfo;
