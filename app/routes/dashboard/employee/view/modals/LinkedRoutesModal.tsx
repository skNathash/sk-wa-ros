import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Truck, Search, MapPinned } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import { useTranslation } from "react-i18next";

interface LinkedRoute {
  routeId: string;
  routeCode: string;
  description: string;
}

interface LinkedRoutesModalProps {
  show: boolean;
  data: LinkedRoute[];
  callback: (a: { action: string; data?: LinkedRoute[] }) => void;
}

const LinkedRoutesModal: React.FC<LinkedRoutesModalProps> = ({
  show,
  data,
  callback,
}) => {
  const { t } = useTranslation(["common"]);
  const [selectedRoutes, setSelectedRoutes] = useState<LinkedRoute[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (show) {
      setSelectedRoutes([...data]);
      setQuery("");
    }
  }, [show, data]);

  useEffect(() => {
    if (!show) return;
    const fetchRoutes = async () => {
      setLoading(true);
      try {
        const resp = await DeliveryRoutesService.getRoutesList({
          page: 1,
          limit: 100,
          filter: { isActive: true },
        });
        setRoutes(resp?.data?.data || []);
      } catch {
        setRoutes([]);
      }
      setLoading(false);
    };
    fetchRoutes();
  }, [show]);

  const handleClose = () => callback({ action: "close" });

  const handleToggle = useCallback((route: any, checked: boolean) => {
    if (checked) {
      setSelectedRoutes((prev) => [
        ...prev,
        {
          routeId: route._id,
          routeCode: route.routeCode || route.routeName,
          description: route.description || "",
        },
      ]);
    } else {
      setSelectedRoutes((prev) =>
        prev.filter((r) => r.routeId !== route._id)
      );
    }
  }, []);

  const handleSelectAll = () => {
    const all = filteredRoutes.map((r: any) => ({
      routeId: r._id,
      routeCode: r.routeCode || r.routeName,
      description: r.description || "",
    }));
    setSelectedRoutes((prev) => {
      const existing = new Set(prev.map((p) => p.routeId));
      return [...prev, ...all.filter((r) => !existing.has(r.routeId))];
    });
  };

  const handleClearAll = () => setSelectedRoutes([]);

  const handleSubmit = () => {
    const cleaned = selectedRoutes.map(
      ({ routeId, routeCode, description }) => ({
        routeId,
        routeCode,
        description,
      })
    );
    callback({ action: "submit", data: cleaned });
  };

  const filteredRoutes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter((r) => {
      const code = (r.routeCode || r.routeName || "").toLowerCase();
      const desc = (r.description || "").toLowerCase();
      return code.includes(q) || desc.includes(q);
    });
  }, [routes, query]);

  return (
    <AppModal show={show} callback={handleClose} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold">{t("linkedRoutes")}</div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-[90vh]" noPadding>
        <div className="tw:flex tw:items-start tw:gap-3 tw:p-4 tw:border-b tw:bg-linear-to-r tw:from-emerald-50 tw:to-white">
          <div className="tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-lg tw:bg-emerald-100 tw:text-emerald-700 tw:shrink-0">
            <Truck size={18} />
          </div>
          <div className="tw:flex-1">
            <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
              Routes this employee covers
            </div>
            <p className="tw:text-xs tw:text-gray-600 tw:mt-0.5">
              Tick the delivery routes this employee will handle. Stops on
              unticked routes won't appear on their run-sheet.
            </p>
          </div>
          <span className="tw:inline-flex tw:items-center tw:justify-center tw:min-w-7 tw:h-6 tw:px-2 tw:rounded-full tw:text-xs tw:font-semibold tw:bg-emerald-600 tw:text-white">
            {selectedRoutes.length}
          </span>
        </div>

        <div className="tw:p-4 tw:border-b">
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
            <Search size={14} className="tw:text-gray-500" />
            <span className="tw:text-xs tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-500">
              Filter routes
            </span>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code or description"
            className="tw:w-full tw:px-3 tw:py-2 tw:text-sm tw:border tw:rounded-md tw:focus:outline-hidden tw:focus:ring-2 tw:focus:ring-emerald-300"
          />
        </div>

        <div className="tw:flex tw:items-center tw:justify-between tw:px-4 tw:pt-3 tw:pb-2">
          <span className="tw:text-xs tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-500">
            {filteredRoutes.length} available • {selectedRoutes.length} selected
          </span>
          <div className="tw:flex tw:gap-3 tw:text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={filteredRoutes.length === 0}
              className="tw:text-emerald-700 tw:hover:underline tw:disabled:opacity-50 tw:disabled:no-underline"
            >
              Select all
            </button>
            {selectedRoutes.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="tw:text-red-600 tw:hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="tw:px-4 tw:pb-4">
          {loading ? (
            <div className="tw:flex tw:justify-center tw:py-10">
              <AppSpinner />
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:py-10 tw:px-4 tw:border tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:text-center">
              <MapPinned size={28} className="tw:text-gray-400" />
              <div className="tw:text-sm tw:font-medium tw:text-gray-700">
                {query ? "No matching routes" : t("noRoutesFound")}
              </div>
              <div className="tw:text-xs tw:text-gray-500 tw:max-w-xs">
                {query
                  ? "Try a different search term."
                  : "Create routes from Settings to assign them here."}
              </div>
            </div>
          ) : (
            <div className="tw:flex tw:flex-col tw:gap-2">
              {filteredRoutes.map((route) => {
                const isSelected = selectedRoutes.some(
                  (r) => r.routeId === route._id
                );
                return (
                  <label
                    key={route._id}
                    className={`tw:flex tw:items-center tw:gap-3 tw:p-2.5 tw:border tw:rounded-lg tw:cursor-pointer tw:transition-colors ${
                      isSelected
                        ? "tw:border-emerald-400 tw:bg-emerald-50/40"
                        : "tw:border-gray-200 tw:bg-white tw:hover:border-emerald-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleToggle(route, e.target.checked)}
                      className="tw:w-4 tw:h-4 tw:accent-emerald-600 tw:cursor-pointer"
                    />
                    <div className="tw:flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-md tw:bg-emerald-50 tw:text-emerald-700 tw:shrink-0">
                      <Truck size={14} />
                    </div>
                    <div className="tw:flex-1 tw:min-w-0">
                      <div className="tw:font-medium tw:text-sm tw:truncate">
                        {route.routeCode || route.routeName}
                      </div>
                      {route.description && (
                        <div className="tw:text-xs tw:text-gray-500 tw:truncate">
                          {route.description}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:items-center tw:justify-between tw:w-full tw:gap-2">
          <span className="tw:text-xs tw:text-gray-500">
            {selectedRoutes.length} route
            {selectedRoutes.length === 1 ? "" : "s"} will be linked
          </span>
          <div className="tw:flex tw:gap-2">
            <AppButton fill="outline" onClick={handleClose}>
              {t("cancel")}
            </AppButton>
            <AppButton onClick={handleSubmit}>{t("save")}</AppButton>
          </div>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default LinkedRoutesModal;
