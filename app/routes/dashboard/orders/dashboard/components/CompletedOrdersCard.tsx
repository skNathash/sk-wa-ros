import React, { useEffect, useRef, useState } from "react";
import { CheckCircle } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import Divider from "~/components/core/divider/Divider";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { prepareParams } from "../helper";
import OmsDashboardService from "~/services/OmsDashboardService";
import OrdersListModal from "../modals/orders-list/OrdersListModal";

type Props = {
  search: string;
  dateFrom: string;
  dateTo: string;
  mainTab: string;
  salesEmployeeId?: string;
  callback: (data: { action: string; data?: any }) => void;
};

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

const CompletedOrdersCard = ({
  search,
  dateFrom,
  dateTo,
  mainTab,
  salesEmployeeId,
  callback,
}: Props) => {
  const [loading, setLoading] = useState(true);

  const abortRef1 = useRef<AbortController | null>(null);
  const abortRef2 = useRef<AbortController | null>(null);

  const [summary, setSummary] = useState<{
    shipped: number;
    delivered: number;
    orderValue: number;
  }>({
    shipped: 0,
    delivered: 0,
    orderValue: 0,
  });

  const [ordersListModal, setOrdersListModal] = useState<{
    show: boolean;
    filter: any;
    title?: string;
  }>({
    show: false,
    filter: {},
    title: "",
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

  const applyFilter = async () => {
    const shippedParams = getParams("shipped");
    const deliveredParams = getParams("delivered");

    abortRef1.current?.abort();
    abortRef1.current = new AbortController();
    abortRef2.current?.abort();
    abortRef2.current = new AbortController();

    setLoading(true);

    const promises = [
      OmsDashboardService.getByStatus(shippedParams, {
        signal: abortRef1.current?.signal,
      }),
      OmsDashboardService.getByStatus(deliveredParams, {
        signal: abortRef2.current?.signal,
      }),
    ];

    const responses = await Promise.all(promises);
    const d1 = responses[0]?.data?.summary || {};
    const d2 = responses[1]?.data?.summary || {};

    setSummary({
      shipped: d1.totalOrders || 0,
      delivered: d2.totalOrders || 0,
      orderValue: (d1.totalValue || 0) + (d2.totalValue || 0),
    });
    setLoading(false);
  };

  const getParams = (type: "shipped" | "delivered") => {
    let params = prepareParams({
      ...filterRef.current,
    });

    if (type === "shipped") {
      params.statusType = "Shipped";
    } else if (type === "delivered") {
      params.statusType = "Delivered";
    }

    return params;
  };

  const handleOrdersListModal = (data: { action: string; data?: any }) => {
    if (data.action === "viewOrder") {
      callback({ action: "viewOrder", data: { orderId: data.data.orderId } });
    }
    setOrdersListModal({
      show: false,
      filter: {},
      title: "",
    });
  };

  const onShowShipped = () => {
    setOrdersListModal({
      show: true,
      filter: getParams("shipped"),
      title: "Shipped orders",
    });
  };

  const onShowDelivered = () => {
    setOrdersListModal({
      show: true,
      filter: getParams("delivered"),
      title: "Delivered orders",
    });
  };

  return (
    <>
      <AppCard
        title="Completed Orders"
        icon={<CheckCircle />}
        iconClassName="tw:text-green-500"
        className="tw:mb-0"
      >
        <div className="tw:grid tw:grid-cols-2 tw:gap-1.5 tw:mb-2">
          <StatItem
            label="Shipped"
            value={loading ? <AppSpinner /> : summary.shipped}
          />
          <StatItem
            label="Delivered"
            value={loading ? <AppSpinner /> : summary.delivered}
          />
        </div>

        <div className="tw:flex tw:justify-between tw:items-center tw:px-1.5 tw:py-1.5 tw:bg-secondary/30 tw:rounded-md tw:mb-2">
          <div className="tw:text-xs tw:text-muted-foreground tw:uppercase tw:tracking-wide tw:leading-tight">
            Sales Value
          </div>
          <div className="tw:text-sm tw:font-semibold tw:text-foreground">
            {loading ? (
              <AppSpinner />
            ) : (
              <Amount value={Number(summary.orderValue)} />
            )}
          </div>
        </div>

        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton
            onClick={onShowShipped}
            color="primary"
            size="small"
            disabled={summary.shipped === 0}
          >
            View shipped
          </AppButton>
          <AppButton
            onClick={onShowDelivered}
            color="secondary"
            size="small"
            disabled={summary.delivered === 0}
          >
            View delivered
          </AppButton>
        </div>
      </AppCard>

      <OrdersListModal
        show={ordersListModal.show}
        callback={handleOrdersListModal}
        defaultFilter={ordersListModal.filter}
        title={ordersListModal.title}
      />
    </>
  );
};

export default CompletedOrdersCard;
