import { useCallback, useEffect, useRef, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import ManageCourierModal from "~/modals/feature/delivery/manage-courier/ManageCourierModal";
import type { PaginationState } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";

const Agencies = () => {
  const { isMobile } = useScreenView();
  const { show: showToast } = useAppToast();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Modal state
  const [modalState, setModalState] = useState<{ show: boolean; data?: any }>({
    show: false,
    data: undefined,
  });

  // Handle actions from child components
  const handleAction = useCallback(
    (payload: { action: string; data: any }) => {
      if (payload.action === "view") {
        showToast({ msg: `Viewing ${payload.data.name}`, color: "info" });
      } else if (payload.action === "manage") {
        showToast({ msg: `Managing ${payload.data.name}`, color: "info" });
        // Open modal for editing
        setModalState({ show: true, data: payload.data });
      }
    },
    [showToast]
  );

  // Open modal for adding new personnel
  const handleAddPersonnel = useCallback(() => {
    setModalState({ show: true, data: undefined });
  }, []);

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
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

  // Handle modal actions
  const handleModalAction = useCallback(
    (payload: { action: string; data?: any }) => {
      if (payload.action === "close") {
        setModalState({ show: false, data: undefined });
      } else if (payload.action === "submit") {
        showToast({
          msg: payload.data?.id
            ? "Courier updated successfully"
            : "Courier added successfully",
          color: "success",
        });
        setModalState({ show: false, data: undefined });
        // Refresh the data
        applyFilter();
      }
    },
    [showToast, applyFilter]
  );

  return (
    <AppCard
      title={
        <div className="tw:flex tw:justify-between tw:items-center tw:flex-1">
          <span>{`Delivery Agencies (${data.length})`}</span>
          <AppButton
            color="primary"
            onClick={handleAddPersonnel}
            className="tw:ml-4"
            size="small"
          >
            Add Agency
          </AppButton>
        </div>
      }
      className="tw:mb-4"
    >
      <div className="tw:mb-4">
        <Filter callback={onFilterChange} />
      </div>
      {isMobile ? (
        <MobileView data={data} loading={loading} callback={handleAction} />
      ) : (
        <DesktopView data={data} loading={loading} callback={handleAction} />
      )}
      {hasMoreData && !loading && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      <ManageCourierModal
        show={modalState.show}
        callback={handleModalAction}
        courier={modalState.data}
      />
    </AppCard>
  );
};

export default Agencies;
