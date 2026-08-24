import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { debounce } from "lodash";
import { Search, X } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppHeader from "~/components/core/header/AppHeader";
import PageAccessService from "~/services/PageAccessService";
import CommonService from "~/services/CommonService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import DeliverySectionTabs from "~/shared/delivery/components/delivery-section-tabs/DeliverySectionTabs";
import DeliverySidePane from "~/shared/delivery/components/delivery-side-pane/DeliverySidePane";
import type { PaginationState, TabItem } from "~/types/CommonTypes";
import { useSearchParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import SegmentedControl from "~/components/core/segmented-control/SegmentedControl";
import { getCount, getData, getHandoffCounts, prepareParams } from "./helper";
import HandOffCard from "./components/HandOffCard";
import HandOffCardDesktop from "./components/HandOffCardDesktop";
import DeliveryAssignOtpVerifyModal from "~/modals/feature/delivery/DeliveryAssignOtpVerifyModal";
import OrderDetailModal from "~/shared/orders/modals/order-detail/OrderDetailModal";
import useAppToast from "~/hooks/useAppToast";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["DELIVERY.DISPATCH"]);
}

const defaultTabs: TabItem[] = [
  {
    name: "Waiting",
    key: "waiting",
  },
  {
    name: "Verified Today",
    key: "verified-today",
  },
];

export default function HandOff() {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const [searchParams] = useSearchParams();

  const activeTab = defaultTabs.some((t) => t.key === searchParams.get("tab"))
    ? (searchParams.get("tab") as string)
    : defaultTabs[0].key;
  const activeStatus = activeTab === "verified-today" ? "Delivered" : "Pending";

  const { register, getValues } = useForm({
    defaultValues: {
      search: "",
    },
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [otpModal, setOtpModal] = useState<{ show: boolean; data?: any }>({
    show: false,
  });
  const [detailOrderId, setDetailOrderId] = useState<string>("");
  const [showSearch, setShowSearch] = useState(false);
  const [counts, setCounts] = useState<{
    waiting: number;
    verifiedToday: number;
  }>({
    waiting: 0,
    verifiedToday: 0,
  });

  const tabs: TabItem[] = useMemo(
    () =>
      defaultTabs.map((tab) =>
        tab.key === "waiting"
          ? { ...tab, count: counts.waiting }
          : { ...tab, count: counts.verifiedToday },
      ),
    [counts],
  );

  const handleToggleSearch = useCallback(() => {
    setShowSearch((prev) => !prev);
  }, []);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({});

  const applyFilter = useCallback(async () => {
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
        filterRef.current,
        paginationRef.current,
        activeStatus,
      );
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      console.log("handsoff fetch error", e);
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };
    const params = prepareParams(
      filterRef.current,
      paginationRef.current,
      activeStatus,
    );
    const result = await getData(params);
    setData([...data, ...result]);
    setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    setLoadingMore(false);
  };

  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  useEffect(() => {
    let active = true;
    getHandoffCounts().then((result) => {
      if (active) setCounts(result);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleTabChange = (tab: TabItem) => {
    appNav.to(
      "/dashboard/delivery/hand-off",
      { tab: tab.key },
      { replace: true },
    );
  };

  const handleSearchChange = useCallback(
    debounce(() => {
      filterRef.current = {
        ...filterRef.current,
        search: getValues("search"),
      };
      applyFilter();
    }, 500),
    [applyFilter, getValues],
  );

  const handleCardClick = useCallback((item: any) => {
    const orderId = item?.order?.id;
    if (orderId) setDetailOrderId(orderId);
  }, []);

  const handleVerifyClick = useCallback((item: any) => {
    const shipmentId = item?._id || item?.shipmentId;
    setOtpModal({
      show: true,
      data: {
        orderId: item?.order?._id || item?.orderId,
        orderRefNo:
          item?.order?.orderRefNo || item?.invoiceNumber || item?.orderRefNo,
        assignmentResponse: {
          shipmentId,
        },
        deliveryPersonName: item?.deliveryAgent?.name || undefined,
        deliveryPersonContact: item?.deliveryAgent?.contact || undefined,
        customerName: item?.deliveryAddress?.recipientName || undefined,
        itemCount: item?.totalUnits ?? item?.orderedItems,
      },
    });
  }, []);

  const handleOtpModalCallback = useCallback(
    (args: { action: string; data?: any }) => {
      if (args.action === "close" || args.action === "back") {
        setOtpModal({ show: false });
      } else if (args.action === "success") {
        appToast.show({
          msg: t("deliveryCodeVerifiedSuccessfully"),
          color: "success",
        });
        setOtpModal({ show: false });
        setTimeout(() => applyFilter(), 800);
      }
    },
    [appToast, applyFilter, t],
  );

  return (
    <>
      <AppHeader
        title="HandOff"
        sectionKey="bill"
        activeTab="logistics"
        mobileLead="menu"
        renderActions={
          isMobile && (
            <AppButton
              onClick={handleToggleSearch}
              size="default"
              fill="clear"
              color="dark"
              noShadow
            >
              {showSearch ? (
                <X className="tw:h-5 tw:w-5" />
              ) : (
                <Search className="tw:h-5 tw:w-5" />
              )}
            </AppButton>
          )
        }
      />

      <div className="app-page page-bg page-padding">
        <DeliverySectionTabs activeTab="hand-off" />

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — bill section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="bill"
                activeTab="logistics"
                title="Delivery"
              />
            </div>
          </aside>

          <div className="section-content">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              {/* Main column — the handoff list. */}
              <AppPaneMain className="tw:lg:col-span-12">
                <div className="app-bleed-x tw:-mt-4 tw:mb-4 tw:flex tw:flex-col tw:max-md:mt-0">
                  {isMobile && (
                    <div className="tw:bg-white tw:px-4 tw:py-2">
                      <SegmentedControl
                        items={tabs}
                        value={activeTab}
                        onChange={(key) => handleTabChange({ name: key, key })}
                      />
                    </div>
                  )}
                  {(isMobile ? showSearch : true) && (
                    <div className="tw:-ml-4 tw:-mr-4 tw:sticky tw:top-[60px] tw:z-10 tw:flex tw:items-center tw:gap-2 tw:bg-white tw:px-4 tw:py-3">
                      <div className="tw:flex-1">
                        <AppInput
                          register={register}
                          name="search"
                          placeholder={t("searchByOrderIdCustomerNameMobile")}
                          className="tw:w-full"
                          onChange={handleSearchChange}
                          leftIcon={<Search size={16} />}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {!loading && data.length > 0 && (
                  <div className="tw:mb-4">
                    <PaginationSummary
                      paginationConfig={paginationRef.current}
                      loadingTotalRecords={loading}
                      loadedCount={data.length}
                      fwSize="sm"
                    />
                  </div>
                )}

                {loading ? (
                  <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="tw:animate-pulse tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-4"
                      >
                        <div className="tw:flex tw:items-center tw:gap-3">
                          <div className="tw:h-11 tw:w-11 tw:rounded-full tw:bg-slate-200" />
                          <div className="tw:flex-1">
                            <div className="tw:h-4 tw:w-32 tw:rounded tw:bg-slate-200" />
                            <div className="tw:mt-2 tw:h-3 tw:w-24 tw:rounded tw:bg-slate-200" />
                          </div>
                          <div className="tw:h-5 tw:w-16 tw:rounded-full tw:bg-slate-200" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : data.length === 0 ? (
                  <NoData />
                ) : isMobile ? (
                  <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
                    {data.map((item, index) => {
                      const id = item?._id;
                      return (
                        <HandOffCard
                          key={id}
                          data={item}
                          index={index}
                          onClick={handleVerifyClick}
                          onView={handleCardClick}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
                    {data.map((item, index) => {
                      const id = item?._id;
                      return (
                        <HandOffCardDesktop
                          key={id}
                          data={item}
                          index={index}
                          onClick={handleVerifyClick}
                          onView={handleCardClick}
                        />
                      );
                    })}
                  </div>
                )}

                {hasMoreData && !loading && data.length > 0 && (
                  <div className="tw:flex tw:justify-center tw:mt-4">
                    <LoadMoreButton
                      loadMore={loadMore}
                      loadedCount={data.length}
                      loading={loadingMore}
                      totalCount={paginationRef.current.totalRecords}
                    />
                  </div>
                )}
              </AppPaneMain>

              {/* Side column — theme-2 desktop side pane. */}
              <AppPaneSide className="app-pane-only">
                <DeliverySidePane activeKey="handoff" activeNavKey="handoffs" />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      <DeliveryAssignOtpVerifyModal
        show={otpModal.show}
        callback={handleOtpModalCallback}
        data={otpModal.data}
      />

      <OrderDetailModal
        orderId={detailOrderId}
        show={!!detailOrderId}
        callback={({ action }) => {
          if (action === "close") setDetailOrderId("");
        }}
      />
    </>
  );
}

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("HandOff"),
    },
  ];
}
