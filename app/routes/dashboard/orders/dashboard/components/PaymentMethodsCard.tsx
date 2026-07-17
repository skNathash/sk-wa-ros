import React, { useEffect, useRef, useState } from "react";
import { CreditCard, Package, Clock } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import clsx from "clsx";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import OmsDashboardService from "~/services/OmsDashboardService";
import { prepareParams, formatPaymentSummary } from "../helper";

interface PaymentMethod {
  label: string;
  value: number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
  loading?: boolean;
}

const PaymentMethodCard: React.FC<{
  method: PaymentMethod;
  loading?: boolean;
}> = ({ method, loading = false }) => (
  <AppCard>
    <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
      <div className="tw:flex tw:items-center tw:gap-2">
        <div
          className="tw:p-2 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:flex-shrink-0"
          style={{ backgroundColor: `${method.color}15` }}
        >
          <div style={{ color: method.color }} className="tw:w-5 tw:h-5">
            {method.icon}
          </div>
        </div>
        <span className="tw:text-sm tw:font-semibold tw:text-foreground">
          {method.label}
        </span>
      </div>

      <div className="tw:flex tw:flex-col tw:items-end tw:gap-0.5">
        {loading ? (
          <AppSpinner />
        ) : (
          <>
            <span className="tw:text-lg tw:font-bold tw:text-foreground">
              <Amount value={method.value} />
            </span>
            {/* {method.percentage > 0 && (
              <span className="tw:text-xs tw:font-medium tw:text-gray-500">
                {method.percentage}%
              </span>
            )} */}
          </>
        )}
      </div>
    </div>
  </AppCard>
);

const PaymentMethodsCard: React.FC<{
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  mainTab?: string;
  salesEmployeeId?: string;
  onManage?: () => void;
}> = ({
  search = "",
  dateFrom = "",
  dateTo = "",
  mainTab = "all-orders",
  salesEmployeeId,
  onManage,
}) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    prepaid: number;
    prepaidPerc: number;
    cod: number;
    codPerc: number;
    payLater: number;
    payLaterPerc: number;
  }>({
    prepaid: 0,
    prepaidPerc: 0,
    cod: 0,
    codPerc: 0,
    payLater: 0,
    payLaterPerc: 0,
  });

  const filterRef = useRef<Record<string, any>>({
    search,
    dateRange: [] as Date[],
    mainTab,
    salesEmployeeId,
  });
  const abortRef = useRef<AbortController | null>(null);

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
    return prepareParams({
      ...filterRef.current,
    });
  };

  const applyFilter = async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    const params = getParams();
    const r = await OmsDashboardService.getOrderPayment(params, {
      signal: abortRef.current?.signal,
    });
    const d = r?.data?.data || [];

    const formatted = formatPaymentSummary(d);
    setSummary({
      prepaid: formatted.prepaid || 0,
      prepaidPerc: formatted.prepaidPerc || 0,
      cod: formatted.cod || 0,
      codPerc: formatted.codPerc || 0,
      payLater: formatted.payLater || 0,
      payLaterPerc: formatted.payLaterPerc || 0,
    });
    setLoading(false);
  };

  const methods: PaymentMethod[] = [
    {
      label: "Prepaid",
      value: summary.prepaid,
      percentage: summary.prepaidPerc,
      color: "#FF9500",
      icon: <CreditCard className="tw:w-full tw:h-full" />,
    },
    {
      label: "COD",
      value: summary.cod,
      percentage: summary.codPerc,
      color: "#3B82F6",
      icon: <Package className="tw:w-full tw:h-full" />,
    },
    {
      label: "Pay Later",
      value: summary.payLater,
      percentage: summary.payLaterPerc,
      color: "#D1D5DB",
      icon: <Clock className="tw:w-full tw:h-full" />,
    },
  ];

  return (
    <>
      <h3 className="tw:text-base tw:font-semibold tw:text-foreground tw:mb-2">
        Payment Methods
      </h3>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-2 tw:md:gap-4">
        {methods.map((method) => (
          <PaymentMethodCard
            key={method.label}
            method={method}
            loading={loading}
          />
        ))}
      </div>
    </>
  );
};

export default PaymentMethodsCard;
