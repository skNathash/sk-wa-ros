import React from "react";
import { AlertCircle } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import { useTranslation } from "react-i18next";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface ShelfLifeOverviewProps {
  data: Array<{
    quantity: number;
    expiresOn: string;
    _id: string[];
    daysLeft: number;
  }>;
  callback: (a: { action: string }) => void;
  showManageExpiry?: boolean;
  selectedStockUom?: string;
}

const ShelfLifeOverview: React.FC<ShelfLifeOverviewProps> = ({
  data,
  callback,
  showManageExpiry = false,
  selectedStockUom,
}) => {
  const { t } = useTranslation(["common"]);
  return (
    <div className="tw:bg-gray-50 tw:p-4 tw:rounded-xl tw:space-y-4 tw:mb-4">
      <div className="tw:flex tw:items-center tw:justify-between">
        <div className="tw:flex tw:items-center tw:gap-2 tw:font-medium tw:text-sm">
          <AlertCircle className="tw:w-5 tw:h-5 tw:text-blue-500" />
          {t("shelfLifeOverview")}
        </div>
        {showManageExpiry && (
          <AppButton
            color="warning"
            fill="outline"
            size="small"
            onClick={() => callback({ action: "manage-expiry" })}
          >
            <AlertCircle className="tw:w-4 tw:h-4 tw:mr-1 tw:inline" />
            {t("manageExpiry")}
          </AppButton>
        )}
      </div>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mt-2">
        {data && data.length > 0 ? (
          data.map((item, idx) => (
            <div
              key={idx}
              className="tw:bg-red-50 tw:border tw:border-red-200 tw:rounded-lg tw:p-4 tw:flex-1 tw:space-y-2"
            >
              <div className="tw:flex tw:justify-between tw:items-center">
                <div className="tw:font-medium tw:text-sm">
                  <DisplayQty
                    qty={item.quantity}
                    isLooseQty={false}
                    uom={selectedStockUom}
                  />
                </div>
                {/* <div className="tw:text-right tw:text-sm tw:text-gray-700 tw:bg-gray-50 tw:rounded px-2">
                  {item._id && item._id.length > 0 ? item._id[0] : "-"}
                </div> */}
              </div>
              <div className="tw:text-red-600 tw:text-xs tw:mt-2">
                {t("expires")}:{" "}
                {item.expiresOn ? (
                  <>
                    <DateFormat
                      value={item.expiresOn}
                      formatStr="dd MMM yyyy"
                    />{" "}
                    (
                    <span className="tw:font-semibold">
                      {item.daysLeft < 0
                        ? `${Math.abs(item.daysLeft)} ${t("daysAgo")}`
                        : item.daysLeft === 0
                        ? t("today")
                        : `in ${item.daysLeft} ${t("days")}`}
                    </span>
                    )
                  </>
                ) : (
                  <span className="tw:font-semibold">--</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="tw:col-span-3 tw:text-center tw:text-gray-400 tw:py-8">
            {t("noShelfLifeDataAvailable")}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShelfLifeOverview;
