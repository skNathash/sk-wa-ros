import React, { useCallback, useEffect, useRef, useState } from "react";
// removed form provider (filter UI removed)
import clsx from "clsx";
import { ArrowDownCircle, ArrowUpCircle, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";
import AppLink from "~/components/core/link/AppLink";
import AccountService from "~/services/AccountService";
import RecordPaymentViewModal from "~/shared/accounts/modals/record-payment/view/RecordPaymentViewModal";

const defaultSort: SortProps = {
  key: "transactionDate",
  value: "desc",
};

type Props = {
  activeTab?: string;
  refreshSignal?: number;
};

const RecentTransactions: React.FC<Props> = ({ activeTab, refreshSignal }) => {
  const { isMobile } = useScreenView();
  // translations not required for now
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [paymentViewModal, setPaymentViewModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: null });

  // view toggle removed

  // Refs
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
      // include activeTab in filters to let helper prepare paymentType filtering
      const filters = { ...(filterRef.current || {}), activeTab };
      const params = prepareParams(filters, paginationRef.current, defaultSort);
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
  }, [activeTab]);

  // Handle filter changes
  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        { ...filterRef.current, activeTab },
        paginationRef.current,
        defaultSort
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(result?.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, activeTab]);

  // Run applyFilter on mount and whenever activeTab or refreshSignal changes
  useEffect(() => {
    applyFilter();
  }, [activeTab, refreshSignal]);

  // Prepare title/subtitle based on activeTab
  let cardTitle = "Recent Transactions";
  let cardSubtitle = "";
  if (activeTab === "receivePayment") {
    cardTitle = "Received Transactions";
    cardSubtitle = "Recently received payments";
  } else if (activeTab === "makePayout") {
    cardTitle = "Payout Transactions";
    cardSubtitle = "Recently made payouts";
  }

  const handlePaymentViewModalCallback = (data: {
    action: string;
    data: any;
  }) => {
    setPaymentViewModal({ show: false, data: null });
  };

  const viewPayment = (data: any) => {
    setPaymentViewModal({ show: true, data });
  };

  return (
    <>
      <AppCard title={cardTitle} subtitle={cardSubtitle} icon="clock">
        {/* Render mobile-style cards (inlined from transactions MobileView) */}
        <AppScrollArea className="tw:md:h-[calc(100vh-300px)]">
          <div className="tw:grid tw:grid-cols-1 tw:gap-4">
            {loading ? (
              <div className="tw:col-span-1">
                <div className="tw:space-y-4">
                  {[...Array(5)].map((_, idx) => (
                    <div key={idx} className="tw:animate-pulse">
                      <div className="tw:bg-gray-200 tw:h-20 tw:rounded-lg"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !data || data.length === 0 ? (
              <div className="tw:col-span-1 tw:text-center tw:py-8 tw:text-gray-500">
                No data found
              </div>
            ) : (
              data.map((row, idx) => {
                // Prepare IN/OUT text
                return (
                  <div
                    key={row._id || idx}
                    className="tw:p-3 tw:border tw:border-gray-200 tw:rounded-lg tw:cursor-pointer"
                    onClick={() => viewPayment(row)}
                  >
                    <div className="tw:flex tw:items-center tw:gap-3">
                      {/* Middle: title/description */}
                      <div className="tw:flex-1">
                        <div className="tw:flex tw:items-start tw:justify-between">
                          <div>
                            <div className="tw:font-medium tw:text-gray-800">
                              {row?.counterPartyPageLink ? (
                                <AppLink
                                  asLink
                                  href={row?.counterPartyPageLink}
                                  className="tw:text-gray-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {row?.counterPartyName || "-"} (
                                  <span className="tw:uppercase tw:text-xs">
                                    {row?.counterPartyType}
                                  </span>
                                  )
                                </AppLink>
                              ) : (
                                <span>
                                  {row?.counterPartyName || "-"} (
                                  <span className="tw:uppercase tw:text-xs">
                                    {row?.counterPartyType}
                                  </span>
                                  )
                                </span>
                              )}
                            </div>
                            {/* Date below entity name */}
                            <div className="tw:text-xs tw:text-slate-500 tw:mt-1 tw:flex tw:items-center tw:gap-1">
                              <Calendar size={12} />
                              <DateFormat value={row.dateTime} />
                            </div>
                            {/* Subtitle below date */}
                            <div className="tw:md:text-xs tw:text-sm tw:text-gray-500 tw:mt-1">
                              {row.description || "-"}
                            </div>
                          </div>
                          {/* Right: Amount and IN/OUT stacked */}
                          <div className="tw:text-right tw:ml-4 tw:flex tw:flex-col tw:items-end">
                            <div
                              className={clsx("tw:text-lg tw:font-semibold", {
                                "tw:text-green-600":
                                  row?.paymentType === "credit",
                                "tw:text-red-600":
                                  row?.paymentType !== "credit",
                                "tw:text-gray-700": !(row.amount || 0),
                              })}
                            >
                              <Amount value={row.amount} decimalPlaces={2} />
                            </div>
                            {/* IN/OUT below amount */}
                            <div
                              className={clsx(
                                "tw:text-xs tw:mt-1 tw:inline-block tw:px-2 tw:py-0.5 tw:rounded tw:border tw:font-medium",
                                {
                                  "tw:text-green-600 tw:border-green-200 bg-green-50":
                                    row?.paymentType === "credit",
                                  "tw:text-red-600 tw:border-red-200 bg-red-50":
                                    row?.paymentType !== "credit",
                                }
                              )}
                            >
                              {row?.paymentType === "credit"
                                ? "Received"
                                : "Paid Out"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </AppScrollArea>

        {hasMoreData && !loading && data.length > 0 && (
          <div className="tw:text-center tw:mt-4">
            <LoadMoreButton
              loadMore={loadMore}
              loading={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={data.length}
            />
          </div>
        )}
      </AppCard>
      <RecordPaymentViewModal
        show={paymentViewModal.show}
        callback={handlePaymentViewModalCallback}
        transactionId={paymentViewModal.data?.transactionId}
      />
    </>
  );
};

export default RecentTransactions;
