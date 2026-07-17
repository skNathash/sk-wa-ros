import React, { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import type { PurchaseOrder } from "~/types/PurchaseOrderTypes";
import { useTranslation } from "react-i18next";

interface RecentPurchasePopoverProps {
  vendorId?: string;
  productId?: string;
  limit?: number;
}

interface RecentPurchase {
  _id: string;
  price: number;
  vendorName: string;
  purchaseDate: string;
  totalValue: number;
}

const RecentPurchasePopover: React.FC<RecentPurchasePopoverProps> = ({
  vendorId,
  productId,
  limit = 5,
}) => {
  const { t } = useTranslation(["common"]);
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecentPurchases();
  }, [vendorId, productId, limit]);

  const fetchRecentPurchases = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: 1,
        count: limit,
        sort: { createdAt: -1 },
        filter: {
          status: { $in: ["Completed"] },
        },
      };

      // Add vendor filter if specified
      if (vendorId) {
        params.filter["vendorInfo.id"] = vendorId;
      }

      // Add product filter if specified
      if (productId) {
        params.filter["items.dealId"] = productId;
      }

      const response = await PurchaseOrderService.getList(params);

      if (response.statusCode === 200 && Array.isArray(response.data?.data)) {
        const formattedData = response.data?.data
          .map((po: PurchaseOrder) =>
            PurchaseOrderService.formatPurchaseOrderData(po)
          )
          .flatMap((po: any) =>
            (po.items || []).map((item: any) => ({
              _id: po._id,
              price: item.purchasePrice || 0,
              vendorName: po.vendorInfo?.name || "Unknown Vendor",
              purchaseDate: po.createdAt,
              totalValue: item.purchasePrice * item.quantity || 0,
            }))
          )
          .slice(0, limit);

        setRecentPurchases(formattedData);
      }
    } catch (error) {
      console.error("Error fetching recent purchases:", error);
      setRecentPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="tw:p-4 tw:min-w-[300px]">
        <div className="tw:text-sm tw:text-gray-500 tw:mb-3">
          {t("recentPurchases")}
        </div>
        <div className="tw:space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="tw:animate-pulse">
              <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recentPurchases.length === 0) {
    return (
      <div className="tw:p-4 tw:min-w-[300px]">
        <div className="tw:text-sm tw:text-gray-500 tw:mb-3">
          {t("recentPurchases")}
        </div>
        <div className="tw:text-sm tw:text-gray-400 tw:italic">
          {t("noRecentPurchasesFound")}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-3">
        {t("recentPurchases")}
      </div>
      <div className="tw:space-y-2">
        {recentPurchases.map((purchase, index) => (
          <div
            key={purchase._id || index}
            className="tw:py-1 tw:flex tw:flex-col tw:gap-1"
          >
            <div className="tw:text-xs tw:text-gray-900 tw:leading-relaxed">
              <span className="tw:font-semibold tw:text-green-600">
                <Amount value={purchase.price} decimalPlaces={2} />
              </span>
              <span> from </span>
              <span className="tw:font-medium">{purchase.vendorName}</span>
              <span> on </span>
              <DateFormat
                value={purchase.purchaseDate}
                formatStr="dd MMM yyyy"
                className="tw:text-gray-600"
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default RecentPurchasePopover;
