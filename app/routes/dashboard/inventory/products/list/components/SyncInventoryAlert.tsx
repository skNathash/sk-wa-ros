import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import SellerCatalogService from "~/services/SellerCatalogService";

const SyncInventoryAlert = () => {
  const appToast = useAppToast();
  const [outOfSyncCount, setOutOfSyncCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await SellerCatalogService.getBulkStockSyncSummary();
      setOutOfSyncCount(res?.data?.data?.outOfSyncDeals || 0);
    } catch (error) {
      console.error("Error fetching stock sync summary:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading || outOfSyncCount === 0) return null;

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await SellerCatalogService.runBulkStockSync();
      if (res.statusCode === 200) {
        appToast.show({
          msg: "Inventory sync completed",
          color: "success",
        });
        await fetchSummary();
      } else {
        appToast.show({
          msg: res?.data?.message || "Failed to sync inventory",
          color: "danger",
        });
      }
    } catch (error) {
      appToast.show({ msg: "Failed to sync inventory", color: "danger" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="tw:relative tw:overflow-hidden tw:bg-red-50 tw:border tw:border-red-100 tw:rounded-2xl tw:p-4 tw:mb-4 tw:flex tw:flex-col tw:md:flex-row tw:items-start tw:md:items-center tw:justify-between tw:gap-4">
      <div className="tw:flex tw:items-start tw:md:items-center tw:gap-4">
        <div className="tw:shrink-0 tw:bg-red-500 tw:p-2.5 tw:rounded-xl tw:shadow-lg tw:shadow-red-200">
          <RefreshCw className="tw:text-white" size={20} />
        </div>
        <div className="tw:space-y-1">
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <h3 className="tw:text-slate-900 tw:font-bold tw:text-base tw:tracking-tight">
              {outOfSyncCount} {outOfSyncCount === 1 ? "item" : "items"} out of
              sync
            </h3>
            <span className="tw:bg-red-200 tw:text-red-700 tw:text-[9px] tw:font-black tw:uppercase tw:px-1.5 tw:py-0.5 tw:rounded-md">
              Action Required
            </span>
          </div>
          <p className="tw:text-slate-600 tw:text-sm tw:font-medium tw:leading-tight">
            Inventory stock is out of sync. Sync now to fix stock mismatches.
          </p>
        </div>
      </div>

      <div className="tw:flex tw:items-center tw:gap-3 tw:w-full tw:md:w-auto tw:justify-end">
        <AppButton
          size="small"
          color="danger"
          className="tw:flex-1 tw:md:flex-none tw:min-w-[110px] tw:rounded-xl tw:font-bold tw:py-2"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw
            size={16}
            className={syncing ? "tw:mr-1 tw:animate-spin" : "tw:mr-1"}
          />
          <span>{syncing ? "Syncing..." : "Sync Inventory"}</span>
        </AppButton>
      </div>
    </div>
  );
};

export default SyncInventoryAlert;
