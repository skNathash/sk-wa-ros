import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";

type SplitageData = {
  menuName?: string;
  skCommission?: number;
  categoryName?: string;
  configOnType: "Category" | "Menu";
};

type Props = {
  data: SplitageData[];
};

const ViewCategorySplitages: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const [showSplitages, setShowSplitages] = useState(false);

  const categories = data.filter((item) => item.configOnType === "Category");
  const menus = data.filter((item) => item.configOnType === "Menu");

  const renderSplitageList = (
    items: SplitageData[],
    title: string,
    count: number
  ) => (
    <>
      <div className="tw:flex tw:justify-between tw:px-4 tw:py-2 tw:bg-gray-50 tw:border-y tw:border-gray-100">
        <span className="tw:text-[10px] tw:font-bold tw:text-gray-500 tw:uppercase">
          {title} ({count})
        </span>
        <span className="tw:text-[10px] tw:font-bold tw:text-gray-500 tw:uppercase text-right">
          {t("platformFee:feePercent")}
        </span>
      </div>
      <AppScrollArea className="tw:h-[110px]">
        <div className="tw:divide-y tw:divide-gray-50">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="tw:flex tw:justify-between tw:px-4 tw:py-3 hover:tw:bg-gray-50/50 tw:transition-colors"
            >
              <span className="tw:text-xs tw:text-gray-700 tw:font-medium">
                {item.configOnType === "Category"
                  ? item.categoryName
                  : item.menuName}{" "}
              </span>
              <span className="tw:text-xs tw:font-bold tw:text-gray-900">
                {`${item.skCommission ?? ""}%`}
              </span>
            </div>
          ))}
        </div>
      </AppScrollArea>
    </>
  );

  return (
    <div className="tw:border tw:border-gray-100 tw:rounded-2xl tw:overflow-hidden">
      <button
        onClick={() => setShowSplitages(!showSplitages)}
        className="tw:flex tw:items-center tw:justify-between tw:w-full tw:text-xs tw:font-bold tw:text-gray-900 tw:py-3 tw:px-4 tw:bg-gray-50/50 hover:tw:bg-gray-50 tw:transition-colors"
      >
        <span className="tw:flex tw:items-center tw:gap-2">
          {t("platformFee:viewSplitages")}
          <span className="tw:inline-flex tw:items-center tw:px-1.5 tw:py-0.5 tw:rounded-full tw:text-[10px] tw:bg-gray-200 tw:text-gray-600">
            {data.length}
          </span>
        </span>
        {showSplitages ? (
          <ChevronUp className="tw:w-4 tw:h-4 tw:text-gray-400" />
        ) : (
          <ChevronDown className="tw:w-4 tw:h-4 tw:text-gray-400" />
        )}
      </button>

      {showSplitages && (
        <div className="tw:bg-white tw:animate-in tw:slide-in-from-top-2 tw:duration-200">
          {categories.length > 0 &&
            renderSplitageList(
              categories,
              t("platformFee:categoryName"),
              categories.length
            )}
          {menus.length > 0 &&
            renderSplitageList(menus, t("platformFee:menuName"), menus.length)}
        </div>
      )}
    </div>
  );
};

export default ViewCategorySplitages;
