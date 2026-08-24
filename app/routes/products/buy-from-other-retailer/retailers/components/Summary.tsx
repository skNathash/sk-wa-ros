import React from "react";
import { List, Map, Plus } from "lucide-react";
import { useSearchParams } from "react-router";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import AuthService from "~/services/AuthService";

export interface SummaryData {
  youOwe: number;
  paylaterAvail: number;
  connectedCount: number;
  newThisMonthCount: number;
}

interface SummaryProps {
  /** Counts resolved by `getSummary` in the page helper. */
  data?: SummaryData;
  loading?: boolean;
  alertCount?: number;
  /** Sellers matching the current filters — drives "Sellers nearby". */
  sellerCount?: number;
  /** Distance filter in km (or "all"), used in the sub-heading. */
  distance?: string | number;
  /** Opens the B2B retailer create form (theme-2 desktop header action). */
  onCreateRetailer?: () => void;
  /** Switches the results area between the list and the map. */
  onToggleMap?: () => void;
  /** Whether the map is the active view — drives the button's label/state. */
  mapActive?: boolean;
}

const defaultData: SummaryData = {
  youOwe: 0,
  paylaterAvail: 0,
  connectedCount: 0,
  newThisMonthCount: 0,
};

const Summary: React.FC<SummaryProps> = ({
  data = defaultData,
  loading = false,
  alertCount = 1,
  sellerCount = 0,
  distance,
  onCreateRetailer,
  onToggleMap,
  mapActive = false,
}) => {
  const { youOwe, paylaterAvail, connectedCount, newThisMonthCount } = data;
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";
  const hasPaylaterActive = searchParams.get("hasPaylater") === "true";
  const connectedActive = searchParams.get("connected") === "true";

  // Toggle the `hasPaylater` query param; the page reads it as form data and
  // re-fetches with the filter applied.
  const handlePaylaterTap = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (hasPaylaterActive) {
          next.delete("hasPaylater");
        } else {
          next.set("hasPaylater", "true");
        }
        return next;
      },
      { replace: true },
    );
  };

  const handleConnectedTap = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (connectedActive) {
          next.delete("connected");
        } else {
          next.set("connected", "true");
        }
        return next;
      },
      { replace: true },
    );
  };

  const items = [
    {
      label: "YOU OWE",
      value: youOwe,
      loading,
      valueClass: "tw:text-[#075e54]",
    },
    {
      label: "PAYLATER AVAIL",
      value: paylaterAvail,
      loading,
      valueClass: "tw:text-[#075e54]",
      onClick: handlePaylaterTap,
      active: hasPaylaterActive,
    },
    {
      label: "ALERT",
      value: alertCount,
      loading: false,
      valueClass: "tw:text-amber-500",
    },
  ];

  // The four network data points shown on the theme-2 overview — shared by the
  // desktop card and the mobile strip so both read the same numbers.
  const stats = [
    {
      label: "Sellers nearby",
      value: sellerCount,
      hint:
        distance == null || distance === "all"
          ? "across your network"
          : `within ${distance} km`,
      valueClass: "tw:text-slate-900",
    },
    {
      label: "Connected",
      value: connectedCount,
      hint: "already linked to you",
      loading,
      valueClass: "tw:text-[#075e54]",
      onClick: handleConnectedTap,
      active: connectedActive,
    },
    // Placeholder data point — the sellers API doesn't expose ratings yet.
    {
      label: "Avg rating",
      value: "4.6",
      hint: "across rated sellers",
      valueClass: "tw:text-slate-900",
    },
    {
      label: "New this month",
      value: newThisMonthCount,
      hint: "just joined the network",
      loading,
      valueClass: "tw:text-amber-500",
    },
  ];

  // Desktop theme-2 gets the wide overview card: a titled header with the
  // browse actions, then a four-up stat strip.
  if (isTheme2 && !isMobile) {
    const town =
      (AuthService.getLoggedInUser() as any)?.town ||
      (AuthService.getLoggedInUser() as any)?.district ||
      "";
    const radiusLabel =
      distance == null || distance === "all"
        ? "your network"
        : `${distance} km`;

    return (
      <div className="tw:mb-4">
        <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
          <div>
            <h2 className="tw:text-base tw:font-bold tw:text-slate-900">
              Sellers near you
            </h2>
            <p className="tw:mt-0.5 tw:text-[11px] tw:text-slate-500">
              {sellerCount} network sellers within {radiusLabel}
              {town ? ` of ${town}` : ""}
            </p>
          </div>

          {/* Browse actions — Map view swaps the results area for the map. */}
          <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
            <button
              type="button"
              onClick={onToggleMap}
              aria-pressed={mapActive}
              className={`tw:flex tw:h-8 tw:items-center tw:gap-1 tw:rounded-lg tw:border tw:px-2.5 tw:text-xs tw:font-semibold tw:cursor-pointer tw:transition-colors ${
                mapActive
                  ? "tw:border-primary tw:bg-primary/10 tw:text-primary"
                  : "tw:border-slate-200 tw:bg-white tw:text-slate-700 tw:hover:bg-slate-50"
              }`}
            >
              {mapActive ? <List size={13} /> : <Map size={13} />}
              {mapActive ? "List view" : "Map view"}
            </button>
            <button
              type="button"
              onClick={onCreateRetailer}
              className="tw:flex tw:h-8 tw:items-center tw:gap-1 tw:rounded-lg tw:bg-primary tw:px-2.5 tw:text-xs tw:font-semibold tw:text-primary-foreground tw:cursor-pointer tw:transition-opacity tw:hover:opacity-90"
            >
              <Plus size={13} />
              Create B2B retailer
            </button>
          </div>
        </div>

        <div className="tw:mt-3 tw:grid tw:grid-cols-2 tw:xl:grid-cols-4 tw:gap-3">
          {stats.map((stat: any) => (
            <div
              key={stat.label}
              onClick={stat.onClick}
              className={`tw:rounded-xl tw:bg-white tw:p-3 tw:ring-1 tw:ring-slate-200/70 ${
                stat.onClick ? "tw:cursor-pointer" : ""
              } ${stat.active ? "tw:ring-primary/40 tw:bg-slate-50" : ""}`}
            >
              <div className="app-label tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-widest tw:text-slate-400">
                {stat.label}
              </div>
              <div className="tw:mt-1.5 tw:text-2xl tw:font-extrabold tw:leading-none">
                {stat.loading ? (
                  <AppSpinner className="tw:w-6 tw:h-6" />
                ) : (
                  <span className={stat.valueClass}>{stat.value}</span>
                )}
              </div>
              <div className="tw:mt-1.5 tw:text-[11px] tw:text-slate-500">
                {stat.hint}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Mobile theme-2 keeps this strip UI but carries the same network data points
  // as the desktop overview card.
  const stripItems: any[] = isTheme2 ? stats : items;

  return (
    /* Bleeds out of the page's p-4 on mobile — sideways and upward — so the
       strip sits flush under the app header with no cream gap between them. */
    <div className="tw:bg-white tw:overflow-hidden tw:shadow-sm tw:ring-1 tw:ring-slate-200/70 tw:mb-4 tw:-mx-4 tw:-mt-4 tw:sm:mx-0 tw:sm:mt-0 tw:border-t tw:border-slate-200">
      <div
        className={`tw:grid tw:divide-x tw:divide-slate-100 ${
          isTheme2 ? "tw:grid-cols-4" : "tw:grid-cols-3"
        }`}
      >
        {stripItems.map((item: any) => (
          <div
            key={item.label}
            onClick={item.onClick}
            className={`tw:px-2 tw:py-3 tw:text-center ${
              item.onClick ? "tw:cursor-pointer" : ""
            } ${item.active ? "tw:bg-slate-100" : ""}`}
          >
            <div className="tw:text-2xl tw:font-extrabold tw:leading-none">
              {item.loading ? (
                <div className="tw:flex tw:justify-center">
                  <AppSpinner className="tw:w-6 tw:h-6" />
                </div>
              ) : (
                <span className={item.valueClass}>{item.value}</span>
              )}
            </div>
            {/* Longer theme-2 labels ride tighter tracking so four fit a row. */}
            <div
              className={`tw:mt-1 tw:text-[10px] tw:font-bold tw:uppercase tw:text-slate-500 ${
                isTheme2 ? "tw:tracking-wide" : "tw:tracking-widest"
              }`}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Summary;
