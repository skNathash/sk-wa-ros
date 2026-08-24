import {
  CheckCircle2,
  Clock,
  Layers,
  Plus,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppTab from "~/components/core/tab/AppTab";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import WhatsappTemplateRequestModal from "~/shared/notifications/whatsapp-template-request/WhatsappTemplateRequestModal";
import type {
  BreadcrumbItem,
  PaginationState,
  TabItem,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import RequestDetailsModal from "./modals/RequestDetailsModal";
import Summary from "./components/Summary";
import { getCount, getData, getSummary, prepareParams } from "./helper";

const tabs: TabItem[] = [
  { key: "All", name: "All Requests", icon: <Layers size={16} /> },
  { key: "Pending", name: "Pending", icon: <Clock size={16} /> },
  { key: "Approved", name: "Approved", icon: <CheckCircle2 size={16} /> },
  { key: "Rejected", name: "Rejected", icon: <XCircle size={16} /> },
];

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  { label: "WhatsApp Template Requests" },
];

export default function WhatsappTemplateRequestList() {
  const { isMobile } = useScreenView();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "All";

  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setView] = useState<ViewToggleType>("list");
  const [requestModal, setRequestModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState<{
    show: boolean;
    request: any;
  }>({ show: false, request: null });
  const [imgPreviewModal, setImgPreviewModal] = useState<{
    show: boolean;
    images: Array<{ id: string }>;
  }>({ show: false, images: [] });

  const methods = useForm({
    defaultValues: {
      search: "",
      status: "all",
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
        if (formData?.search) p.set("search", formData.search);
        else p.delete("search");
        if (formData?.status && formData.status !== "all")
          p.set("status", formData.status);
        else p.delete("status");
        return p;
      },
      { replace: true } as any,
    );
  };

  const handleTabChange = (tab: TabItem) => {
    methods.reset({ search: "", status: "all" });
    setSearchParams(
      () => {
        const p = new URLSearchParams();
        if (tab.key !== "All") p.set("tab", tab.key);
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
      const params = prepareParams(
        methods.getValues(),
        paginationRef.current,
        activeTab,
      );
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      const data = await getData(params);
      setItems(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
      const summaryData = await getSummary(methods.getValues());
      setSummary(summaryData);
    } finally {
      setLoading(false);
    }
  }, [methods, activeTab]);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    const values = {
      ...methods.getValues(),
      search,
      status,
    };
    methods.reset(values as any);
    void applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), applyFilter, methods]);

  // Auto-open the request modal when navigated with ?openRequest=1,
  // then strip the param so it doesn't re-open on refresh/back.
  useEffect(() => {
    if (!searchParams.get("openRequest")) return;
    setRequestModal(true);
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete("openRequest");
        return p;
      },
      { replace: true } as any,
    );
  }, [searchParams, setSearchParams]);

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
        activeTab,
      );
      const data = await getData(params);
      setItems((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreData, loadingMore, methods, activeTab]);

  const itemCallback = ({ action, data }: { action: string; data?: any }) => {
    switch (action) {
      case "preview-image": {
        const images: string[] = Array.isArray(data?.images) ? data.images : [];
        if (images.length) {
          setImgPreviewModal({
            show: true,
            images: images.map((id) => ({ id })),
          });
        }
        break;
      }
      case "rowClick":
      case "view":
        setDetailsModal({ show: true, request: data });
        break;
      default:
        break;
    }
  };

  const handleDetailsCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action === "close") {
      setDetailsModal({ show: false, request: null });
      return;
    }
    itemCallback({ action, data });
  };

  const handleRequestModalCallback = ({ action }: { action: string }) => {
    setRequestModal(false);
    if (action === "submit") {
      void applyFilter();
    }
  };

  return (
    <>
      <AppHeader title="WhatsApp Template Requests" />

      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:items-start tw:md:items-center tw:mb-1 tw:gap-1">
            <div className="tw:flex-1">
              <AppBreadcrumbs data={breadcrumbs} className="tw:mb-1!" />
            </div>
            {!isMobile && (
              <AppButton
                onClick={() => setRequestModal(true)}
                size="small"
                color="primary"
              >
                <Plus className="tw:w-4 tw:h-4" />
                Request Template
              </AppButton>
            )}
          </div>

          <div className="tw:mt-4">
            <div>
              <div className="tw:mb-3">
                <h2 className="tw:text-base tw:font-semibold tw:text-slate-800">
                  WhatsApp Template Requests
                </h2>
                <p className="tw:text-xs tw:text-slate-500 tw:mt-0.5">
                  Raise and track requests for new WhatsApp promotion templates
                </p>
              </div>

              <Summary summary={summary} />

              <div className="tw:mb-3">
                <AppTab
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />
              </div>

              <FormProvider {...methods}>
                <Filter callback={handleFilterChange} />
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
                />
              </AppCard>
            )}
          </div>
        </div>
      </div>

      {isMobile && (
        <div className="app-footer tw:p-4 tw:text-end">
          <AppButton
            onClick={() => setRequestModal(true)}
            size="large"
            color="primary"
          >
            <Plus className="tw:w-4 tw:h-4" />
            Request Template
          </AppButton>
        </div>
      )}

      <WhatsappTemplateRequestModal
        show={requestModal}
        callback={handleRequestModalCallback}
      />

      <RequestDetailsModal
        show={detailsModal.show}
        request={detailsModal.request}
        callback={handleDetailsCallback}
      />

      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={() => setImgPreviewModal({ show: false, images: [] })}
        images={imgPreviewModal.images}
      />
    </>
  );
}
