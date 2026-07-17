import { FileSearch2 } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

interface NoDataProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

const NoData: React.FC<NoDataProps> = ({
  children,
  title,
  description,
  icon,
  className = "",
}) => {
  const { t } = useTranslation(["common"]);

  return (
    <div
      className={`tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-12 tw:px-4 ${className}`}
    >
      {children || (
        <div className="tw:text-center tw:max-w-sm">
          <div className="tw:mb-4 tw:flex tw:justify-center">
            {icon || (
              <div className="tw:p-4 tw:bg-slate-50 tw:rounded-full tw:border tw:border-slate-200">
                <FileSearch2 className="tw:text-slate-400" size={32} />
              </div>
            )}
          </div>
          <h3 className="tw:text-sm tw:font-semibold tw:text-slate-700 tw:mb-2">
            {title || t("noDataFoundTitle")}
          </h3>
          {description && (
            <p className="tw:text-sm tw:text-slate-500 tw:leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default NoData;
