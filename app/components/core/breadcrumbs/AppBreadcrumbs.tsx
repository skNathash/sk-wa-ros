import clsx from "clsx";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem as UiBreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

interface AppBreadcrumbsProps {
  data: BreadcrumbItem[];
  className?: string;
}

const AppBreadcrumbs: React.FC<AppBreadcrumbsProps> = ({ data, className }) => {
  const { t } = useTranslation(["common"]);

  const appNav = useAppNav();

  // Helper function to render breadcrumb label with translation support
  const renderLabel = useCallback(
    (item: BreadcrumbItem) => {
      if (item.langKey) {
        return t(item.langKey, item.langParams || {});
      }
      return item.label;
    },
    [t],
  );

  if (!data || data.length === 0) return null;

  return (
    <Breadcrumb className={clsx("app-breadcrumbs tw:mb-2", className)}>
      <BreadcrumbList>
        {data.map((item, index) => {
          const isLast = index === data.length - 1;
          return (
            <React.Fragment key={index}>
              <UiBreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{renderLabel(item)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      to={getPath(item.redirect || { path: "" })}
                      className="tw:inline-flex tw:items-center tw:text-sm tw:font-medium"
                      onClick={(e) => {
                        if (item.redirect?.isGoBack) {
                          e.preventDefault();
                          appNav.back();
                        }
                      }}
                    >
                      {renderLabel(item)}
                    </Link>
                  </BreadcrumbLink>
                )}
              </UiBreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

// Helper function to handle path parameters
const getPath = (redirect: {
  path: string;
  params?: Record<string, string>;
}): string => {
  let path = redirect.path;
  let queryParams: Record<string, string> = {};
  if (redirect.params) {
    Object.entries(redirect.params).forEach(([key, value]) => {
      const paramPattern = `:${key}`;
      if (path.includes(paramPattern)) {
        path = path.replace(paramPattern, value);
      } else {
        queryParams[key] = value;
      }
    });
  }
  const queryString = Object.keys(queryParams).length
    ? `?${new URLSearchParams(queryParams).toString()}`
    : "";
  const fullPath = `${path}${queryString}`;
  return fullPath;
};

export default AppBreadcrumbs;
