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
import { getCount, getData, prepareParams } from "./helper";
import AppCard from "~/components/core/card/AppCard";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AssignRouteModal from "~/shared/logistics/modals/assign-route/AssignRouteModal";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import useAppToast from "~/hooks/useAppToast";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";

type ActiveTab = "b2b" | "b2c";

type FormValues = {
  search: string;
  activeTab: ActiveTab;
  alpha?: string;
};

const Customers = () => {
  const { isMobile } = useScreenView();
  const appToast = useAppToast();
  const { register, getValues, reset, setValue, control } = useForm<FormValues>(
    {
      defaultValues: {
        search: "",
        activeTab: "b2b",
        alpha: "",
      },
    },
  );

  const [activeTab, alpha] = useWatch({
    control,
    name: ["activeTab", "alpha"],
  });

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
    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    try {
      const params = prepareParams(getValues(), paginationRef.current);
      const result = await getData(getValues("activeTab") as ActiveTab, params);
      setData(result);
      const totalRecords = await getCount(
        getValues("activeTab") as ActiveTab,
        params,
      );
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [getValues]);

  useEffect(() => {
    applyFilter();
  }, [activeTab, applyFilter]);

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
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(getValues(), paginationRef.current);
      const result = await getData(activeTab as ActiveTab, params);
      setData(
        produce(data, (draft) => {
          draft.push(...result);
        }),
      );
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      console.error(e);
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
        referenceType: activeTab === "b2b" ? "Franchise" : "Customer",
        referenceId: item._id,
        routeId: item.routeId,
      };

      const resp: any = await DeliveryRoutesService.unlinkRoute(payload);

      if (resp && resp.statusCode === 200) {
        appToast.show({
          msg: "Route unlinked successfully",
          color: "success",
        });
        // Update local state
        setData((prev) =>
          produce(prev, (draft) => {
            const index = draft.findIndex((d) => d._id === item._id);
            if (index !== -1) {
              draft.splice(index, 1);
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
      // Refresh the specific item or re-fetch data
      // For now, let's just refresh the whole list or manually update local state if we had enough info
      // Actually AssignRouteModal returns the payload {referenceId, routeId, referenceType}
      // But we don't have routeName here. Easier to just refresh the list.
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
        description={`Are you sure you want to remove the route from ${confirmDialog.item?.name}?`}
        onConfirm={handleConfirmUnlink}
        onCancel={handleCancelUnlink}
      />

      {assignModal.show && (
        <AssignRouteModal
          show={assignModal.show}
          userId={assignModal.item?._id}
          userType={activeTab === "b2b" ? "B2B" : "B2C"}
          currentRouteId={assignModal.item?.routeId || null}
          callback={handleAssignCallback}
        />
      )}
    </div>
  );
};

export default Customers;
