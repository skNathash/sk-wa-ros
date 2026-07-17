import { Eye, FileText } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";

interface MobileViewProps {
  data: any[];
  callback: (a: { action: string; data: any }) => void;
  loading?: boolean;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  callback,
  loading = false,
}) => {
  const { t } = useTranslation(["common"]);
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      case "pending":
        return "warning";
      case "notfound":
        return "danger";
      default:
        return "light";
    }
  };

  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="tw:bg-white tw:p-4 tw:rounded-lg tw:border tw:border-gray-200"
          >
            <div className="tw:animate-pulse">
              <div className="tw:flex tw:items-start tw:mb-4">
                <div className="tw:w-16 tw:h-16 tw:bg-gray-200 tw:rounded tw:mr-4"></div>
                <div className="tw:flex-1">
                  <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:mb-2"></div>
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:mb-2"></div>
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/2"></div>
                </div>
              </div>
              <div className="tw:space-y-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div
                    key={j}
                    className="tw:flex tw:justify-between tw:items-center"
                  >
                    <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/4"></div>
                    <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/3"></div>
                  </div>
                ))}
              </div>
              <div className="tw:mt-4 tw:h-8 tw:bg-gray-200 tw:rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((item) => {
        return (
          <div
            key={item._id}
            className="tw:bg-white tw:p-4 tw:rounded-lg tw:border tw:border-gray-200"
          >
            {/* File Header Section */}
            <div className="tw:flex tw:items-start tw:mb-4">
              {/* File Icon */}
              <div className="tw:w-10 tw:h-10 tw:bg-blue-50 tw:rounded tw:flex tw:items-center tw:justify-center tw:mr-4 tw:overflow-hidden tw:flex-shrink-0">
                <FileText className="tw:w-6 tw:h-6 tw:text-blue-600" />
              </div>

              {/* File Text Details */}
              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:font-semibold tw:text-base tw:text-blue-500 tw:mb-1 tw:line-clamp-2">
                  {item.fileName || "N/A"}
                </div>

                <div className="tw:flex tw:items-center tw:gap-4 tw:mb-2">
                  <KeyValue label={t("date")} horizontal size="sm">
                    <div className="tw:flex tw:items-end tw:gap-1">
                      <span>: </span>
                      <DateFormat
                        value={item.createdAt}
                        formatStr="dd MMM yyyy"
                      />
                      <DateFormat
                        value={item.createdAt}
                        formatStr="hh:mm a"
                        className="tw:text-xs tw:text-gray-500 tw:mb-0.5"
                      />
                    </div>
                  </KeyValue>

                  <KeyValue label={t("items")} horizontal size="sm">
                    : {item.totalProducts || 0}
                  </KeyValue>
                </div>

                <div>
                  <KeyValue label={t("status")} horizontal size="sm">
                    {item.finalStatus === "Pending" ? (
                      <AppBadge
                        variant={item._statusColor}
                        className="tw:text-xs"
                      >
                        {item.finalStatus || t("pending")}
                      </AppBadge>
                    ) : (
                      <div className="tw:flex tw:items-end tw:gap-4">
                        <div className="tw:text-green-600">
                          {t("success")}: {item.successfulProducts || 0}
                        </div>
                        <div className="tw:text-red-600">
                          {t("failed")}: {item.failedProducts || 0}
                        </div>
                      </div>
                    )}
                  </KeyValue>
                </div>
              </div>
            </div>

            {/* Action Button Section */}
            <div className="tw:pt-3 tw:border-t tw:border-gray-100">
              <button
                onClick={() => callback({ action: "view", data: item })}
                className="tw:w-full tw:flex tw:items-center tw:justify-center tw:gap-2 tw:px-4 tw:py-2 tw:border tw:border-gray-300 tw:rounded tw:text-sm tw:text-gray-700 tw:bg-white tw:hover:bg-gray-50 tw:transition-colors"
              >
                <Eye className="tw:w-4 tw:h-4" />
                {t("viewDetails")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileView;
