import { AlertCircle, Info, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import useScreenView from "~/hooks/useScreenView";
import PriceSlabConfigModal from "~/shared/catalog/modals/price-slab-config/PriceSlabConfigModal";
import ViewLogsModal from "./modals/ViewLogsModal";
import type {
  BreadcrumbItem,
  PaginationState,
  TabItem,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import Filter from "./Filter";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import type { ViewToggleType } from "~/types/CommonTypes";

import ManagePriceTabs from "../../components/ManagePriceTabs";
import PageDescription from "~/components/core/page-description/PageDescription";
import HowItWorksModal from "../modals/HowItWorksModal";
import {
  getCount,
  getData,
  hasCreatedConfig,
  prepareParams,
  type PriceSlabType,
} from "./helper";
import DefaultSlabs from "./components/DefaultSlabs";
import AppCard from "~/components/core/card/AppCard";
import { format } from "date-fns";
import AuthService from "~/services/AuthService";
import useAppToast from "~/hooks/useAppToast";

const tabDescriptions: Record<PriceSlabType, string> = {
  global:
    "Give discount when customer buys more. Same price rule for all items.",
  menu: "Different prices for different menus like fruits, vegetables, etc.",
  category: "Same price rule for all items in one group.",
  brand: "Different prices for different brands.",
  product: "Set your own price for each item one by one.",
};

const tabs: TabItem[] = [
  { name: "Default (Global)", key: "global" },
  { name: "Menu", key: "menu" },
  { name: "Category", key: "category" },
  { name: "Brand", key: "brand" },
  { name: "Product", key: "product" },
];

export default function PriceSlabList() {
  const appToast = useAppToast();
  const { isMobile } = useScreenView();
  const { t } = useTranslation(["common"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: PriceSlabType =
    (searchParams.get("tab") as PriceSlabType) || "global";

  const [hasConfig, setHasConfig] = useState(true);

  const [priceConfigModal, setPriceConfigModal] = useState<{
    show: boolean;
    type: PriceSlabType;
    editId?: string;
    hideTabs?: boolean;
    initalTab?: "config" | "logs";
  }>({ show: false, type: "global", editId: "" });

  const [howItWorksModal, setHowItWorksModal] = useState(false);

  const breadcrumbs = useMemo(() => {
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: "Dashboard",
        langKey: "dashboard",
        redirect: { path: "/dashboard" },
      },
      { label: "Configs", langKey: "configs" },
      { label: "Manage Price" },
    ];

    if (activeTab === "global") {
      breadcrumbs.push({ label: "Global Price Slab" });
    }
    if (activeTab === "menu") {
      breadcrumbs.push({ label: "Menu Price Slab" });
    }
    if (activeTab === "category") {
      breadcrumbs.push({ label: "Category Price Slab" });
    }
    if (activeTab === "brand") {
      breadcrumbs.push({ label: "Brand Price Slab" });
    }
    if (activeTab === "product") {
      breadcrumbs.push({ label: "Product Price Slab" });
    }
    return breadcrumbs;
  }, [activeTab]);

  const handleCreateConfig = () => {
    if (
      AuthService.isMasterLogin() &&
      !AuthService.isMasterLoginWithFullAccess()
    ) {
      appToast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
    }
    setPriceConfigModal({ show: true, type: activeTab, editId: "" });
  };

  const renderCreateButton = () => (
    <AppButton
      onClick={handleCreateConfig}
      size={isMobile ? "large" : "small"}
      color="primary"
    >
      <Plus className="tw:w-4 tw:h-4" />
      Create Config
    </AppButton>
  );

  // List state
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const methods = useForm({
    defaultValues: {
      search: "",
      dateRange: [] as Date[],
      keys: [] as string[],
      status: "All",
      globalSort: "recent",
      activeTab: activeTab,
    },
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const sortRef = useRef<any>(undefined);
  const [view, setView] = useState<ViewToggleType>("list");

  const handleFilterChange = (payload: { formData: any }) => {
    const { formData } = payload;
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (formData?.search) p.set("search", formData.search);
        else p.delete("search");

        if (formData?.status && formData.status !== "All")
          p.set("status", formData.status);
        else p.delete("status");

        // handle date range (expecting [fromDate, toDate])
        if (
          formData?.dateRange &&
          Array.isArray(formData.dateRange) &&
          formData.dateRange.length === 2
        ) {
          const from = formData.dateRange[0];
          const to = formData.dateRange[1];
          try {
            const fromStr = format(new Date(from), "yyyy-MM-dd");
            const toStr = format(new Date(to), "yyyy-MM-dd");
            p.set("from", fromStr);
            p.set("to", toStr);
          } catch (e) {
            p.delete("from");
            p.delete("to");
          }
        } else {
          p.delete("from");
          p.delete("to");
        }

        return p;
      },
      { replace: true } as any,
    );
  };

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setItems([]);

    const { hasConfig } = await hasCreatedConfig(methods.getValues().activeTab);
    setHasConfig(hasConfig);

    try {
      const params = prepareParams(
        methods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      const data = await getData(params);
      setItems(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, [methods]);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "All";
    const activeTab = searchParams.get("tab") || "global";
    const values = {
      ...methods.getValues(),
      search,
      status,
      activeTab,
    };

    methods.reset(values as any);
    void applyFilter();
  }, [searchParams.toString(), applyFilter, methods]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        methods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const data = await getData(params);
      setItems((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreData, loadingMore, methods]);

  const onTabChange = (tab: TabItem) => {
    methods.setValue("search", "");
    methods.setValue("status", "All");

    setSearchParams(
      {
        tab: tab.key,
      },
      { replace: true },
    );
  };

  const itemCallback = ({ action, data }: { action: string; data?: any }) => {
    if (
      AuthService.isMasterLogin() &&
      !AuthService.isMasterLoginWithFullAccess()
    ) {
      appToast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }

    if (action === "logs") {
      setPriceConfigModal({
        show: true,
        type: activeTab || "global",
        editId: data?._id || "",
        initalTab: "logs",
        hideTabs: true,
      });
    }

    if (action === "edit") {
      // Open edit modal
      setPriceConfigModal({
        show: true,
        type: activeTab || "global",
        editId: data?._id || "",
      });
    }
  };

  const [viewLogsModal, setViewLogsModal] = useState<{
    show: boolean;
    logs: any[];
    data?: any;
  }>({ show: false, logs: [], data: undefined });

  const handleViewLogsModalCallback = (action: {
    action: string;
    data?: any;
  }) => {
    setViewLogsModal({ show: false, logs: [], data: undefined });
    // propagate or handle other actions if needed
  };

  const handleModalCallback = (action: { action: string; data?: any }) => {
    setPriceConfigModal({
      show: false,
      type: "global",
      editId: "",
      initalTab: "config",
      hideTabs: false,
    });
    if (action?.action === "save") {
      void applyFilter();
    }
  };

  const getHeaderTitle = () => {
    if (activeTab === "global") {
      return "Global Price Slab";
    }
    if (activeTab === "menu") {
      return "Menu Price Slab";
    }
    if (activeTab === "category") {
      return "Category Price Slab";
    }
    if (activeTab === "brand") {
      return "Brand Price Slab";
    }
    if (activeTab === "product") {
      return "Product Price Slab";
    }
    return "Manage Price Slab";
  };

  return (
    <>
      <AppHeader title={getHeaderTitle()} />

      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:items-start tw:md:items-center tw:mb-1 tw:gap-1">
            <div className="tw:flex-1">
              <AppBreadcrumbs data={breadcrumbs} className="tw:mb-1!" />
              <PageDescription description="priceSlab" className="tw:mb-4" />
            </div>
          </div>

          <ManagePriceTabs activeTab="priceSlab" className="tw:mb-6" />

          <div className="tw:mb-4">
            <AppTab
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={onTabChange}
              className="tw:mb-2"
              variant="underline"
            />

            {/* Tab Description with inline help button */}
            <div className="tw:flex tw:flex-row tw:items-center tw:justify-between tw:gap-3">
              <p className="tw:text-xs tw:text-gray-500 tw:leading-relaxed tw:m-0 tw:flex-1">
                {tabDescriptions[activeTab as keyof typeof tabDescriptions]}
              </p>

              <div className="tw:ml-0 tw:md:ml-4">
                <AppButton
                  onClick={() => setHowItWorksModal(true)}
                  size="small"
                  color="light"
                  fill="outline"
                >
                  <Info className="tw:w-4 tw:h-4 tw:mr-2" />
                  How it works
                </AppButton>
              </div>
            </div>
          </div>

          <div className="tw:mt-4">
            {activeTab === "global" && (
              <DefaultSlabs
                slabs={items?.[0]?.slab || []}
                id={items?.[0]?._id}
                isActive={items?.[0]?.isActive}
                callback={itemCallback}
              />
            )}

            {!hasConfig && !loading ? (
              <div className="tw:p-8 tw:border tw:border-gray-200 tw:rounded-lg tw:bg-white tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-4">
                <div className="tw:text-center">
                  <div className="tw:w-14 tw:h-14 tw:rounded-full tw:bg-gray-100 tw:flex tw:items-center tw:justify-center tw:mx-auto tw:mb-3">
                    <AlertCircle className="tw:w-7 tw:h-7 tw:text-gray-500" />
                  </div>
                  <h3 className="tw:text-base tw:font-semibold tw:text-gray-900 tw:mb-1">
                    Not Configured
                  </h3>
                  <p className="tw:text-sm tw:text-gray-600 tw:mb-4">
                    No price slab configuration set up for this category yet.
                  </p>
                </div>

                <AppButton
                  onClick={() =>
                    setPriceConfigModal({
                      show: true,
                      type: activeTab as any,
                    })
                  }
                  color="primary"
                >
                  Configure Now
                </AppButton>
              </div>
            ) : (
              <>
                {/* Show list when items are present; otherwise show the empty state */}
                {activeTab === "global" ? null : (
                  <>
                    <FormProvider {...methods}>
                      <div>
                        <Filter callback={handleFilterChange} />

                        <div className="tw:mb-4 tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-end tw:flex-wrap">
                          <div className="tw:flex-1 tw:hidden tw:md:block">
                            <PaginationSummary
                              paginationConfig={paginationRef.current}
                              loadingTotalRecords={loading}
                              loadedCount={items.length}
                              fwSize="sm"
                            />
                          </div>

                          <div className="tw:flex tw:gap-2 tw:items-center">
                            <ViewToggle viewType={view} callback={setView} />
                            {!isMobile &&
                              activeTab !== "global" &&
                              hasConfig && (
                                <div className="tw:ml-2">
                                  {renderCreateButton()}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>

                      {isMobile || view === "card" ? (
                        <>
                          <MobileView
                            loading={loading}
                            data={items}
                            callback={itemCallback}
                            showLoadMore={hasMoreData}
                            loadingMore={loadingMore}
                            loadMore={loadMore}
                            totalCount={paginationRef.current.totalRecords}
                            loadedCount={items.length}
                          />
                        </>
                      ) : (
                        <AppCard noPadding={true}>
                          <DesktopView
                            type={activeTab}
                            loading={loading}
                            data={items}
                            callback={itemCallback}
                            sortKey={""}
                            onSort={() => {}}
                            sortValue={"asc"}
                            showLoadMore={hasMoreData}
                            loadingMore={loadingMore}
                            loadMore={loadMore}
                            totalCount={paginationRef.current.totalRecords}
                            loadedCount={items.length}
                          />
                        </AppCard>
                      )}
                    </FormProvider>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isMobile && activeTab !== "global" && hasConfig && (
        <div className="app-footer tw:p-4 tw:text-end">
          {renderCreateButton()}
        </div>
      )}

      <PriceSlabConfigModal
        show={priceConfigModal.show}
        type={priceConfigModal.type}
        editId={priceConfigModal.editId || ""}
        callback={handleModalCallback}
        initalTab={priceConfigModal.initalTab}
        hideTabs={priceConfigModal.hideTabs}
      />

      <HowItWorksModal
        show={howItWorksModal}
        callback={(e: { action: string; data?: any }) => {
          if (e.action === "close") setHowItWorksModal(false);
          if (e.action === "create") {
            setHowItWorksModal(false);
            setPriceConfigModal({
              show: true,
              type: activeTab as any,
              editId: "",
            });
          }
        }}
      />

      <ViewLogsModal
        show={viewLogsModal.show}
        logs={viewLogsModal.logs}
        callback={handleViewLogsModalCallback}
      />
    </>
  );
}
