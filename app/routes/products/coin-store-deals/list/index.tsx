import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import PageDescription from "~/components/core/page-description/PageDescription";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import { Skeleton } from "~/components/ui/skeleton";
import CommonService from "~/services/CommonService";
import MiscService from "~/services/MiscService";
import type { BreadcrumbItem, ViewToggleType } from "~/types/CommonTypes";
import CoinStoreBanner from "./components/CoinStoreBanner";
import CoinsTab from "~/shared/coins/components/CoinsTab";
import Item from "./components/Item";
import { getCount, getData, prepareParams } from "./helper";

const CoinStoreDealsList = () => {
  const { t } = useTranslation(["common"]);

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Products",
      redirect: { path: "/products/sk" },
    },
    {
      label: "Coin Store",
      langKey: "kingCoinStore",
    },
  ];

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);
  const [view, setView] = useState<ViewToggleType>("list");

  // Refs for filter and pagination
  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef({
    activePage: 1,
    rowsPerPage: 20,
    totalRecords: 0,
    startSlNo: 1,
    endSlNo: 20,
  });

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setLoadingTotalRecords(true);
    setData([]);
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      const items = await getData(params);
      setData(items);
      setHasMoreData(items.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      setData([]);
      setHasMoreData(false);
      paginationRef.current.totalRecords = 0;
    } finally {
      setLoading(false);
      setLoadingTotalRecords(false);
    }
  }, []);

  const handleFilterChange = useCallback(
    (filters: { formData: any }) => {
      filterRef.current = filters.formData;
      applyFilter();
    },
    [applyFilter],
  );

  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(
    async (_event?: any) => {
      if (loadingMore || !hasMoreData) {
        return;
      }
      setLoadingMore(true);
      try {
        paginationRef.current = {
          ...paginationRef.current,
          activePage: paginationRef.current.activePage + 1,
        };
        const params = prepareParams(filterRef.current, paginationRef.current);
        const items = await getData(params);
        setData((prev) => [...prev, ...items]);
        setHasMoreData(items.length >= paginationRef.current.rowsPerPage);
      } catch (error) {
        // ignore
      } finally {
        setLoadingMore(false);
      }
    },
    [loadingMore, hasMoreData],
  );

  const handleShare = () => {
    // Open the invite modal in the side menu via a global event
    try {
      MiscService.createEvent("showInviteModal", null);
    } catch (e) {
      // fallback to share/copy if event fails
      const url = window.location.href;
      if (navigator.share) {
        navigator
          .share({
            title: "Check out these amazing Coin Store Deals!",
            text: "Redeem exclusive products using KingCoins at StoreKing Coin Store!",
            url,
          })
          .catch(() => {});
      } else {
        navigator.clipboard.writeText(url).then(() => {
          alert("Link copied to clipboard!");
        });
      }
    }
  };

  return (
    <>
      <AppHeader title={t("kingCoinStore")} />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="!tw:mb-2" />
          <PageDescription description="coinStore" className="tw:mb-4" />

          <div className="tw:mb-4">
            <CoinsTab activeTab="coin-store" />
          </div>

          <CoinStoreBanner />

          <div className="tw:flex tw:justify-between tw:items-center tw:mb-4 tw:mt-4">
            <div>
              <PaginationSummary
                paginationConfig={paginationRef.current}
                loadingTotalRecords={loadingTotalRecords}
                loadedCount={data.length}
                fwSize="sm"
              />
            </div>
            <div>
              <AppButton
                onClick={handleShare}
                size="small"
                fill="outline"
                color="success"
              >
                <ImgRender
                  src="whatsapp-logo.png"
                  alt="WhatsApp"
                  className="tw:w-5 tw:h-5 tw:object-contain"
                />
                <span>Invite Customers</span>
              </AppButton>
            </div>
          </div>
          <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:gap-3">
            {loading
              ? Array.from({ length: paginationRef.current.rowsPerPage }).map(
                  (_, idx) => (
                    <div key={`skeleton-${idx}`} className="tw-p-2">
                      <Skeleton className="tw:h-36 tw:w-full tw:mb-2" />
                      <Skeleton className="tw:h-3 tw:w-3/4 tw:mb-1" />
                      <Skeleton className="tw:h-3 tw:w-1/2" />
                    </div>
                  ),
                )
              : data.map((d, idx) => <Item key={d.id || idx} item={d} />)}
          </div>
          {hasMoreData && !loading && (
            <div className="tw:flex tw:justify-center tw:my-4">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CoinStoreDealsList;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Coin Store Deals"),
    },
  ];
}
