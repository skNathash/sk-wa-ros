import React from "react";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import ProductMobileItem from "~/shared/inventory/components/mobile-item/ProductMobileItem";
import type { SellerDeal } from "~/types/CommonTypes";

const rbacRoles = {
  addStock: ["INVENTORY.ADD-STOCK"],
  view: ["INVENTORY.VIEW-INVENTORY"],
};

interface MobileViewProps {
  data: Array<SellerDeal & { _animate?: boolean }>;
  callback: (a: { action: string; data: SellerDeal }) => void;
  loading?: boolean;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  callback,
  loading = false,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
}) => {
  const { t } = useTranslation(["common"]);

  const getStockStatus = (item: SellerDeal) => {
    if (item.maxQty <= 0) {
      return {
        quantity: `0 ${t("units")}`,
        color: "danger" as const,
      };
    }

    return {
      quantity: `${item.maxQty} ${t("units")}`,
      color: "success" as const,
    };
  };

  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-6 tw:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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
                {[1, 2, 3].map((j) => (
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

  if (data.length === 0) {
    return (
      <div className="tw:text-center tw:py-8">
        <div className="tw:text-gray-500">{t("noProductsFound")}</div>
      </div>
    );
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:gap-4 tw:md:mx-4">
        {data.map((item) => (
          <ProductMobileItem key={item._id} data={item} callback={callback} />
        ))}
      </div>
      {showLoadMore && !loading && data.length > 0 && (
        <LoadMoreButton
          loadMore={loadMore}
          loading={loadingMore}
          totalCount={totalCount}
          loadedCount={loadedCount}
        />
      )}
    </>
  );
};

export default MobileView;
