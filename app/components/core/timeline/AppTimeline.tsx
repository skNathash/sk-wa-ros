import { DynamicIcon } from "lucide-react/dynamic";
import React from "react";

const AppTimeline = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className="tw:w-full tw:flex tw:flex-col">{children}</div>;
};

AppTimeline.Item = ({
  icon,
  iconClassName,
  children,
  className,
  iconSize = 16,
}: {
  icon: string;
  iconClassName: string;
  children: React.ReactNode;
  className?: string;
  iconSize?: number;
}) => {
  return (
    <div
      className={`tw:flex tw:gap-4 tw:mb-4 tw:items-start tw:w-full ${className}`}
    >
      <div className="tw:flex tw:flex-col tw:gap-1 tw:items-center tw:justify-start tw:h-full tw:self-stretch">
        <span
          className={`tw:inline-flex tw:items-center tw:justify-center tw:w-8 tw:h-8 ${iconClassName} tw:rounded-full`}
        >
          <DynamicIcon name={icon as any} size={iconSize} />
        </span>

        <div className="tw:w-1 tw:border-l-2 tw:border-blue-700 tw:h-16">
          &nbsp;
        </div>
      </div>
      <div className="tw:w-full">{children}</div>
    </div>
  );
};

export default AppTimeline;
