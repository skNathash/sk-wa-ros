import clsx from "clsx";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

interface AppCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  footer?: React.ReactNode;
  noPadding?: boolean;
  noContentPadding?: boolean;
  bordered?: boolean;
  icon?: string | React.ReactNode;
  noShadow?: boolean;
  iconClassName?: string;
  noOverflow?: boolean;
}

const AppCard: React.FC<AppCardProps> = ({
  children,
  title,
  subtitle,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
  footer,
  noPadding = false,
  noContentPadding = false,
  bordered = false,
  icon,
  noShadow = false,
  iconClassName = "",
  noOverflow = false,
}) => {
  return (
    <Card
      className={`tw:mb-4 tw:gap-2 ${noOverflow ? "" : "tw:overflow-clip"} ${noShadow ? "tw:shadow-none" : ""} ${
        noPadding ? "tw:py-0" : ""
      } ${className}`}
    >
      {title || subtitle ? (
        <CardHeader className={headerClassName}>
          <CardTitle className="tw:flex tw:items-center tw:gap-2">
            {typeof icon === "string" ? null : icon ? (
              <span className={`tw:mr-2 ${iconClassName}`}>{icon}</span>
            ) : null}
            {title}
          </CardTitle>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
      ) : null}
      <CardContent
        className={clsx(
          noContentPadding || noPadding ? "tw:p-0" : "",
          bodyClassName,
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
};

export default AppCard;
