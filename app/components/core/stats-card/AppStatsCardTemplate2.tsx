import clsx from "clsx";
import React from "react";
import { colorClasses } from "./helpers";
import AppCard from "../card/AppCard";
import { DynamicIcon } from "lucide-react/dynamic";
import AppPopover from "../popover/AppPopover";
import { Info } from "lucide-react";

interface AppStatsCardTemplate2Props {
  label: string;
  children: React.ReactNode;
  icon?: string | React.ReactNode;
  color?: "primary" | "secondary" | "warning" | "danger" | "info" | "success";
  active?: boolean;
  className?: string;
  onClick?: () => void;
  bg?: boolean;
  info?: React.ReactNode;
}

const AppStatsCardTemplate2: React.FC<AppStatsCardTemplate2Props> = ({
  label,
  children,
  icon,
  color = "primary",
  active = false,
  className = "",
  onClick,
  bg = false,
  info,
}) => {
  const currentColor = colorClasses[color];

  return (
    <AppCard
      className={clsx(
        "tw:my-1 tw:py-2",
        active ? currentColor.activeBorder : "tw:border-gray-50",
        active && "tw:shadow-sm tw:ring-1 tw:ring-opacity-20",
        active && currentColor.text.replace("text", "ring"),
        bg && currentColor.bg
      )}
      bodyClassName="tw:px-2"
    >
      <div
        className={clsx(onClick && "tw:cursor-pointer", className)}
        onClick={onClick}
      >
        <div className="tw:flex tw:items-center">
          {icon && (
            <span
              className={clsx(
                currentColor.bg,
                "tw:rounded-lg tw:p-1.5 tw:flex tw:items-center tw:justify-center tw:mr-3"
              )}
            >
              {typeof icon === "string" ? (
                <DynamicIcon
                  name={icon as any}
                  className={clsx("tw:text-3xl", colorClasses[color].text)}
                />
              ) : (
                <span className={clsx("tw:text-2xl", colorClasses[color].text)}>
                  {icon}
                </span>
              )}
            </span>
          )}
          <div className="tw:flex-1">
            <div className="tw:mb-1">
              <span
                className={clsx(
                  "tw:text-xs tw:md:text-xs tw:leading-tight tw:uppercase tw:font-medium tw:text-gray-600 tw:flex tw:items-center tw:gap-1"
                )}
              >
                <span className="tw:line-clamp-1">{label}</span>
                {info && (
                  <AppPopover
                    triggerContent={
                      <button className="tw:text-xs tw:text-gray-500 tw:ml-2 tw:cursor-pointer">
                        <Info size={12} />
                      </button>
                    }
                  >
                    {info}
                  </AppPopover>
                )}
              </span>
            </div>
            <div>{children}</div>
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default AppStatsCardTemplate2;
