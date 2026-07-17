import clsx from "clsx";
import { debounce } from "lodash";
import React, { useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Alpha from "~/components/core/alpha/Alpha";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

type BrowseCallbackParams = {
  action: string;
  data?: any;
};

interface BrowseContainerProps {
  children?: React.ReactNode;
  callback?: (params: BrowseCallbackParams) => void;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  isLoading: boolean;
  search?: string;
  alpha?: string;
  filterElement?: ReactNode | null;
}

const BrowseContainer: React.FC<BrowseContainerProps> = ({
  children,
  callback,
  className = "",
  title,
  subtitle,
  isLoading,
  search = "",
  alpha = "",
  filterElement,
}) => {
  const { t } = useTranslation(["common"]);

  // search and alpha are controlled by parent via props

  const triggerCallback = useCallback(
    (action: string, data?: any) => {
      callback && callback({ action, data });
    },
    [callback]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    triggerCallback("search", v);
  };

  const handleAlphaChange = (val: string) => {
    triggerCallback("alpha", val);
  };

  return (
    <div
      className={clsx(
        "tw:bg-white tw:rounded-md tw:overflow-hidden tw:border tw:border-gray-200",
        className
      )}
    >
      <div className="tw:bg-gray-50 tw:px-4 tw:py-2 tw:mb-4">
        <div className="tw:flex tw:items-center tw:justify-between">
          <div>
            <div className="tw:font-semibold tw:mb-1 tw:text-lg">{title}</div>
            <div className="tw:text-xs tw:text-gray-500">{subtitle}</div>
          </div>
          <div>{/* placeholder for potential header actions */}</div>
        </div>
      </div>

      <div className="tw:flex tw:bg-white">
        <div className="tw:px-1">
          <Alpha
            selected={alpha}
            callback={handleAlphaChange}
            className="tw:h-[calc(100vh-200px)] tw:mb-2"
            orientation="vertical"
          />
        </div>

        <div className="tw:flex-1">
          <AppScrollArea className="tw:h-[calc(100vh-200px)] no-table tw:pe-2">
            <div className="tw:mb-2 tw:flex tw:items-center tw:gap-2 tw:w-full tw:md:flex-row tw:flex-col tw:mt-0.5">
              <input
                type="text"
                className="tw:w-full tw:px-2 tw:border tw:border-gray-200 tw:rounded-md tw:h-8 tw:bg-gray-50 tw:outline-none tw:text-xs"
                placeholder={t("searchByName")}
                value={search}
                onChange={handleSearchChange}
              />
              {filterElement}
            </div>

            {isLoading ? (
              <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
                <AppSpinner />
              </div>
            ) : null}

            <div>{children}</div>
          </AppScrollArea>
        </div>
      </div>
    </div>
  );
};

export default BrowseContainer;
