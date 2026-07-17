import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import type {
  BreadcrumbItem,
  PaginationState,
  ViewToggleType,
} from "~/types/CommonTypes";
import Filter from "./components/Filter";
// Summary component removed
import { ArrowRight, ScanLine } from "lucide-react";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import PoListTabs from "../components/tabs/PoListTabs";
import DesktopView from "./components/DesktopView";
import BusyLoader from "~/components/core/busyloader/Busyloader";

import { getCount, getData, prepareFilterParams } from "./helper";

import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import ReceiveBoxModal from "~/shared/orders/receive-box/modals/receive-box/ReceiveBoxModal";
import ViewBoxItemsModal from "~/shared/orders/receive-box/modals/view-box-items/ViewBoxItems";
import PageHeader from "~/shared/page-header/PageHeader";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import CreatePoFab from "~/shared/purchase-order/components/CreatePoFab";
import PoActionButtons from "~/shared/purchase-order/components/PoActionButtons";
import MobileView from "./components/MobileView";
import { useSearchParams } from "react-router";
import { FormProvider, useForm } from "react-hook-form";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["PURCHASE-ORDER.PO-VIEW-ORDERS"]);
}

interface FilterState {
  search?: string;
  dateRange?: Date[] | null;
  status?: string;
  feature?: string;
  purchasedFrom?: string;
}

const defaultFilter: FilterState = {
  search: "",
  dateRange: null,
  status: "",
  feature: "purchase",
  purchasedFrom: "All",
};

const NotReceivedPo = () => {
  const { t } = useTranslation(["common", "menu"]);
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const { isMobile } = useScreenView();

  const formMethods = useForm<FilterState>({
    defaultValues: {
      ...defaultFilter,
    },
  });

  const [busyLoader, setBusyLoader] = useState<{ show: boolean; msg?: string }>(
    { show: false, msg: "" }
  );

  const [view, setView] = useState<ViewToggleType>("list");

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);

  const filterRef = useRef<FilterState>({ ...defaultFilter });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: "asc" | "desc" | undefined }>({
    key: "createdAt",
    value: "desc",
  });

  const [receivePackageModal, setReceivePackageModal] = useState<{
    show: boolean;
    data: { orderId?: string; boxNo?: string; boxIndex?: number } | null;
  }>({
    show: false,
    data: null,
  });

  const [viewBoxItemsModal, setViewBoxItemsModal] = useState<{
    show: boolean;
    boxId?: string | null;
  }>({
    show: false,
    boxId: null,
  });

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    {
      label: t("purchaseOrders"),
      redirect: { path: "/dashboard/purchase-order/main" },
    },
    { label: t("yetToReceive") },
  ];

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const ordersData = await getData(params);

      setOrders(ordersData);
      setHasMoreData(ordersData.length >= paginationRef.current.rowsPerPage);

      const currentStart = paginationRef.current.startSlNo;
      const currentEnd = Math.min(
        currentStart + ordersData.length - 1,
        paginationRef.current.totalRecords
      );
      paginationRef.current.endSlNo = currentEnd;
    } catch (error) {
      console.error("Error loading not-received POs:", error);
      setOrders([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;

    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };

      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const ordersData = await getData(params);

      setOrders((prev) => [...prev, ...ordersData]);
      setHasMoreData(ordersData.length >= paginationRef.current.rowsPerPage);

      const newEnd = Math.min(
        paginationRef.current.endSlNo + ordersData.length,
        paginationRef.current.totalRecords
      );
      paginationRef.current.endSlNo = newEnd;
    } catch (error) {
      console.error("Error loading more not-received POs:", error);
      setHasMoreData(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setLoadingTotalRecords(true);
    setOrders([]);

    try {
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
    } finally {
      setLoadingTotalRecords(false);
      setLoading(false);
    }

    await loadList();
  }, [loadList]);

  const handleFilterChange = useCallback(
    (filterData: Partial<FilterState>) => {
      filterRef.current = { ...filterRef.current, ...filterData };
      applyFilter();
    },
    [applyFilter]
  );

  // Callback to handle actions coming from Desktop/Mobile view
  const handleRowAction = useCallback(
    async (a: { action: string; data: any; index?: number }) => {
      if (a.action === "receive") {
        // If package belongs to SK, open SK receive modal. Otherwise
        // redirect to the purchase-order process page for non-SK flow.
        if (!a.data?.isNonSkVendor) {
          setReceivePackageModal({
            show: true,
            data: {
              orderId: a.data?.orderIdToProcess || "",
              boxNo: a.data?.refNo || "",
              boxIndex: a.index,
            },
          });
        } else {
          appNav.to(
            `/dashboard/purchase-order/process/${a.data?.orderData?.id}`
          );
        }
      } else if (a.action === "view-items") {
        // Explicitly open box items modal when user taps the view (Eye) button
        setViewBoxItemsModal({
          show: true,
          boxId: a.data?.refNo || a.data?._id,
        });
      }
    },
    [appNav]
  );

  const handleReceivePackageModalCallback = useCallback(
    (a: { action: string; data?: any }) => {
      const boxIndex = receivePackageModal.data?.boxIndex;
      setReceivePackageModal({ show: false, data: null });

      if (a?.action === "success" || a?.action === "received") {
        // Immediately update local state to remove the received box by index
        if (boxIndex !== undefined && boxIndex >= 0) {
          setOrders((prevOrders) =>
            prevOrders.filter((_, index) => index !== boxIndex)
          );
        }
        // Then reload from server to ensure consistency
        applyFilter();
      }
    },
    [applyFilter, receivePackageModal.data?.boxIndex]
  );

  useEffect(() => {
    const qp: any = {};
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (dateFrom && dateTo) {
      qp.dateRange = [new Date(dateFrom), new Date(dateTo)];
    }

    const search = searchParams.get("search");
    if (search) {
      qp.search = search;
    }

    filterRef.current = { ...defaultFilter, ...qp, status: "yetToReceive" };

    formMethods.setValue("dateRange", qp.dateRange || []);
    formMethods.setValue("search", qp.search || "");

    applyFilter();
  }, [searchParams, formMethods]);

  return (
    <>
      <AppHeader
        title={t("purchaseOrders")}
        showAudioNote={true}
        audioNoteTitle={t("purchaseOrders")}
        audioFeature="po"
      />
      <div className="page-padding page-bg app-page has-footer theme-2-no-footer">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              `sticky` pins them under the header and breaks out of the page
              padding so the underline runs edge to edge. */}
          <SectionTabs
            sectionKey="supply"
            activeTab="purchase-orders"
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="purchase-orders"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
          <div className="theme-2-mobile-hide tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-2 tw:mb-4">
            <PageHeader
              breadcrumbs={defaultBreadcrumbs}
              title={t("yetToReceive")}
              description="purchaseOrder.yetToReceive"
            />
            <PoActionButtons />
          </div>

          <PoListTabs activeTab="receive-orders" className="tw:mb-4" />

          {/* Summary removed */}

          <div>
            <FormProvider {...formMethods}>
              <Filter
                onFilterChange={handleFilterChange}
                feature={filterRef.current.feature || "purchase"}
                className="tw:mb-4"
              />
            </FormProvider>
            <div className="tw:flex tw:justify-between tw:items-end tw:mb-3">
              <div>
                <PaginationSummary
                  paginationConfig={paginationRef.current}
                  loadingTotalRecords={loadingTotalRecords}
                  fwSize="sm"
                  loadedCount={orders.length}
                />
              </div>
              <ViewToggle viewType={view} callback={setView} />
            </div>
          </div>

          {orders.length === 0 && !loading ? (
            <AppCard>
              <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-12 tw:text-gray-500">
                <div>{t("noPurchaseOrdersFound")}</div>
                <div className="tw:text-xs tw:mt-1">
                  {t("tryAdjustingFilters")}
                </div>
              </div>
            </AppCard>
          ) : isMobile || view == "card" ? (
            <>
              <MobileView
                data={orders}
                callback={handleRowAction}
                loading={loading}
                showLoadMore={hasMoreData}
                loadMore={loadMore}
                loadingMore={loadingMore}
                totalCount={paginationRef.current.totalRecords}
              />
            </>
          ) : (
            <AppCard noPadding>
              <DesktopView
                data={orders}
                callback={handleRowAction}
                tab={"receive-orders"}
                sortKey={sortRef.current.key}
                sortValue={sortRef.current.value || "desc"}
                sortCb={() => {}}
                loading={loading}
                showLoadMore={hasMoreData}
                loadingMore={loadingMore}
                loadMore={loadMore}
                totalCount={paginationRef.current.totalRecords}
              />
            </AppCard>
          )}
            </div>
          </div>
        </div>
      </div>
      <footer className="app-footer theme-2-mobile-hide">
        <div className="tw:md:text-end">
          <AppButton
            color="primary"
            onClick={() => appNav.to("/dashboard/purchase-order/box-receive")}
            className="tw:font-semibold tw:w-full tw:md:w-auto"
          >
            <ScanLine size={16} />
            {t("scanBox")}
            <ArrowRight className="tw:ml-1" size={16} />
          </AppButton>
        </div>
      </footer>

      <CreatePoFab />

      <ReceiveBoxModal
        show={receivePackageModal.show}
        callback={handleReceivePackageModalCallback}
        orderId={receivePackageModal.data?.orderId || ""}
        boxNo={receivePackageModal.data?.boxNo || ""}
      />

      <ViewBoxItemsModal
        show={viewBoxItemsModal.show}
        callback={(a: { action: string; data?: any }) => {
          setViewBoxItemsModal({ show: false, boxId: null });
        }}
        boxId={viewBoxItemsModal.boxId}
      />

      <BusyLoader show={busyLoader.show} message={busyLoader.msg} />
    </>
  );
};

export default NotReceivedPo;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle(
        "Purchase Orders - Yet to Receive"
      ),
    },
  ];
}
