import { produce } from "immer";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import PaylaterService from "~/services/PaylaterService";
import PaylaterManageWalletModal from "~/shared/accounts/modals/paylater/manage-wallet/PaylaterManageWalletModal";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import { getCount, getData, prepareParams } from "./helper";
import MobileView from "~/shared/accounts/paylater/network-statement/components/MobileView";

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const Statements = () => {
  const { isMobile } = useScreenView();

  const methods = useForm({
    defaultValues: {
      search: "",
      type: "all",
      dateRange: [],
    },
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [viewType, setViewType] = useState<ViewToggleType>("list");

  const [manageModal, setManageModal] = useState<{
    show: boolean;
    data: any | null;
  }>({ show: false, data: null });

  const handleAction = useCallback((payload: { action: string; data: any }) => {
    if (payload.action === "manage") {
      setManageModal({ show: true, data: payload.data });
    }
  }, []);

  // Refs
  const paginationRef = useRef<PaginationState>({
    ...defaultPagination,
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
        key: "",
        value: "asc",
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
        key: "",
        value: "asc",
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
  }, [applyFilter]);

  // (Removed behavior that relied on a `type` route param)

  // Filter change handler
  const onFilterChange = useCallback(
    (data: any) => {
      filterRef.current = {
        ...filterRef.current,
        ...data.formData,
      };
      applyFilter();
    },
    [applyFilter]
  );

  // Determine title based on type
  const getTitle = () => {
    return `Statements (${data.length})`;
  };

  const handleModalCallback = (data: { action: string; data?: any }) => {
    setManageModal({ show: false, data: null });

    setData(
      produce((draft) => {
        const index = draft.findIndex((item) => item._id === data.data._id);
        if (index !== -1) {
          draft[index] = {
            ...draft[index],
            status: data.data.status,
            statusColor: PaylaterService.getWalletStatusColor(data.data.status),
            creditLimit: data.data.creditLimit,
            validityPeriod: data.data.validityPeriod,
          };
        }
      })
    );
  };

  return (
    <>
      <FormProvider {...methods}>
        <Filter callback={onFilterChange} />
      </FormProvider>

      <div className="tw:flex tw:justify-between tw:items-center tw:mb-4">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>
        <ViewToggle viewType={viewType} callback={setViewType} />
      </div>

      {isMobile || viewType === "card" ? (
        <MobileView
          data={data}
          loading={loading}
          callback={handleAction}
          loadMore={loadMore}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          hasMoreData={hasMoreData}
        />
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            callback={handleAction}
            loadMore={loadMore}
            loadingMore={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            hasMoreData={hasMoreData}
          />
        </AppCard>
      )}

      <PaylaterManageWalletModal
        show={manageModal.show}
        callback={handleModalCallback}
        userId={manageModal.data?.userInfo?.id}
      />
    </>
  );
};

export default Statements;
