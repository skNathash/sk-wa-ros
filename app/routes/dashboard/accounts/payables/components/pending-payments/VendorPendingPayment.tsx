import AppCard from "~/components/core/card/AppCard";
import Summary from "./Summary";
import DesktopView from "./DesktopView";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PaginationState } from "~/types/CommonTypes";
import { prepareParams, getData, getCount } from "./helper";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppButton from "~/components/core/button/AppButton";
import MobileView from "./MobileView";
import useScreenView from "~/hooks/useScreenView";
import NoData from "~/components/core/no-data/NoData";
import PayablesReceiveableSummary from "~/shared/accounts/components/payables-receiveables-summary/PayablesReceiveableSummary";
import AuthService from "~/services/AuthService";

const VendorPendingPayment = () => {
  const { isMobile } = useScreenView();
  const { t } = useTranslation(["common"]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 50,
    startSlNo: 1,
    endSlNo: 50,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({});

  // Apply filter (initial load or filter change)
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
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "date",
        value: "desc",
      });
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "date",
        value: "desc",
      });
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  // Initial load
  useEffect(() => {
    applyFilter();
  }, []);

  return (
    <AppCard
      title={t("pendingPayment")}
      icon="circle-alert"
      iconClassName="tw:text-red-500"
    >
      {/* <Summary /> */}
      <PayablesReceiveableSummary entityId={AuthService.getLoggedInUserId()} />
      <AppScrollArea className="tw:h-[calc(100vh-200px)]">
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:py-12">
            <div className="tw:animate-spin tw:rounded-full tw:h-8 tw:w-8 tw:border-b-2 tw:border-gray-900"></div>
          </div>
        ) : data.length === 0 ? (
          <NoData />
        ) : (
          <>
            {isMobile ? (
              <MobileView loading={loading} data={data} />
            ) : (
              <DesktopView loading={loading} data={data} />
            )}

            {hasMoreData && !loading && (
              <div className="tw:text-center tw:mt-4">
                <AppButton
                  onClick={loadMore}
                  disabled={loadingMore}
                  size="small"
                  color="light"
                  fill="outline"
                >
                  {loadingMore ? t("loading") : t("loadMore")}
                </AppButton>
              </div>
            )}
          </>
        )}
      </AppScrollArea>
    </AppCard>
  );
};

export default VendorPendingPayment;
