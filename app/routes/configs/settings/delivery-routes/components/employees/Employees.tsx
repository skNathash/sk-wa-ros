import { produce } from "immer";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Alpha from "~/components/core/alpha/Alpha";
import { useForm, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { AppInput } from "~/components/core/form";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import useScreenView from "~/hooks/useScreenView";
import { getData, prepareParams } from "./helper";
import AppCard from "~/components/core/card/AppCard";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AssignRouteModal from "~/shared/logistics/modals/assign-route/AssignRouteModal";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import useAppToast from "~/hooks/useAppToast";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";

type FormValues = {
  search: string;
  alpha?: string;
};

const Employees = () => {
  const { isMobile } = useScreenView();
  const appToast = useAppToast();
  const { register, getValues, setValue, control } = useForm<FormValues>({
    defaultValues: {
      search: "",
      alpha: "",
    },
  });

  const alpha = useWatch({ control, name: "alpha" });

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [view, setView] = useState<ViewToggleType>("list");

  const [data, setData] = useState<any[]>([]);

  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    item: any | null;
  }>({
    show: false,
    item: null,
  });

  const [assignModal, setAssignModal] = useState<{
    show: boolean;
    item: any | null;
  }>({
    show: false,
    item: null,
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  useEffect(() => {
    setView(isMobile ? "card" : "list");
  }, [isMobile]);

  const debouncedSearch = useDebouncedCallback(
    () => {
      applyFilter();
    },
    500,
    { maxWait: 1000 },
  );

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
      const params = prepareParams(getValues(), paginationRef.current);
      const result = await getData(params);
      setData(result?.data || []);
      paginationRef.current.totalRecords = result?.count || 0;
      setHasMoreData(result?.count >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [getValues]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const onSearchChange = () => {
    if (getValues("alpha")) setValue("alpha", "");
    debouncedSearch();
  };

  const handleAlphaSelect = (val: string) => {
    setValue("alpha", val);
    if (val) setValue("search", "");
    applyFilter();
  };

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(getValues(), paginationRef.current);
      const result = await getData(params);

      if (typeof result?.count === "number") {
        paginationRef.current.totalRecords = result.count;
      }

      const mapped = result?.data || [];
      setData((prev) => [...prev, ...mapped]);

      setHasMoreData(mapped.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCallback = (a: { action: string; data?: any }) => {
    if (a.action === "remove") {
      setConfirmDialog({ show: true, item: a.data });
    } else if (a.action === "change" || a.action === "assign") {
      setAssignModal({ show: true, item: a.data });
    }
  };

  const handleConfirmUnlink = async () => {
    const item = confirmDialog.item;
    if (!item) return;

    try {
      setLoading(true);
      const payload = {
        referenceType: "Manpower",
        referenceId: item._id,
        routeId: item.routeId,
      };

      const resp: any = await DeliveryRoutesService.unlinkRoute(payload);

      if (resp && resp.statusCode === 200) {
        appToast.show({
          msg: "Route unlinked successfully",
          color: "success",
        });
        setData((prev) =>
          produce(prev, (draft) => {
            const index = draft.findIndex((d) => d._id === item._id);
            if (index !== -1) {
              draft[index].linkedRoutes = draft[index].linkedRoutes?.filter(
                (r: any) => r.routeId !== item.routeId,
              );
            }
          }),
        );
      } else {
        appToast.show({
          msg: resp?.data?.message || "Failed to unlink route",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error unlinking route:", error);
      appToast.show({
        msg: "Failed to unlink route",
        color: "danger",
      });
    } finally {
      setLoading(false);
      setConfirmDialog({ show: false, item: null });
    }
  };

  const handleCancelUnlink = () => {
    setConfirmDialog({ show: false, item: null });
  };

  const handleAssignCallback = (a: { action: string; data?: any }) => {
    if (a.action === "success") {
      applyFilter();
    }
    setAssignModal({ show: false, item: null });
  };

  return (
    <div>
      <div className="tw:mb-4">
        <Alpha selected={alpha || ""} callback={handleAlphaSelect} />
      </div>

      <div className="tw:mb-4">
        <AppInput
          name="search"
          placeholder="Search by name/mobile"
          register={register}
          onChange={onSearchChange}
          leftIcon={<Search size={16} className="tw:text-gray-400" />}
        />
      </div>

      <div className="tw:flex tw:items-center tw:justify-between tw:mb-4">
        <div className="tw:flex-1">
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>
        <ViewToggle viewType={view} callback={setView} />
      </div>

      {view === "card" ? (
        <MobileView
          loading={loading}
          data={data}
          showLoadMore={hasMoreData}
          loadingMore={loadingMore}
          loadMore={loadMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          callback={handleCallback}
        />
      ) : (
        <AppCard noPadding>
          <DesktopView
            loading={loading}
            data={data}
            showLoadMore={hasMoreData}
            loadingMore={loadingMore}
            loadMore={loadMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            callback={handleCallback}
          />
        </AppCard>
      )}

      <AppAlertDialog
        show={confirmDialog.show}
        title="Remove Route"
        description={`Are you sure you want to remove route "${confirmDialog.item?.routeName}" from ${confirmDialog.item?.name}?`}
        onConfirm={handleConfirmUnlink}
        onCancel={handleCancelUnlink}
      />

      {assignModal.show && (
        <AssignRouteModal
          show={assignModal.show}
          userId={assignModal.item?._id}
          userType="Employee"
          linkedRoutes={assignModal.item?.linkedRoutes || []}
          callback={handleAssignCallback}
        />
      )}
    </div>
  );
};

export default Employees;
