import { Check, Info, Store, Tag, Trash2, MapPin } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppCheckbox } from "~/components/core/form";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import FranchiseSearchInput from "~/routes/dashboard/employee/components/FranchiseSearchInput";
import { useTranslation } from "react-i18next";

interface LinkedFranchise {
  franchiseId: string;
  name: string;
  refId: string;
  mobile: string;
  email: string;
}

interface LinkedRoute {
  routeId: string;
  routeCode: string;
  description: string;
}

interface LinkedBrand {
  id: string;
  brandId: string;
  brandName: string;
}

interface LinkInfoProps {
  linkedFranchises: LinkedFranchise[];
  linkedRoutes: LinkedRoute[];
  linkedBrands: LinkedBrand[];
  onFranchisesChange: (franchises: LinkedFranchise[]) => void;
  onRoutesChange: (routes: LinkedRoute[]) => void;
  onBrandsChange: (brands: LinkedBrand[]) => void;
}

const CountBadge = ({ count }: { count: number }) => (
  <span
    className={`tw:ml-2 tw:inline-flex tw:items-center tw:justify-center tw:min-w-6 tw:h-5 tw:px-2 tw:rounded-full tw:text-xs tw:font-semibold ${
      count > 0
        ? "tw:bg-blue-100 tw:text-blue-700"
        : "tw:bg-gray-100 tw:text-gray-500"
    }`}
  >
    {count}
  </span>
);

const EmptyHint = ({ text }: { text: string }) => (
  <div className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:py-6 tw:px-4 tw:rounded-md tw:border tw:border-dashed tw:border-gray-300 tw:bg-gray-50 tw:text-gray-500 tw:text-sm">
    <Info size={14} />
    <span>{text}</span>
  </div>
);

const LinkInfo = ({
  linkedFranchises,
  linkedRoutes,
  linkedBrands,
  onFranchisesChange,
  onRoutesChange,
  onBrandsChange,
}: LinkInfoProps) => {
  const { t } = useTranslation(["common"]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [routeSearch, setRouteSearch] = useState("");

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoadingRoutes(true);
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
      setLoadingRoutes(false);
    };
    fetchRoutes();
  }, []);

  const handleAddFranchise = useCallback(
    (item: any) => {
      if (!item?.value) return;
      const val = item.value;
      const exists = linkedFranchises.some(
        (f) => f.franchiseId === val.franchiseId
      );
      if (exists) return;
      onFranchisesChange([
        ...linkedFranchises,
        {
          franchiseId: val.franchiseId,
          name: val.name,
          refId: val.refId,
          mobile: val.mobile,
          email: val.email,
        },
      ]);
    },
    [linkedFranchises, onFranchisesChange]
  );

  const handleRemoveFranchise = useCallback(
    (franchiseId: string) => {
      onFranchisesChange(
        linkedFranchises.filter((f) => f.franchiseId !== franchiseId)
      );
    },
    [linkedFranchises, onFranchisesChange]
  );

  const handleRouteToggle = useCallback(
    (route: any, checked: boolean) => {
      if (checked) {
        onRoutesChange([
          ...linkedRoutes,
          {
            routeId: route._id,
            routeCode: route.routeCode || route.routeName,
            description: route.description || "",
          },
        ]);
      } else {
        onRoutesChange(linkedRoutes.filter((r) => r.routeId !== route._id));
      }
    },
    [linkedRoutes, onRoutesChange]
  );

  const filteredRoutes = useMemo(() => {
    const q = routeSearch.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter((r) => {
      const code = (r.routeCode || r.routeName || "").toLowerCase();
      const desc = (r.description || "").toLowerCase();
      return code.includes(q) || desc.includes(q);
    });
  }, [routes, routeSearch]);

  const allVisibleSelected =
    filteredRoutes.length > 0 &&
    filteredRoutes.every((r) =>
      linkedRoutes.some((lr) => lr.routeId === r._id)
    );

  const toggleSelectAllRoutes = () => {
    if (allVisibleSelected) {
      const ids = new Set(filteredRoutes.map((r) => r._id));
      onRoutesChange(linkedRoutes.filter((r) => !ids.has(r.routeId)));
    } else {
      const existing = new Set(linkedRoutes.map((r) => r.routeId));
      const additions = filteredRoutes
        .filter((r) => !existing.has(r._id))
        .map((r) => ({
          routeId: r._id,
          routeCode: r.routeCode || r.routeName,
          description: r.description || "",
        }));
      onRoutesChange([...linkedRoutes, ...additions]);
    }
  };

  const handleAddBrand = useCallback(
    (item: any) => {
      if (!item?.value) return;
      const val = item.value;
      const exists = linkedBrands.some((b) => b.id === val.id);
      if (exists) return;
      onBrandsChange([
        ...linkedBrands,
        {
          id: val.id,
          brandId: val.objId || val.id,
          brandName: val.name,
        },
      ]);
    },
    [linkedBrands, onBrandsChange]
  );

  const handleRemoveBrand = useCallback(
    (id: string) => {
      onBrandsChange(linkedBrands.filter((b) => b.id !== id));
    },
    [linkedBrands, onBrandsChange]
  );

  return (
    <>
      {/* Summary header — tells user what this step is about */}
      <div className="tw:mb-4 tw:rounded-lg tw:border tw:border-blue-100 tw:bg-linear-to-r tw:from-blue-50 tw:to-white tw:p-4 tw:flex tw:items-start tw:gap-3">
        <div className="tw:rounded-full tw:bg-blue-500 tw:text-white tw:w-9 tw:h-9 tw:flex tw:items-center tw:justify-center tw:shrink-0">
          <Info size={18} />
        </div>
        <div className="tw:flex-1 tw:min-w-0">
          <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
            Allocate access for this sales employee
          </div>
          <p className="tw:text-xs tw:text-gray-600 tw:mt-0.5">
            Choose the B2B retailers they can serve, routes they cover, and brands
            they can sell. You can add or change this later.
          </p>
          <div className="tw:flex tw:flex-wrap tw:gap-2 tw:mt-2">
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-700 tw:bg-white tw:border tw:rounded-full tw:px-2 tw:py-0.5">
              <Store size={12} /> {linkedFranchises.length} B2B retailers
            </span>
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-700 tw:bg-white tw:border tw:rounded-full tw:px-2 tw:py-0.5">
              <MapPin size={12} /> {linkedRoutes.length} routes
            </span>
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-700 tw:bg-white tw:border tw:rounded-full tw:px-2 tw:py-0.5">
              <Tag size={12} /> {linkedBrands.length} brands
            </span>
          </div>
        </div>
      </div>

      {/* Franchises */}
      <AppCard
        title={
          <span className="tw:flex tw:items-center">
            {t("linkedFranchises")}
            <CountBadge count={linkedFranchises.length} />
          </span>
        }
        subtitle="Stores this employee is allowed to serve. Search by name, mobile or reference ID."
        icon="store"
      >
        <div className="tw:mb-3">
          <FranchiseSearchInput
            size="sm"
            label={t("searchFranchise")}
            placeholder={t("searchFranchise")}
            callback={(item, action) => {
              if (action === "add") handleAddFranchise(item);
            }}
          />
        </div>
        {linkedFranchises.length > 0 ? (
          <div className="tw:flex tw:flex-col tw:gap-2">
            {linkedFranchises.map((f) => (
              <div
                key={f.franchiseId}
                className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:p-2.5 tw:border tw:rounded-md tw:bg-gray-50 tw:hover:bg-white tw:hover:border-blue-200 tw:transition-colors"
              >
                <div className="tw:flex tw:items-center tw:gap-3 tw:min-w-0">
                  <div className="tw:w-8 tw:h-8 tw:rounded-full tw:bg-blue-100 tw:text-blue-700 tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-semibold tw:shrink-0">
                    {f.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="tw:min-w-0">
                    <div className="tw:font-medium tw:text-sm tw:truncate">
                      {f.name}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500 tw:truncate">
                      {f.refId}
                      {f.mobile ? ` • ${f.mobile}` : ""}
                      {f.email ? ` • ${f.email}` : ""}
                    </div>
                  </div>
                </div>
                <AppButton
                  size="small"
                  color="danger"
                  fill="outline"
                  onClick={() => handleRemoveFranchise(f.franchiseId)}
                >
                  <Trash2 size={14} />
                </AppButton>
              </div>
            ))}
          </div>
        ) : (
          <EmptyHint text="No B2B retailers linked yet. Use the search above to add." />
        )}
      </AppCard>

      {/* Routes */}
      <AppCard
        title={
          <span className="tw:flex tw:items-center">
            {t("linkedRoutes")}
            <CountBadge count={linkedRoutes.length} />
          </span>
        }
        subtitle="Delivery routes this employee will cover. Tick the ones that apply."
        icon="map-pin"
      >
        {loadingRoutes ? (
          <div className="tw:flex tw:justify-center tw:py-6">
            <AppSpinner />
          </div>
        ) : routes.length === 0 ? (
          <EmptyHint text={t("noRoutesFound")} />
        ) : (
          <>
            <div className="tw:flex tw:flex-col tw:sm:flex-row tw:gap-2 tw:sm:items-center tw:justify-between tw:mb-3">
              <div className="tw:flex-1 tw:max-w-sm">
                <input
                  type="text"
                  placeholder="Search routes"
                  value={routeSearch}
                  onChange={(e) => setRouteSearch(e.target.value)}
                  className="tw:w-full tw:h-9 tw:px-3 tw:text-sm tw:border tw:border-gray-300 tw:rounded-md tw:focus:outline-none tw:focus:border-blue-400 tw:focus:ring-1 tw:focus:ring-blue-200"
                />
              </div>
              <AppButton
                size="small"
                fill="outline"
                color={allVisibleSelected ? "danger" : "primary"}
                onClick={toggleSelectAllRoutes}
              >
                {allVisibleSelected ? "Clear all" : "Select all"}
              </AppButton>
            </div>
            {filteredRoutes.length === 0 ? (
              <EmptyHint text="No routes match your search." />
            ) : (
              <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-2">
                {filteredRoutes.map((route) => {
                  const isSelected = linkedRoutes.some(
                    (r) => r.routeId === route._id
                  );
                  return (
                    <div
                      key={route._id}
                      className={`tw:flex tw:items-center tw:gap-3 tw:p-2.5 tw:border tw:rounded-md tw:cursor-pointer tw:transition-colors ${
                        isSelected
                          ? "tw:border-blue-400 tw:bg-blue-50"
                          : "tw:border-gray-200 tw:bg-white tw:hover:border-blue-200"
                      }`}
                      onClick={() => handleRouteToggle(route, !isSelected)}
                    >
                      <AppCheckbox
                        value={isSelected}
                        label=""
                        onChange={(checked) =>
                          handleRouteToggle(route, checked)
                        }
                      />
                      <div className="tw:min-w-0 tw:flex-1">
                        <div className="tw:font-medium tw:text-sm tw:truncate">
                          {route.routeCode || route.routeName}
                        </div>
                        {route.description && (
                          <div className="tw:text-xs tw:text-gray-500 tw:truncate">
                            {route.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <Check size={16} className="tw:text-blue-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </AppCard>

      {/* Brands */}
      <AppCard
        title={
          <span className="tw:flex tw:items-center">
            {t("linkedBrands")}
            <CountBadge count={linkedBrands.length} />
          </span>
        }
        subtitle="Brands this employee is authorised to sell."
        icon="tag"
      >
        <div className="tw:mb-3">
          <BrandSearchInput
            size="sm"
            label={t("searchBrand")}
            placeholder={t("searchBrand")}
            callback={(item, action) => {
              if (action === "add") handleAddBrand(item);
            }}
          />
        </div>
        {linkedBrands.length > 0 ? (
          <div className="tw:flex tw:flex-wrap tw:gap-2">
            {linkedBrands.map((b) => (
              <div
                key={b.id}
                className="tw:inline-flex tw:items-center tw:gap-2 tw:pl-3 tw:pr-1.5 tw:py-1 tw:rounded-full tw:border tw:border-gray-200 tw:bg-white tw:hover:border-red-200 tw:transition-colors"
              >
                <Tag size={12} className="tw:text-gray-500" />
                <span className="tw:text-sm tw:font-medium">{b.brandName}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBrand(b.id)}
                  className="tw:w-6 tw:h-6 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-gray-400 tw:hover:text-red-600 tw:hover:bg-red-50"
                  aria-label="Remove brand"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyHint text="No brands linked yet. Use the search above to add." />
        )}
      </AppCard>
    </>
  );
};

export default LinkInfo;
