import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import { getData, getCount, prepareParams } from "./helper";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import PageDescription from "~/components/core/page-description/PageDescription";
import CaseTab from "./components/CaseTab";
import InventoryTab from "../components/tab/InventoryTab";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import type { ViewToggleType } from "~/types/CommonTypes";
import useScreenView from "~/hooks/useScreenView";
import MobileView from "./components/MobileView";
import DesktopView from "./components/DesktopView";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import { Plus } from "lucide-react";
import Filter from "./components/Filter";
import { useSearchParams } from "react-router";
import { getSummary } from "./helper";
import Summary from "./components/Summary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import UnitConfigurationModal from "~/shared/catalog/modals/unit-configuration/UnitConfigurationModal";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Inventory",
    redirect: {
      path: "/dashboard/inventory",
    },
  },
  {
    label: "Sell In Config",
  },
];

const Cases = () => {
  const { isMobile } = useScreenView();
  const appNav = useAppNav();
  const [searchParams, setSearchParams] = useSearchParams();

  const formMethods = useForm({
    defaultValues: {
      search: searchParams.get("search") || "",
      sellingType: searchParams.get("sellingType") || "all",
      alpha: searchParams.get("alpha") || "",
    },
  });

  const [viewType, setViewType] = useState<ViewToggleType>("card");

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [configModal, setConfigModal] = useState<{
    show: boolean;
    dealId: string;
  }>({
    show: false,
    dealId: "",
  });

  const [summary, setSummary] = useState<{
    totalCount: number;
    caseCount: number;
    innerCaseCount: number;
  }>({
    totalCount: 0,
    caseCount: 0,
    innerCaseCount: 0,
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const applyFilter = async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(
        formMethods.getValues(),
        paginationRef.current,
      );

      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);

      const summary = await getSummary(params);
      setSummary({
        totalCount: totalRecords,
        caseCount: summary.caseCount,
        innerCaseCount: summary.innerCaseCount,
      });
    } catch (error) {
      console.error("Error fetching cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderActionButton = () => {
    return (
      <div className="tw:flex tw:gap-2">
        <AppButton
          color="primary"
          onClick={() =>
            appNav.to("/configs/product-select", {
              feature: "PackUpdate",
              source: "cases",
            })
          }
          className="tw:w-full tw:flex-1"
        >
          <Plus size={16} />
          Config Sell In
        </AppButton>
      </div>
    );
  };

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const sellingType = searchParams.get("sellingType") || "all";
    const alpha = searchParams.get("alpha") || "";

    formMethods.setValue("search", search);
    formMethods.setValue("sellingType", sellingType);
    formMethods.setValue("alpha", alpha || "");
    applyFilter();
  }, [searchParams]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        formMethods.getValues(),
        paginationRef.current,
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (error) {
      console.error("Error loading more cases:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleFilterChange = (args: { action: string; data?: any }) => {
    let params: Record<string, any> = new URLSearchParams();

    if (args.data?.search) {
      params.search = args.data.search;
    }

    if (args.data?.sellingType) {
      params.sellingType = args.data.sellingType;
    }

    if (args.data?.alpha) {
      params.alpha = args.data.alpha;
    }

    setSearchParams({ ...params }, { replace: true });
  };

  const handleViewCallback = (args: { action: string; data: any }) => {
    if (args.action === "edit") {
      setConfigModal({
        show: true,
        dealId: args.data._id,
      });
    }
  };

  const updateSingleItem = async (dealId: string) => {
    try {
      const currentFilters = formMethods.getValues();
      const pagination = { ...paginationRef.current, activePage: 1 };
      const params = prepareParams(currentFilters, pagination);

      // Add dealId to filter to get updated data for that specific deal
      params.filter.dealId = dealId;

      const result = await getData(params);

      const itemExists = data.find((item) => item._id === dealId);

      if (result && result.length > 0) {
        if (itemExists) {
          setData((prev) =>
            prev.map((item) => (item._id === dealId ? result[0] : item)),
          );
        } else {
          // If it didn't exist (unlikely in this flow) or we want to be safe
          // Actually, if it didn't exist but now matches, we might not want to append it
          // as it might belong on a different page. For now, just update if it exists.
        }
      } else {
        // Item no longer matches the current filters, remove it
        setData((prev) => prev.filter((item) => item._id !== dealId));
      }

      // Always update summary as it might have changed
      const summaryParams = prepareParams(
        currentFilters,
        paginationRef.current,
      );
      const [newSummary, newCount] = await Promise.all([
        getSummary(summaryParams),
        getCount(summaryParams),
      ]);

      setSummary({
        totalCount: newCount,
        caseCount: newSummary.caseCount,
        innerCaseCount: newSummary.innerCaseCount,
      });
      paginationRef.current.totalRecords = newCount;
    } catch (error) {
      console.error("Error updating single item:", error);
    }
  };

  const handleModalCallback = (args: { action: string; data?: any }) => {
    if (args.action === "close") {
      setConfigModal({ show: false, dealId: "" });
    } else if (args.action === "submit") {
      setConfigModal({ show: false, dealId: "" });
      if (args.data?.dealId) {
        updateSingleItem(args.data.dealId);
      } else {
        applyFilter();
      }
    }
  };

  return (
    <>
      <AppHeader title="Sell In Config" />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:lg:flex-row tw:lg:justify-between tw:items-start tw:lg:items-center tw:mb-4 tw:gap-3">
            <div className="tw:flex-1">
              <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
              <PageDescription description="cases" />
            </div>
            <div className="tw:flex tw:items-center tw:gap-3 tw:flex-wrap">
              <div className="tw:md:flex tw:hidden">{renderActionButton()}</div>
            </div>
          </div>

          <InventoryTab activeTab="cases" className="tw:mb-2" />

          <Summary summary={summary} />

          <CaseTab
            activeTab={formMethods.watch("sellingType")}
            onTabChange={(tab) => {
              formMethods.setValue("sellingType", tab.key);
              handleFilterChange({
                action: "sellingType",
                data: formMethods.getValues(),
              });
            }}
            className="tw:mb-4"
          />

          <FormProvider {...formMethods}>
            <Filter callback={handleFilterChange} />
          </FormProvider>

          <div className="tw:flex tw:items-center tw:justify-between tw:mb-4">
            <div className="tw:flex-1">
              <PaginationSummary
                paginationConfig={paginationRef.current}
                loadingTotalRecords={loading}
                fwSize="sm"
                loadedCount={data.length}
              />
            </div>

            <div>
              <ViewToggle viewType={viewType} callback={setViewType} />
            </div>
          </div>

          {isMobile || viewType === "card" ? (
            <MobileView
              data={data}
              loading={loading}
              loadMore={loadMore}
              loadingMore={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={data.length}
              showLoadMore={hasMoreData}
              callback={handleViewCallback}
            />
          ) : (
            <AppCard noPadding>
              <DesktopView
                data={data}
                loading={loading}
                loadMore={loadMore}
                loadingMore={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
                showLoadMore={hasMoreData}
                callback={handleViewCallback}
              />
            </AppCard>
          )}
          {isMobile && <div className="app-footer">{renderActionButton()}</div>}
        </div>
      </div>
      <UnitConfigurationModal
        show={configModal.show}
        dealId={configModal.dealId}
        callback={handleModalCallback}
      />
    </>
  );
};

export default Cases;
