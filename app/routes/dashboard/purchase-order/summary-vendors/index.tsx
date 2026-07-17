import { endOfDay, startOfDay } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useLocation, useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PageDescription from "~/components/core/page-description/PageDescription";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import Loader from "./components/Loader";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareFilterParams } from "./helper";

const defaultBreadcrumbs = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  {
    label: "Purchase Orders",
    redirect: { path: "/dashboard/purchase-order/summary" },
  },
  { label: "Vendors" },
];

const defaultFilter = {
  search: "",
  vendorType: "All",
};

const getPageTitle = (groupByType: string) => {
  if (groupByType === "total") {
    return "All Vendors";
  }
  return `Vendors - ${
    groupByType === "received" ? "Received POs" : "Not Received POs"
  }`;
};

const getPageDescription = (groupByType: string) => {
  if (groupByType === "total") {
    return "List of all vendors with purchase order summary";
  }
  if (groupByType === "received") {
    return "List of vendors with received purchase orders";
  }
  if (groupByType === "notReceived") {
    return "List of vendors with not received purchase orders";
  }
  return "";
};

const SummaryVendors = () => {
  const methods = useForm();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { isMobile } = useScreenView();
  const appNav = useAppNav();

  const [view, setView] = useState<ViewToggleType>("list");

  const [pageTitle, setPageTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [breadcrumbs] = useState(defaultBreadcrumbs);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const filterRef = useRef<Record<string, any>>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const groupByType =
    useWatch({ control: methods.control, name: "groupByType" }) || "";

  // When search params change in the URL, sync them into the form and apply filter
  useEffect(() => {
    const s = Object.fromEntries(Array.from(searchParams.entries()));

    const newFormValues: any = {
      groupByType: s.groupByType || "",
    };

    if (s.search) {
      newFormValues.search = s.search;
    }

    if (s.vendorId || s.vendorName) {
      // map vendor fields similar to summary page
      newFormValues.vendorInfo = {
        vendorId: s.vendorId,
        name: s.vendorName,
        _id: s.vendorId,
      };
    }

    if (s.dateFrom && s.dateTo) {
      try {
        newFormValues.dateRange = [new Date(s.dateFrom), new Date(s.dateTo)];
      } catch (e) {
        // ignore parse errors
      }
    }

    // set form values silently
    Object.keys(newFormValues).forEach((k) => {
      methods.setValue(k as any, newFormValues[k]);
    });

    // update filterRef so prepareParams uses the latest form state
    filterRef.current = { ...filterRef.current, ...methods.getValues() };

    setPageTitle(getPageTitle(s.groupByType));
    setDescription(getPageDescription(s.groupByType));

    // apply filter after syncing form
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const init = useCallback(() => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    applyFilter();
  }, []);

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setVendors([]);
    try {
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current
      );
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
    } finally {
      setLoading(false);
    }

    loadList();
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current
      );
      const data = await getData(params);
      setVendors(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error loading summary vendors:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };
    setLoadingMore(true);
    try {
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current
      );
      const data = await getData(params);
      setVendors((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error loading more summary vendors:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const onFilterChange = (a: { formData: any; action: string }) => {
    filterRef.current = { ...filterRef.current, ...a.formData };

    try {
      const params: Record<string, any> = {};

      if (filterRef.current.search?.trim()) {
        params.search = filterRef.current.search.trim();
      }

      if (filterRef.current.vendorInfo?._id) {
        params.vendorId = filterRef.current.vendorInfo.vendorId;
        params.vendorName = filterRef.current.vendorInfo.name;
      }

      if (
        filterRef.current.dateRange &&
        Array.isArray(filterRef.current.dateRange) &&
        filterRef.current.dateRange.length === 2
      ) {
        params.dateFrom = startOfDay(
          filterRef.current.dateRange[0]
        ).toISOString();
        params.dateTo = endOfDay(filterRef.current.dateRange[1]).toISOString();
      }

      if (filterRef.current.groupByType) {
        params.groupByType = filterRef.current.groupByType;
      }

      if (Object.keys(params).length > 0) {
        appNav.replace(location.pathname, params);
      } else {
        // remove query params when no filters
        appNav.replace(location.pathname);
      }
    } catch (e) {
      // ignore errors during URL sync
    }
  };

  const handleItemCb = (a: { action: string; data: any }) => {
    if (a.action === "viewVendor") {
      const row = a.data || {};
      const id = row?._id || row?.vendorInfo?.id;
      if (id) {
        appNav.to(
          `/dashboard/vendor/view/${id}/purchase-order?tab=purchase-order`
        );
      }
    }
  };

  return (
    <>
      <AppHeader title="Purchase Orders - Vendors" />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <div className="tw:mb-4">
            <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
            <PageDescription description="purchaseOrder" />
          </div>

          <FormProvider {...methods}>
            <Filter callback={onFilterChange} />
          </FormProvider>

          <div className="tw:flex tw:justify-between tw:items-end tw:mb-2">
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loading}
              loadedCount={vendors.length}
              fwSize="sm"
            />
            <ViewToggle viewType={view} callback={setView} />
          </div>

          {isMobile || view === "card" ? (
            <MobileView
              data={vendors}
              groupByType={groupByType}
              showLoadMore={hasMoreData}
              loadMore={loadMore}
              loadingMore={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={vendors.length}
            />
          ) : (
            <AppCard noPadding={true}>
              <DesktopView
                data={vendors}
                loading={loading}
                callback={handleItemCb}
                showLoadMore={hasMoreData}
                loadMore={loadMore}
                loadingMore={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                groupByType={groupByType}
              />
            </AppCard>
          )}
        </div>
      </div>
    </>
  );
};

export default SummaryVendors;
