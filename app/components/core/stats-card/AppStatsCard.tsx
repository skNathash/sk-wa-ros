import clsx from "clsx";
import { Info } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import React from "react";
import AppCard from "../card/AppCard";
import AppPopover from "../popover/AppPopover";
import AppStatsCardTemplate2 from "./AppStatsCardTemplate2";
import { colorClasses } from "./helpers";

interface AppStatsCardProps {
  label: string;
  children: React.ReactNode;
  icon?: string | React.ReactNode;
  color?: "primary" | "secondary" | "warning" | "danger" | "info" | "success";
  active?: boolean;
  className?: string;
  onClick?: () => void;
  bg?: boolean; // Add bg prop
  template?: 1 | 2; // Add template prop
  info?: React.ReactNode;
}

const AppStatsCard: React.FC<AppStatsCardProps> = ({
  label,
  children,
  icon,
  color = "primary",
  active = false,
  className = "",
  onClick,
  bg = false, // Default bg to false
  template = 1, // Default template to 1
  info,
}) => {
  const currentColor = colorClasses[color];

  if (template === 2) {
    return (
      <AppStatsCardTemplate2
        label={label}
        icon={icon}
        color={color}
        active={active}
        className={className}
        onClick={onClick}
        bg={bg}
        info={info}
      >
        {children}
      </AppStatsCardTemplate2>
    );
  }

  return (
    <AppCard
      className={clsx(
        "tw:my-1 tw:py-2",
        active ? currentColor.activeBorder : "",
        active && "tw:shadow-sm tw:ring-1 tw:ring-opacity-20",
        active && currentColor.text.replace("text", "ring"),
      )}
      bodyClassName="tw:px-4"
    >
      <div
        className={clsx(
          bg ? currentColor.bg : "tw:bg-white", // Only one bg class at a time
          onClick && "tw:cursor-pointer",
          className,
        )}
        onClick={onClick}
      >
        {/* Label on top */}
        <div className="tw:mb-1">
          <span
            className={clsx(
              "tw:text-xs tw:md:text-xs tw:leading-tight tw:uppercase tw:font-semibold tw:text-gray-600 tw:flex tw:items-center tw:gap-1",
            )}
          >
            <span className="tw:line-clamp-1">{label}</span>
            {info && (
              <AppPopover
                triggerContent={
                  <button className="tw:text-gray-500 tw:cursor-pointer tw:shrink-0">
                    <Info size={12} />
                  </button>
                }
              >
                {info}
              </AppPopover>
            )}
          </span>
        </div>

        {/* Icon and children in a flex row, justify-between */}
        <div className="tw:flex tw:items-center tw:justify-between">
          <div className={clsx(currentColor.text, "tw:flex-1")}>{children}</div>
          {icon && (
            <span
              className={clsx(
                currentColor.bg,
                "tw:rounded-lg tw:p-1 tw:flex tw:items-center tw:justify-center",
              )}
            >
              {typeof icon === "string" ? (
                <DynamicIcon
                  name={icon as any}
                  className={clsx("tw:text-3xl", colorClasses[color].text)}
                />
              ) : (
                <span className={clsx("tw:text-3xl", colorClasses[color].text)}>
                  {icon}
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </AppCard>
  );
};

export default AppStatsCard;
