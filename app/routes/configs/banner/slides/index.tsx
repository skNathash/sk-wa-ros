import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import type {
  BreadcrumbItem,
  PaginationState,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import Filter from "./Filter";
import { getCount, getData, prepareParams } from "./helper";
import PageAccessService from "~/services/PageAccessService";
import AuthService from "~/services/AuthService";

export async function clientLoader() {
  return PageAccessService.canAccessPage([
    "BANNER.BANNER-VIEW",
    "BANNER.BANNER-CREATE",
  ]);
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  { label: "Banner Slides" },
];

export default function BannerSlidesList() {
  const { isMobile } = useScreenView();
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useAppNav();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setView] = useState<ViewToggleType>("list");

  const methods = useForm({
    defaultValues: {
      platformType: "B2B",
      pageLocation: "All",
    },
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const handleFilterChange = (payload: { formData: any }) => {
    const { formData } = payload;
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (formData?.platformType && formData.platformType !== "All")
          p.set("platformType", formData.platformType);
        else p.delete("platformType");
        if (formData?.pageLocation && formData.pageLocation !== "All")
          p.set("pageLocation", formData.pageLocation);
        else p.delete("pageLocation");
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

    try {
      const params = prepareParams(methods.getValues(), paginationRef.current);
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
    const platformType = searchParams.get("platformType") || "B2B";
    const pageLocation = searchParams.get("pageLocation") || "All";
    const values = {
      ...methods.getValues(),
      platformType,
      pageLocation,
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
      const params = prepareParams(methods.getValues(), paginationRef.current);
      const data = await getData(params);
      setItems((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreData, loadingMore, methods]);

  const getNavParams = () => {
    const params: Record<string, string> = {};
    const platformType = searchParams.get("platformType");
    const pageLocation = searchParams.get("pageLocation");
    if (platformType) params.platformType = platformType;
    if (pageLocation) params.pageLocation = pageLocation;
    return params;
  };

  const canCreate = AuthService.isRbacEnabled(["BANNER.BANNER-CREATE"]);

  const handleAddSlide = ({ configId }: { configId?: string } = {}) => {
    const params = getNavParams();
    if (configId) params.configId = configId;
    nav.to("/configs/banner/manage-slide", params);
  };

  const itemCallback = ({ action, data }: { action: string; data?: any }) => {
    if (action === "edit" || action === "rowClick") {
      const params = getNavParams();
      if (data?._id) params.id = data._id;
      nav.to("/configs/banner/manage-slide", params);
    }
  };

  return (
    <>
      <AppHeader title="Banner Slides" />

      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:items-start tw:md:items-center tw:mb-1 tw:gap-1">
            <div className="tw:flex-1">
              <AppBreadcrumbs data={breadcrumbs} className="tw:mb-1!" />
            </div>
          </div>

          <div className="tw:mt-4">
            <div>
              <div className="tw:mb-3">
                <h2 className="tw:text-base tw:font-semibold tw:text-slate-800">
                  Banner Slides
                </h2>
                <p className="tw:text-xs tw:text-slate-500 tw:mt-0.5">
                  View and manage individual banner slides — filter by platform
                  or page location
                </p>
              </div>

              <FormProvider {...methods}>
                <Filter
                  callback={handleFilterChange}
                  onAddSlide={canCreate ? handleAddSlide : undefined}
                />
              </FormProvider>

              <div className="tw:mb-3 tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:flex-wrap tw:gap-2">
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
                </div>
              </div>
            </div>

            {isMobile || view === "card" ? (
              <MobileView
                loading={loading}
                data={items}
                callback={itemCallback}
                showLoadMore={hasMoreData}
                loadingMore={loadingMore}
                loadMore={loadMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={items.length}
                onAddSlide={canCreate ? () => handleAddSlide() : undefined}
              />
            ) : (
              <AppCard noPadding={true}>
                <DesktopView
                  loading={loading}
                  data={items}
                  callback={itemCallback}
                  showLoadMore={hasMoreData}
                  loadingMore={loadingMore}
                  loadMore={loadMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={items.length}
                  onAddSlide={canCreate ? () => handleAddSlide() : undefined}
                />
              </AppCard>
            )}
          </div>
        </div>
      </div>

    </>
  );
}
