import React, { useCallback, useEffect, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NetworkAnalyticsService from "~/services/NetworkAnalyticsService";
import DesktopView from "./DesktopView";
import { useTranslation } from "react-i18next";
import useAppNav from "~/hooks/useAppNav";
import { Star, Info } from "lucide-react";
import { useSearchParams } from "react-router";
import { endOfDay, startOfDay } from "date-fns";
import MasterEmpService from "~/services/MasterEmpService";
import StorageService from "~/services/StorageService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import useAppToast from "~/hooks/useAppToast";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import DateFormat from "~/components/core/date/DateFormat";

const TopPerformers: React.FC = () => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const appToast = useAppToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [busyLoading, setBusyLoading] = useState<{
    show: boolean;
    msg?: string;
  }>({ show: false, msg: "" });

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  useEffect(() => {
    const fetch = async (from: Date, to: Date) => {
      setLoading(true);
      setData([]);

      try {
        let params = {
          page: 1,
          limit: 10,
          filter: {
            createdAt: {
              $gte: startOfDay(from).toISOString(),
              $lte: endOfDay(to).toISOString(),
            },
          },
        };
        const res = await NetworkAnalyticsService.getSalesPerformance(params);
        const rows = Array.isArray(res?.data?.data) ? res?.data?.data : [];
        setData(rows);
      } catch (err) {
        // Error fetching top performers
      } finally {
        setLoading(false);
      }
    };

    if (dateFrom && dateTo) {
      fetch(new Date(dateFrom), new Date(dateTo));
    } else {
      setData([]);
    }
  }, [dateFrom, dateTo]);

  const handleAccessStore = useCallback(
    async (franchiseId: string) => {
      setBusyLoading({ show: true, msg: "Accessing franchise..." });
      try {
        const resp = await MasterEmpService.accessFranchise(franchiseId);

        if (resp?.statusCode === 200) {
          // server may return token in multiple shapes
          const r: any = resp.data?.data || {};
          const token = r.token || "";

          InventorySubscribeService.clearLocalCart();

          if (token) {
            StorageService.set("_f", r?.franchise?.details);
            StorageService.set("_t", token);
          }

          appNav.replace("/auth/init");
        } else {
          appToast.show({
            msg: resp?.data?.message || "Failed to access franchise",
            color: "danger",
          });
        }
      } catch (e: any) {
        appToast.show({
          msg: e?.message || "Failed to access franchise",
          color: "danger",
        });
      } finally {
        setBusyLoading({ show: false, msg: "" });
      }
    },
    [appNav, appToast],
  );

  const handleCallback = useCallback(
    (payload: { action: string; data?: any }) => {
      // if (payload.action === "viewRetailer" && payload.data) {
      //   const id =
      //     payload.data._id || payload.data.retailerId || payload.data.id;
      //   if (id) appNav.to(`/dashboard/network/retailer/${id}`);
      // }
      if (payload.action === "accessStore" && payload.data) {
        handleAccessStore(payload.data.newFranchiseId);
      }
    },
    [appNav, handleAccessStore],
  );

  return (
    <AppCard
      title="Top 10 Performers by Sales"
      icon={<Star />}
      iconClassName="tw:text-green-500"
      noContentPadding
    >
      <div className="tw:px-4 tw:py-2 tw:bg-blue-50 tw:border-l-4 tw:border-blue-400 tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-blue-600">
        <Info size={14} className="tw:shrink-0" />
        <span>
          Date range filter only. Showing data from{" "}
          <DateFormat value={dateFrom} formatStr="dd MMM yyyy" /> to{" "}
          <DateFormat value={dateTo} formatStr="dd MMM yyyy" />
        </span>
      </div>

      {loading ? (
        <div className="tw-text-center">
          <AppSpinner />
        </div>
      ) : null}

      <DesktopView loading={loading} data={data} callback={handleCallback} />
      <BusyLoader show={busyLoading.show} message={busyLoading.msg} />
    </AppCard>
  );
};

export default TopPerformers;
