import { ShoppingCart } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import OmsDashboardService from "~/services/OmsDashboardService";
import { prepareParams } from "../helper";
import OrdersListModal from "../modals/orders-list/OrdersListModal";

interface PendingOrdersCardProps {
  search: string;
  dateFrom: string;
  dateTo: string;
  mainTab: string;
  salesEmployeeId?: string;
  callback: (data: { action: string; data?: any }) => void;
}

const StatItem: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-0.5 tw:px-1.5 tw:rounded-md tw:bg-secondary/50">
    <div className="tw:text-xs tw:text-muted-foreground tw:uppercase tw:tracking-wide tw:leading-tight">
      {label}
    </div>
    <div className="tw:text-lg tw:font-bold tw:text-foreground">{value}</div>
  </div>
);

const PendingOrdersCard: React.FC<PendingOrdersCardProps> = ({
  search,
  dateFrom,
  dateTo,
  mainTab,
  salesEmployeeId,
  callback,
}) => {
  const [loading, setLoading] = useState(true);

  const abortRef = useRef<AbortController | null>(null);

  const [ordersListModal, setOrdersListModal] = useState<{
    show: boolean;
    filter: any;
  }>({
    show: false,
    filter: {},
  });

  const [summary, setSummary] = useState<{
    totalOrders: number;
    totalProducts: number;
    totalValue: number;
  }>({
    totalOrders: 0,
    totalProducts: 0,
    totalValue: 0,
  });

  const filterRef = useRef<Record<string, any>>({
    search,
    dateRange: [] as Date[],
    mainTab,
    salesEmployeeId,
  });

  useEffect(() => {
    filterRef.current = {
      search,
      dateRange: [new Date(dateFrom), new Date(dateTo)],
      mainTab,
      salesEmployeeId,
    };
    applyFilter();
  }, [search, dateFrom, dateTo, mainTab, salesEmployeeId]);

  const getParams = () => {
    let params = prepareParams({
      ...filterRef.current,
    });
    return {
      ...params,
      statusType: "Pending",
    };
  };

  const applyFilter = async () => {
    const params = getParams();
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    const r = await OmsDashboardService.getByStatus(params, {
      signal: abortRef.current?.signal,
    });
    const d = r?.data?.summary || {};
    setSummary({
      totalOrders: d.totalOrders || 0,
      totalProducts: d.totalProducts || 0,
      totalValue: d.totalValue || 0,
    });
    setLoading(false);
  };

  const onPickOrder = async () => {
    if (summary.totalOrders === 0) {
      return;
    }

    const params = getParams();
    setOrdersListModal({
      show: true,
      filter: params,
    });
  };

  const handleOrdersListModal = (data: { action: string; data?: any }) => {
    setOrdersListModal({
      show: false,
      filter: {},
    });

    if (data.action === "viewOrder") {
      callback({ action: "viewOrder", data: { orderId: data.data.orderId } });
    }
  };

  return (
    <>
      <AppCard
        title="Pending Orders"
        icon={<ShoppingCart />}
        iconClassName="tw:text-amber-500"
        className="tw:mb-0"
      >
        <div className="tw:grid tw:grid-cols-2 tw:gap-1.5 tw:mb-2">
          <StatItem
            label="Total Orders"
            value={loading ? <AppSpinner /> : summary.totalOrders}
          />
          <StatItem
            label="Total Products"
            value={loading ? <AppSpinner /> : summary.totalProducts}
          />
        </div>

        <div className="tw:flex tw:justify-between tw:items-center tw:px-1.5 tw:py-1.5 tw:bg-secondary/30 tw:rounded-md tw:mb-2">
          <div className="tw:text-xs tw:text-muted-foreground tw:uppercase tw:tracking-wide tw:leading-tight">
            Total Value
          </div>
          <div className="tw:text-sm tw:font-semibold tw:text-foreground">
            {loading ? (
              <AppSpinner />
            ) : (
              <Amount value={Number(summary.totalValue)} />
            )}
          </div>
        </div>

        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton
            onClick={onPickOrder}
            color="primary"
            size="small"
            disabled={summary.totalOrders === 0}
          >
            Pick orders
          </AppButton>
        </div>
      </AppCard>

      <OrdersListModal
        show={ordersListModal.show}
        callback={handleOrdersListModal}
        defaultFilter={ordersListModal.filter}
      />
    </>
  );
};

export default PendingOrdersCard;
