import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import AppLink from "~/components/core/link/AppLink";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import DateFormat from "~/components/core/date/DateFormat";

interface OpenPoProps {
  dealId: string;
  className?: string;
}

const OpenPo: React.FC<OpenPoProps> = ({ dealId, className = "" }) => {
  const [loading, setLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!dealId) return;

    const fetch = async () => {
      setLoading(true);
      try {
        // PurchaseOrderService.getList has a default filter of { status: "Approved" }
        const params = {
          page: 1,
          count: 10,
          filter: {
            "items.dealId": dealId,
            status: "Approved",
          },
        };

        const resp = await PurchaseOrderService.getList(params);
        const list = resp.data?.data || [];

        // Enrich each purchase order with a `dealQty` value which is the
        // total quantity for the provided `dealId`. Also mark each item
        // with a `dealQty` of its own: quantity if it matches `dealId`, else 0.
        const enriched = list.map((po: any) => {
          const items = (po.items || []).map((item: any) => ({
            ...item,
            dealQty: item?.dealId === dealId ? item?.quantity ?? 0 : 0,
          }));

          const dealQty = items.reduce(
            (total: number, item: any) => total + (item.dealQty ?? 0),
            0
          );

          return {
            ...po,
            items,
            dealQty,
          };
        });

        setPurchaseOrders(enriched);
      } catch (err) {
        setPurchaseOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [dealId]);

  const count = purchaseOrders.length;
  const totalOpenQty = purchaseOrders.reduce(
    (s: number, po: any) => s + (po.dealQty || 0),
    0
  );

  // If not loading and there is no open quantity for this deal, don't render the block
  if (!loading && totalOpenQty === 0) return null;

  return (
    <div className={`tw:border tw:rounded tw:p-4 tw:mb-4 ${className}`}>
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-3">
        <div className="tw:flex tw:items-center tw:space-x-2">
          <Menu className="tw:h-5 tw:w-5 tw:text-yellow-700" />
          <h3 className="tw:text-sm tw:font-semibold tw:text-yellow-800">
            Open Purchase Orders ({loading ? "..." : count})
          </h3>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="tw:text-sm tw:text-gray-500">Loading...</div>
        ) : count === 0 ? (
          <div className="tw:text-sm tw:text-gray-500">
            No open purchase orders
          </div>
        ) : (
          purchaseOrders.slice(0, 5).map((po) => (
            <div
              key={po._id || po.orderId}
              className="tw:flex tw:items-center tw:justify-between tw:bg-yellow-50 tw:p-3 tw:rounded tw:mb-2"
            >
              <div className="tw:flex tw:flex-col">
                <AppLink
                  asLink
                  href={`/dashboard/purchase-order/view/${
                    po._id || po.orderId
                  }`}
                  className="tw:text-yellow-800 tw:font-medium tw:text-sm tw:underline tw:cursor-pointer"
                >
                  {po.orderId || po._id}
                </AppLink>
                <div className="tw:text-xs tw:text-yellow-700">
                  {po.vendorInfo?.name} •{" "}
                  {po.createdAt ? <DateFormat value={po.createdAt} /> : ""}
                </div>
              </div>

              <div className="tw:flex tw:items-center tw:space-x-3">
                <div className="tw:text-sm tw:font-medium tw:text-gray-900">
                  {po.dealQty || 0} units
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OpenPo;
