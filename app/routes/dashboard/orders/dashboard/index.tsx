import { format } from "date-fns";
import { Box, ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import OmsDashboardService from "~/services/OmsDashboardService";
import PageAccessService from "~/services/PageAccessService";
import OrderListTab from "~/shared/orders/order-list-tab/OrderListTab";
import type { TabItem } from "~/types/CommonTypes";
import AllOrders from "./components/all-orders/AllOrders";
import CompletedOrdersCard from "./components/CompletedOrdersCard";
import Customers from "./components/customers/Customers";
import Filter from "./components/Filter";
import OverviewSummary from "./components/OverviewSummary";
import PaymentMethodsCard from "./components/PaymentMethodsCard";
import PendingOrdersCard from "./components/PendingOrdersCard";
import ProcessOrdersCard from "./components/ProcessOrdersCard";
import Products from "./components/products/Products";
import Summary from "./components/Summary";
import type { SummaryItem } from "./helper";
import { defaultFilter, defaultSummary, prepareParams } from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage([]);
}

const breadcrumbs = [
  { label: "Dashboard" },
  { label: "Orders Dashboard", langKey: "ordersManagement" },
];

const mainTabs: TabItem[] = [
  { key: "all-orders", name: "All Orders" },
  { key: "b2b-orders", name: "B2B Orders" },
  { key: "b2c-orders", name: "B2C Orders" },
];

const getCustomerTabName = (mainTab: string) => {
  switch (mainTab) {
    case "b2b-orders":
      return "B2B Customers";
    case "b2c-orders":
      return "B2C Customers";
    default:
      return "B2C/B2B Customers";
  }
};

const tabDescriptions: Record<string, Record<string, string>> = {
  "all-orders": {
    "all-orders": "Overview of all orders placed across B2B and B2C channels",
    "b2b-orders": "Overview of all orders from B2B channel",
    "b2c-orders": "Overview of all orders from B2C channel",
  },
  customers: {
    "all-orders": "Customer insights and purchase patterns across B2B and B2C",
    "b2b-orders": "B2B customer insights and purchase patterns",
    "b2c-orders": "B2C customer insights and purchase patterns",
  },
  products: {
    "all-orders": "Product performance and sales breakdown across all channels",
    "b2b-orders": "Product performance and sales breakdown for B2B orders",
    "b2c-orders": "Product performance and sales breakdown for B2C orders",
  },
};

const buildTabs = (mainTab: string): TabItem[] => [
  { key: "all-orders", name: "All Orders" },
  { key: "customers", name: getCustomerTabName(mainTab) },
  { key: "products", name: "Products" },
];

const OrdersDashboard = () => {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const formMethods = useForm({
    defaultValues: defaultFilter,
  });
  const { t } = useTranslation(["common"]);

  const [searchParams, setSearchparams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const dateFrom = searchParams.get("dateFrom") || defaultFilter.dateRange[0];
  const dateTo = searchParams.get("dateTo") || defaultFilter.dateRange[1];
  const mainTabParam = searchParams.get("mainTab") || mainTabs[0].key;
  const salesEmployeeId = searchParams.get("salesEmployeeId") || "";
  const salesEmployeeName = searchParams.get("salesEmployeeName") || "";

  const [activeTab, setActiveTab] = useState<string>("all-orders");
  const [mainTab, setMainTab] = useState<string>(mainTabParam);

  const [summary, setSummary] = useState<any[]>([...defaultSummary]);

  const [allOrdersSummary, setAllOrdersSummary] = useState<SummaryItem>({
    totalOrders: 0,
    totalCustomers: 0,
    totalValue: 0,
    loading: true,
  });

  const [b2bSummary, setB2bSummary] = useState<SummaryItem>({
    totalOrders: 0,
    totalCustomers: 0,
    totalValue: 0,
    loading: true,
  });

  const [b2cSummary, setB2cSummary] = useState<SummaryItem>({
    totalOrders: 0,
    totalCustomers: 0,
    totalValue: 0,
    loading: true,
  });

  const abortAllRef = useRef<AbortController | null>(null);
  const abortB2bRef = useRef<AbortController | null>(null);
  const abortB2cRef = useRef<AbortController | null>(null);
  const abortSummaryRef = useRef<AbortController | null>(null);

  const loadAllOrdersSummary = async () => {
    abortAllRef.current?.abort();
    abortAllRef.current = new AbortController();

    const params = prepareParams({
      ...formMethods.getValues(),
      mainTab: "all-orders",
    });

    setAllOrdersSummary((prev) => ({ ...prev, loading: true }));

    const r = await OmsDashboardService.getOrderCards(params, {
      signal: abortAllRef.current?.signal,
    });
    const d = r?.data?.data || {};
    setAllOrdersSummary({
      totalOrders: d.totalOrders || 0,
      totalCustomers: d.totalCustomers || 0,
      totalValue: d.totalValue || 0,
      loading: false,
    });
  };

  const loadB2bSummary = async () => {
    abortB2bRef.current?.abort();
    abortB2bRef.current = new AbortController();

    const params = prepareParams({
      ...formMethods.getValues(),
      mainTab: "b2b-orders",
    });

    setB2bSummary((prev) => ({ ...prev, loading: true }));

    const r = await OmsDashboardService.getOrderCards(params, {
      signal: abortB2bRef.current?.signal,
    });
    const d = r?.data?.data || {};
    setB2bSummary({
      totalOrders: d.totalOrders || 0,
      totalCustomers: d.totalCustomers || 0,
      totalValue: d.totalValue || 0,
      loading: false,
    });
  };

  const loadB2cSummary = async () => {
    abortB2cRef.current?.abort();
    abortB2cRef.current = new AbortController();

    const params = prepareParams({
      ...formMethods.getValues(),
      mainTab: "b2c-orders",
    });

    setB2cSummary((prev) => ({ ...prev, loading: true }));

    const r = await OmsDashboardService.getOrderCards(params, {
      signal: abortB2cRef.current?.signal,
    });
    const d = r?.data?.data || {};
    setB2cSummary({
      totalOrders: d.totalOrders || 0,
      totalCustomers: d.totalCustomers || 0,
      totalValue: d.totalValue || 0,
      loading: false,
    });
  };

  const loadSummary = async (tab: string) => {
    abortSummaryRef.current?.abort();
    abortSummaryRef.current = new AbortController();

    const params = prepareParams({
      ...formMethods.getValues(),
      mainTab: tab,
    });

    setSummary((prev) => prev.map((item) => ({ ...item, loading: true })));

    const r = await OmsDashboardService.getOrderCards(params, {
      signal: abortSummaryRef.current?.signal,
    });
    const d = r?.data?.data || {};
    setSummary((prev) =>
      prev.map((item) => ({
        ...item,
        value: d[item.valueKey],
        loading: false,
      })),
    );
  };

  useEffect(() => {
    return () => {
      abortAllRef.current?.abort();
      abortB2bRef.current?.abort();
      abortB2cRef.current?.abort();
      abortSummaryRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    formMethods.setValue("search", search);
    if (dateFrom && dateTo) {
      formMethods.setValue("dateRange", [
        new Date(dateFrom),
        new Date(dateTo),
      ] as Date[]);
    }

    formMethods.setValue(
      "salesEmployee",
      salesEmployeeId && salesEmployeeName
        ? {
            label: salesEmployeeName,
            value: { id: salesEmployeeId, name: salesEmployeeName },
          }
        : null,
    );

    // activeTab is controlled locally; do not read from query params

    setMainTab(mainTabParam);

    if (mainTab === "b2b-orders") {
      loadSummary("b2b-orders");
    }

    if (mainTab === "b2c-orders") {
      loadSummary("b2c-orders");
    }

    if (mainTab === "all-orders") {
      loadAllOrdersSummary();
      loadB2bSummary();
      loadB2cSummary();
    }
    // PaymentMethodsCard fetches its own payment summary
    // load pending/process metrics for dashboard cards
  }, [mainTab, searchParams]);

  const handleFilterChange = () => {
    const values = formMethods.getValues();

    let params: Record<string, any> = {};
    if (values.search) {
      params.search = values.search;
    }

    if (values.dateRange && values.dateRange.length > 0) {
      params.dateFrom = format(values.dateRange[0], "yyyy-MM-dd");
      params.dateTo = format(values.dateRange[1], "yyyy-MM-dd");
    }

    if (values.salesEmployee?.value?.id) {
      params.salesEmployeeId = values.salesEmployee.value.id;
      params.salesEmployeeName = values.salesEmployee.value.name;
    }

    // preserve current `mainTab` query param when applying filters
    const existingMainTab = searchParams.get("mainTab");
    if (existingMainTab) {
      params.mainTab = existingMainTab;
    }

    setSearchparams(params, { replace: true });
  };

  const handleOrderCallback = (data: { action: string; data?: any }) => {
    if (data.action === "viewOrder") {
      const url = `/dashboard/orders/view/${data.data.orderId}`;
      if (isMobile) {
        appNav.to(url, {
          from: "ord-dash",
        });
      } else {
        appNav.openInNewTab(url, {
          from: "ord-dash",
        });
      }
    }
  };

  return (
    <>
      <AppHeader title={t("ordersManagement")} />
      <div className="tw:p-4 app-page page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          <PageDescription description="ordersDashboard" className="tw:mb-4" />

          {/* Top: moved list tabs */}
          <div className="tw:mb-4">
            <OrderListTab activeTab="analytics" className="tw:mb-4" />
          </div>

          {/* Main Tabs */}
          <div className="tw:mb-4">
            <AppTab
              activeTab={mainTab}
              variant="underline"
              onTabChange={(tab) => {
                setMainTab(tab.key);
                setSearchparams(
                  (prev) => {
                    const params = Object.fromEntries(prev.entries());
                    params.mainTab = tab.key;
                    return new URLSearchParams(params);
                  },
                  {
                    replace: true,
                  },
                );
              }}
              tabs={mainTabs}
            />
          </div>

          <div className="tw:sticky tw:top-16 tw:z-50">
            <FormProvider {...formMethods}>
              <Filter callback={handleFilterChange} />
            </FormProvider>
          </div>

          {mainTab === "all-orders" ? (
            <div className="tw:mb-4 tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
              <OverviewSummary
                totalOrders={allOrdersSummary.totalOrders}
                uniqueCustomers={allOrdersSummary.totalCustomers}
                value={allOrdersSummary.totalValue}
                title="All Orders"
                iconClassName="tw:text-blue-600"
                loading={allOrdersSummary.loading}
              />

              <OverviewSummary
                totalOrders={b2bSummary.totalOrders}
                uniqueCustomers={b2bSummary.totalCustomers}
                value={b2bSummary.totalValue}
                title="B2B Orders"
                icon={<Box />}
                iconClassName="tw:text-green-600"
                loading={b2bSummary.loading}
              />

              <OverviewSummary
                totalOrders={b2cSummary.totalOrders}
                uniqueCustomers={b2cSummary.totalCustomers}
                value={b2cSummary.totalValue}
                title="B2C Orders"
                icon={<ShoppingCart />}
                iconClassName="tw:text-orange-600"
                loading={b2cSummary.loading}
              />
            </div>
          ) : (
            <Summary summary={summary} />
          )}

          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
            <PendingOrdersCard
              search={search}
              dateFrom={dateFrom}
              dateTo={dateTo}
              mainTab={mainTab}
              salesEmployeeId={salesEmployeeId}
              callback={handleOrderCallback}
            />

            <ProcessOrdersCard
              search={search}
              dateFrom={dateFrom}
              dateTo={dateTo}
              mainTab={mainTab}
              salesEmployeeId={salesEmployeeId}
              callback={handleOrderCallback}
            />

            <CompletedOrdersCard
              search={search}
              dateFrom={dateFrom}
              dateTo={dateTo}
              mainTab={mainTab}
              salesEmployeeId={salesEmployeeId}
              callback={handleOrderCallback}
            />
          </div>

          <div className="tw:mt-4">
            <PaymentMethodsCard
              search={search}
              dateFrom={dateFrom}
              dateTo={dateTo}
              mainTab={mainTab}
              salesEmployeeId={salesEmployeeId}
              onManage={() => {}}
            />
          </div>

          <div className="tw:mb-4">
            <AppTab
              activeTab={activeTab}
              onTabChange={(tab) => {
                // only update local activeTab — do not add `tab` to query params
                setActiveTab(tab.key);
              }}
              tabs={buildTabs(mainTab)}
            />
            {tabDescriptions[activeTab]?.[mainTab] && (
              <p className="tw:text-xs tw:text-gray-500 tw:mt-1 tw:px-1">
                {tabDescriptions[activeTab][mainTab]}
              </p>
            )}
          </div>

          <div className="tw:mb-6">
            {activeTab === "all-orders" && (
              <AllOrders
                mainTab={mainTab}
                search={search}
                dateFrom={dateFrom}
                dateTo={dateTo}
                salesEmployeeId={salesEmployeeId}
              />
            )}
            {activeTab === "customers" && (
              <Customers
                mainTab={mainTab}
                search={search}
                dateFrom={dateFrom}
                dateTo={dateTo}
                salesEmployeeId={salesEmployeeId}
              />
            )}
            {activeTab === "products" && (
              <Products
                mainTab={mainTab}
                search={search}
                dateFrom={dateFrom}
                dateTo={dateTo}
                salesEmployeeId={salesEmployeeId}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OrdersDashboard;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Orders Dashboard"),
    },
  ];
}
