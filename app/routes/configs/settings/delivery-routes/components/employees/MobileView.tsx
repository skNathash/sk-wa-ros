import { AlertCircle, CheckCircle, Phone, X } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import Rbac from "~/components/core/rbac/Rbac";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import UserPic from "~/shared/users/components/UserPic";
import AppBadge from "~/components/core/badge/AppBadge";

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

const EmployeeItem = ({
  item,
  callback,
}: {
  item: any;
  callback?: (a: { action: string; data?: any }) => void;
}) => {
  const hasRoutes = item.linkedRoutes?.length > 0;

  return (
    <AppCard noPadding>
      <div
        className={`tw:flex tw:flex-col tw:gap-2 tw:p-3 ${!hasRoutes ? "tw:bg-red-50" : ""}`}
      >
        <div className="tw:flex tw:flex-row tw:items-start tw:justify-between tw:gap-2">
          <div className="tw:flex tw:items-center tw:gap-3 tw:flex-1 tw:min-w-0">
            <UserPic
              assetId={item.profileImages?.[0]}
              gender={item.gender}
              type={item._userPicType}
              className="tw:w-10 tw:h-10 tw:rounded-full tw:border tw:border-gray-200 tw:shrink-0"
            />
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
                {item.name}
              </div>
              <div className="tw:mt-1">
                <AppBadge variant={item._positionBadgeColor}>
                  {item.digitalRole}
                </AppBadge>
              </div>
            </div>
          </div>

          <div className="tw:shrink-0">
            <Rbac roles={rbacRoles.assignRoute}>
              <AppButton
                size="small"
                onClick={() => callback?.({ action: "assign", data: item })}
                color={hasRoutes ? "secondary" : "primary"}
                className={
                  hasRoutes
                    ? "tw:bg-primary hover:tw:bg-primary/80 tw:text-white"
                    : "tw:bg-success hover:tw:bg-success/80 tw:text-white"
                }
              >
                {hasRoutes ? "Change" : "Assign"}
              </AppButton>
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
        </div>

        {hasRoutes ? (
          <div className="tw:flex tw:flex-col tw:gap-1.5">
            {item.linkedRoutes.map((route: any) => (
              <div
                key={route.routeId}
                className="tw:flex tw:items-center tw:gap-2 tw:bg-primary-50 tw:rounded tw:px-2.5 tw:py-2 tw:border tw:border-primary-200"
              >
                <CheckCircle
                  size={14}
                  className="tw:text-primary tw:shrink-0"
                />
                <div className="tw:flex-1 tw:min-w-0">
                  <span className="tw:text-xs tw:font-semibold tw:text-primary-700">
                    {route.routeName}
                  </span>
                </div>
                <Rbac roles={rbacRoles.assignRoute}>
                  <button
                    type="button"
                    onClick={() =>
                      callback?.({
                        action: "remove",
                        data: {
                          ...item,
                          routeId: route.routeId,
                          routeName: route.routeName,
                        },
                      })
                    }
                    className="tw:text-red-400 hover:tw:text-red-600 tw:transition-colors"
                  >
                    <X size={14} />
                  </button>
                </Rbac>
              </div>
            ))}
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
        <EmployeeItem key={item._id} item={item} callback={callback} />
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
