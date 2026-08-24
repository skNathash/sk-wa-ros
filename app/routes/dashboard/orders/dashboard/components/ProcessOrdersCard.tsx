import React, { useEffect, useRef, useState } from "react";
import { RotateCw } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import Divider from "~/components/core/divider/Divider";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { prepareParams } from "../helper";
import OmsDashboardService from "~/services/OmsDashboardService";
import useTheme from "~/hooks/useTheme";
import OrdersListModal from "../modals/orders-list/OrdersListModal";
import StatusCard from "./theme2/StatusCard";

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

const ProcessOrdersCard = ({
  search,
  dateFrom,
  dateTo,
  mainTab,
  salesEmployeeId,
  callback,
}: Props) => {
  const [loading, setLoading] = useState(true);
  const isTheme2 = useTheme() === "theme-2";

  const abortRef1 = useRef<AbortController | null>(null);
  const abortRef2 = useRef<AbortController | null>(null);

  const [summary, setSummary] = useState<{
    yetToPack: number;
    yetToShip: number;
    orderValue: number;
  }>({
    yetToPack: 0,
    yetToShip: 0,
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
    const packingParams = getParams("packing");
    const shippingParams = getParams("shipping");

    abortRef1.current?.abort();
    abortRef1.current = new AbortController();
    abortRef2.current?.abort();
    abortRef2.current = new AbortController();

    setLoading(true);

    const promises = [
      OmsDashboardService.getByStatus(packingParams, {
        signal: abortRef1.current?.signal,
      }),
      OmsDashboardService.getByStatus(shippingParams, {
        signal: abortRef2.current?.signal,
      }),
    ];

    const responses = await Promise.all(promises);
    const d1 = responses[0]?.data?.summary || {};
    const d2 = responses[1]?.data?.summary || {};

    setSummary({
      yetToPack: d1.totalOrders || 0,
      yetToShip: d2.totalOrders || 0,
      orderValue: d1.totalValue + d2.totalValue || 0,
    });
    setLoading(false);
  };

  const getParams = (type: "packing" | "shipping") => {
    let params = prepareParams({
      ...filterRef.current,
    });

    if (type === "packing") {
      params.statusType = "YetToPack";
    } else if (type === "shipping") {
      params.statusType = "YetToShip";
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

  const onStartPacking = () => {
    setOrdersListModal({
      show: true,
      filter: getParams("packing"),
      title: "Yet to pack orders",
    });
  };

  const onStartShipping = () => {
    setOrdersListModal({
      show: true,
      filter: getParams("shipping"),
      title: "Yet to ship orders",
    });
  };

  return (
    <>
      {isTheme2 ? (
        <StatusCard
          title="Process Orders"
          icon={<RotateCw />}
          iconWrapClass="tw:bg-teal-50 tw:text-teal-700"
          loading={loading}
          stats={[
            {
              label: "Yet to pack",
              value: summary.yetToPack,
              barClass: "tw:bg-teal-600",
            },
            {
              label: "Yet to ship",
              value: summary.yetToShip,
              barClass: "tw:bg-teal-300",
            },
          ]}
          totalLabel="Sales Value"
          totalValue={Number(summary.orderValue)}
          actions={[
            {
              label: "Start packing",
              onClick: onStartPacking,
              disabled: summary.yetToPack === 0,
            },
            {
              label: "Start shipping",
              onClick: onStartShipping,
              color: "secondary",
              disabled: summary.yetToShip === 0,
            },
          ]}
        />
      ) : (
        <AppCard
          title="Process Orders"
          icon={<RotateCw />}
          iconClassName="tw:text-primary"
          noPadding
          headerClassName="tw:px-3 tw:pt-3"
          className="tw:mb-0"
        >
          <div className="tw:px-3 tw:pb-3">
            <div className="tw:grid tw:grid-cols-2 tw:gap-1.5 tw:mb-2">
              <StatItem
                label="Yet to pack"
                value={loading ? <AppSpinner /> : summary.yetToPack}
              />
              <StatItem
                label="Yet to ship"
                value={loading ? <AppSpinner /> : summary.yetToShip}
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
                onClick={onStartPacking}
                color="primary"
                size="small"
                disabled={summary.yetToPack === 0}
              >
                Start packing
              </AppButton>
              <AppButton
                onClick={onStartShipping}
                color="secondary"
                size="small"
                disabled={summary.yetToShip === 0}
              >
                Start shipping
              </AppButton>
            </div>
          </div>
        </AppCard>
      )}

      <OrdersListModal
        show={ordersListModal.show}
        callback={handleOrdersListModal}
        defaultFilter={ordersListModal.filter}
        title={ordersListModal.title}
      />
    </>
  );
};

export default ProcessOrdersCard;
