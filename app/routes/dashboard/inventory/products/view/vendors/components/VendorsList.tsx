import { ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import MobileView from "./MobileView";
import VendorsSummary from "./VendorsSummary";

// Updated interface for LoadMoreButton support

interface VendorsListProps {
  vendor: any;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
  callback: (data: { action: string; data: any }) => void;
}

const VendorsList = ({
  vendor,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
  callback,
}: VendorsListProps) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppCard noPadding>
      {/* Vendor Header */}
      <div className="tw:flex tw:items-start tw:justify-between tw:p-4">
        <div className="tw:flex-1">
          <AppLink
            href={`/dashboard/vendor/view/${vendor.vendor._id}`}
            asLink
            className="tw:font-semibold tw:text-lg"
            showLinkColor
          >
            {vendor.vendor?.name}
          </AppLink>
          <div className="tw:text-sm tw:text-gray-500 tw:mt-1">
            ID: {vendor.vendor?.id}
          </div>
        </div>
        <AppButton
          color="primary"
          size="small"
          onClick={() => callback({ action: "createPO", data: vendor })}
        >
          <ShoppingCart size={16} />
          {t("createPO")}
        </AppButton>
      </div>

      {/* Summary Section */}
      {vendor.summary && <VendorsSummary summary={vendor.summary} />}

      {/* Recent POs Section */}
      <div>
        <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:mb-3 tw:px-4 tw:pt-4">
          {t("recentPOs")} ({vendor.purchaseOrders?.length || 0})
        </div>
        <MobileView data={vendor.purchaseOrders} />
      </div>

      {showLoadMore && (
        <div className="tw:px-4 tw:pb-4">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </AppCard>
  );
};

export default VendorsList;
