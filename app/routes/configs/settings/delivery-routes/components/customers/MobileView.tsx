import { AlertCircle, CheckCircle, MapPin, Phone } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import Rbac from "~/components/core/rbac/Rbac";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import RoutePopover from "~/shared/logistics/components/RoutePopover";

type Props = {
  loading: boolean;
  data: any[];
  showLoadMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
  loadedCount: number;
  callback?: (a: { action: string; data?: any }) => void;
};

const rbacRoles = {
  assignRoute: ["DELIVERY-ROUTE.DELIVERY-ROUTE-ASSIGN"],
};

const CustomerItem = ({
  item,
  callback,
}: {
  item: any;
  callback?: (a: { action: string; data?: any }) => void;
}) => {
  const currentRouteName = item.routeName || null;
  const hasRoute = !!(item.routeId || currentRouteName);

  return (
    <AppCard noPadding>
      <div
        className={`tw:flex tw:flex-col tw:gap-2 tw:p-3 ${!hasRoute ? "tw:bg-red-50" : ""}`}
      >
        <div className="tw:flex tw:flex-row tw:items-start tw:justify-between tw:gap-2">
          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
              <AppLink
                asLink
                href={`/dashboard/network/view/b2b/${item._id}`}
                className="tw:text-primary hover:tw:underline"
              >
                {item.name}
              </AppLink>
            </div>
          </div>

          <div className="tw:shrink-0 tw:flex tw:gap-2">
            <Rbac roles={rbacRoles.assignRoute}>
              <AppButton
                size="small"
                onClick={() => callback?.({ action: "change", data: item })}
                color={hasRoute ? "secondary" : "primary"}
                className={
                  hasRoute
                    ? "tw:bg-primary hover:tw:bg-primary/80 tw:text-white"
                    : "tw:bg-success hover:tw:bg-success/80 tw:text-white"
                }
              >
                {hasRoute ? "Change" : "Assign"}
              </AppButton>
            </Rbac>
            <Rbac roles={rbacRoles.assignRoute}>
              {hasRoute && (
                <AppButton
                  size="small"
                  onClick={() => callback?.({ action: "remove", data: item })}
                  color="danger"
                  fill="outline"
                >
                  Remove
                </AppButton>
              )}
            </Rbac>
          </div>
        </div>

        <div className="tw:space-y-1">
          {item.mobile ? (
            <div className="tw:flex tw:items-center tw:text-xs tw:text-gray-600">
              <Phone
                size={14}
                className="tw:mr-1.5 tw:text-gray-400 tw:shrink-0"
              />
              <span className="tw:truncate">{item.mobile}</span>
            </div>
          ) : null}

          {item.addressStr ? (
            <div className="tw:flex tw:items-start tw:text-xs tw:text-gray-600">
              <MapPin
                size={14}
                className="tw:mr-1.5 tw:mt-0.5 tw:text-gray-400 tw:shrink-0"
              />
              <span className="tw:truncate tw:line-clamp-1">
                {item.addressStr}
              </span>
            </div>
          ) : null}
        </div>

        {hasRoute ? (
          <div className="tw:flex tw:items-center tw:gap-2 tw:bg-blue-50 tw:rounded tw:px-2.5 tw:py-2 tw:border tw:border-blue-200">
            <CheckCircle size={14} className="tw:text-blue-600 tw:shrink-0" />
            <div className="tw:flex-1 tw:min-w-0 tw:flex tw:items-center tw:gap-1">
              <span className="tw:text-xs tw:text-gray-600 tw:font-medium">
                Route:{" "}
              </span>
              <span className="tw:text-xs tw:font-semibold tw:text-blue-700">
                {currentRouteName}
              </span>
              {item.routeData && <RoutePopover route={item.routeData} />}
            </div>
          </div>
        ) : (
          <div className="tw:flex tw:items-center tw:gap-2 tw:bg-red-100 tw:rounded tw:px-2.5 tw:py-2 tw:border tw:border-red-300">
            <AlertCircle size={14} className="tw:text-red-600 tw:shrink-0" />
            <span className="tw:text-xs tw:font-semibold tw:text-red-700">
              No route assigned
            </span>
          </div>
        )}
      </div>
    </AppCard>
  );
};

const MobileView = ({
  loading,
  data,
  showLoadMore,
  loadingMore,
  loadMore,
  totalCount,
  loadedCount,
  callback,
}: Props) => {
  return (
    <div className="tw:space-y-3">
      {loading && data.length === 0 ? (
        <div className="tw:flex tw:items-center tw:justify-center tw:h-40">
          <AppSpinner />
        </div>
      ) : null}

      {!loading && data.length === 0 ? (
        <div className="tw:flex tw:items-center tw:justify-center tw:h-40">
          <NoData />
        </div>
      ) : null}

      {data.map((item) => (
        <CustomerItem key={item._id} item={item} callback={callback} />
      ))}

      {showLoadMore && !loading && (
        <div className="tw:mt-4 tw:flex tw:justify-center tw:mb-4">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </div>
  );
};

export default MobileView;
