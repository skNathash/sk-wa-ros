import clsx from "clsx";
import { Gift } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { AppTable, TableHeader } from "~/components/core/table";
import type { TableHeaderItem } from "~/types/CommonTypes";
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

const headers: TableHeaderItem[] = [
  { label: "Customer", key: "customer", width: "35%" },
  { label: "Coins", key: "coins", width: "30%" },
  { label: "Redeemed", key: "redeemed", width: "15%" },
  { label: "Action", key: "action", width: "20%" },
];

const DesktopView = ({
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
    <AppTable>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {data.map((item, idx) => (
          <AppTable.Row key={item.holderId || idx}>
            <AppTable.Cell>
              <div className="tw:flex tw:items-center tw:gap-2.5">
                <div
                  className={clsx(
                    "tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold tw:text-white",
                    AVATAR_TONES[idx % AVATAR_TONES.length],
                  )}
                >
                  {initialsOf(item.name)}
                </div>
                <div className="tw:min-w-0">
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
              </div>
            </AppTable.Cell>

            <AppTable.Cell>
              <div className="tw:flex tw:items-center tw:gap-2">
                <span className="tw:shrink-0 tw:text-base tw:font-bold tw:tabular-nums tw:text-slate-800">
                  {formatCoins(item.available)}
                </span>
                <div className="tw:min-w-24 tw:flex-1">
                  <div className="tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
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
                  <div className="tw:mt-1 tw:text-[11px] tw:text-slate-500">
                    {item.milestone
                      ? `${item.milestone.label} (${item.milestone.coins})`
                      : "All rewards unlocked"}
                  </div>
                </div>
              </div>
            </AppTable.Cell>

            <AppTable.Cell>
              {item.lifetimeRedeemed ? (
                <AppBadge variant="secondary">
                  {formatCoins(item.lifetimeRedeemed)}
                </AppBadge>
              ) : (
                <AppBadge variant="warning">Never</AppBadge>
              )}
            </AppTable.Cell>

            <AppTable.Cell>
              <AppButton
                size="small"
                color="light"
                fill="outline"
                onClick={() => callback?.({ action: "share", data: item })}
              >
                <Gift size={16} />
                Share
              </AppButton>
            </AppTable.Cell>
          </AppTable.Row>
        ))}

        {hasMoreData && !loading && data.length > 0 && (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={totalCount}
                loadedCount={loadedCount}
              />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
