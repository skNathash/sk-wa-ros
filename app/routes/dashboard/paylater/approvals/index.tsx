import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import type {
  PaginationState,
  SortProps,
  SortValue,
  ViewToggleType,
} from "~/types/CommonTypes";
import ApproveModal from "../view/modals/ApproveModal";
import RejectModal from "../view/modals/RejectModal";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import {
  defaultFilter,
  getCount,
  getData,
  prepareParams,
  type ApprovalFilterFormData,
} from "./helper";

type DecisionModal = { show: boolean; data: any | null };

const CLOSED_MODAL: DecisionModal = { show: false, data: null };

/**
 * PayLater requests waiting on a decision. Same list mechanics as the wallet
 * pages, but pinned to `status: Pending` and carrying the approve/reject
 * modals from the request view so the queue can be cleared in place.
 */
const Approvals = () => {
  const { isMobile } = useScreenView();

  const methods = useForm<ApprovalFilterFormData>({
    defaultValues: { ...defaultFilter },
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [view, setView] = useState<ViewToggleType>("list");

  const [approveModal, setApproveModal] = useState<DecisionModal>(CLOSED_MODAL);
  const [rejectModal, setRejectModal] = useState<DecisionModal>(CLOSED_MODAL);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<ApprovalFilterFormData>({ ...defaultFilter });

  // Oldest request first — a queue is worked from the front.
  const sortRef = useRef<SortProps>({ key: "createdAt", value: "asc" });

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
        sortRef.current,
      );
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      setData([]);
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
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      setHasMoreData(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const onFilterChange = useCallback(
    (payload: { formData: ApprovalFilterFormData }) => {
      filterRef.current = { ...filterRef.current, ...payload.formData };
      applyFilter();
    },
    [applyFilter],
  );

  const onSort = useCallback(
    (payload: { key: string; value: SortValue }) => {
      sortRef.current = { key: payload.key, value: payload.value };
      applyFilter();
    },
    [applyFilter],
  );

  const handleAction = useCallback(
    (payload: { action: string; data: any }) => {
      if (payload.action === "approve") {
        setApproveModal({ show: true, data: payload.data });
      } else if (payload.action === "reject") {
        setRejectModal({ show: true, data: payload.data });
      }
    },
    [],
  );

  // A decided request leaves the queue, and the totals move with it — the
  // cheapest correct answer is to re-read the first page.
  const handleDecision = useCallback(
    (close: () => void) =>
      (payload: { action: string }) => {
        close();
        if (payload.action === "submit") {
          applyFilter();
        }
      },
    [applyFilter],
  );

  return (
    <>
      <FormProvider {...methods}>
        <Filter callback={onFilterChange} />
      </FormProvider>

      <div className="tw:mb-2 tw:flex tw:justify-between tw:items-center">
        <PaginationSummary
          paginationConfig={paginationRef.current}
          loadingTotalRecords={loading}
          loadedCount={data.length}
          fwSize="sm"
        />

        <ViewToggle viewType={view} callback={setView} />
      </div>

      {isMobile || view === "card" ? (
        <MobileView
          data={data}
          loading={loading}
          showLoadMore={hasMoreData && !loading}
          loadingMore={loadingMore}
          loadMore={loadMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          callback={handleAction}
        />
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            sortKey={sortRef.current.key}
            sortValue={sortRef.current.value}
            onSort={onSort}
            showLoadMore={hasMoreData && !loading}
            loadingMore={loadingMore}
            loadMore={loadMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            callback={handleAction}
          />
        </AppCard>
      )}

      {approveModal.show && (
        <ApproveModal
          show={approveModal.show}
          requestId={approveModal.data?._id}
          userName={approveModal.data?.userInfo?.name}
          callback={handleDecision(() => setApproveModal(CLOSED_MODAL))}
        />
      )}

      {rejectModal.show && (
        <RejectModal
          show={rejectModal.show}
          requestId={rejectModal.data?._id}
          userName={rejectModal.data?.userInfo?.name}
          callback={handleDecision(() => setRejectModal(CLOSED_MODAL))}
        />
      )}
    </>
  );
};

export default Approvals;
