import clsx from "clsx";
import { Gift } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { AVATAR_TONES, formatCoins, initialsOf } from "../../../helper";
import type { CoinHolder } from "../helper";

type Props = {
  data: CoinHolder[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
  callback?: (payload: { action: string; data: CoinHolder }) => void;
};

const MobileView = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
  callback,
}: Props) => {
  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
        <AppSpinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <NoData />;
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3 tw:pb-4">
        {data.map((item, idx) => (
          <AppCard key={item.holderId || idx} noPadding>
            <div className="tw:px-4 tw:py-3">
              <div className="tw:flex tw:items-center tw:gap-2.5">
                <div
                  className={clsx(
                    "tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold tw:text-white",
                    AVATAR_TONES[idx % AVATAR_TONES.length],
                  )}
                >
                  {initialsOf(item.name)}
                </div>

                <div className="tw:min-w-0 tw:flex-1">
                  {item.profileUrl === "#" ? (
                    <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
                      {item.name}
                    </div>
                  ) : (
                    <AppLink
                      asLink
                      href={item.profileUrl}
                      className="tw:block tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900"
                    >
                      {item.name}
                    </AppLink>
                  )}
                  <div className="tw:mt-0.5 tw:text-xs tw:text-gray-500">
                    {item.holderType} · lifetime{" "}
                    {formatCoins(item.lifetimeEarned)} earned
                  </div>
                </div>

                <div className="tw:shrink-0 tw:text-right">
                  <div className="tw:text-base tw:font-bold tw:tabular-nums tw:text-slate-800">
                    {formatCoins(item.available)}
                  </div>
                  <div className="tw:text-[11px] tw:text-slate-400">coins</div>
                </div>
              </div>

              <div className="tw:mt-3 tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
                <div
                  className={clsx(
                    "tw:h-full tw:rounded-full",
                    item.milestoneProgress >= 100
                      ? "tw:bg-emerald-500"
                      : "tw:bg-amber-400",
                  )}
                  style={{ width: `${item.milestoneProgress}%` }}
                />
              </div>

              <div className="tw:mt-2 tw:flex tw:items-center tw:justify-between tw:gap-2">
                <span className="tw:truncate tw:text-[11px] tw:text-slate-500">
                  {item.milestone
                    ? `${item.milestone.label} (${item.milestone.coins})`
                    : "All rewards unlocked"}
                </span>

                {item.lifetimeRedeemed ? (
                  <AppBadge variant="secondary">
                    {formatCoins(item.lifetimeRedeemed)} redeemed
                  </AppBadge>
                ) : (
                  <AppBadge variant="warning">Never redeemed</AppBadge>
                )}
              </div>

              <div className="tw:mt-3">
                <AppButton
                  size="small"
                  color="light"
                  fill="outline"
                  expand="block"
                  onClick={() => callback?.({ action: "share", data: item })}
                >
                  <Gift size={16} />
                  Share Coin Store
                </AppButton>
              </div>
            </div>
          </AppCard>
        ))}
      </div>

      {hasMoreData && !loading && data.length > 0 && (
        <LoadMoreButton
          loadMore={loadMore}
          loading={loadingMore}
          totalCount={totalCount}
          loadedCount={loadedCount}
        />
      )}
    </>
  );
};

export default MobileView;
