import React from "react";
import Amount from "~/components/core/amount/Amount";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { ListLoader, SectionLabel } from "../../components/ui";
import type { PartyRow } from "../helper";
import { MatchBadge, PartyAvatar, StateBadge } from "./DesktopView";

interface Props {
  data: PartyRow[];
  loading?: boolean;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
  periodLabel?: string;
  /** Section label — follows the tile the user picked above. */
  title: string;
}

const MobileView: React.FC<Props> = ({
  data,
  loading = false,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
  periodLabel,
  title,
}) => {
  if (loading) return <ListLoader />;

  if (data.length === 0) {
    return (
      <div className="tw:text-center tw:py-12">
        <NoData />
      </div>
    );
  }

  return (
    <>
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <SectionLabel>{title}</SectionLabel>
        {periodLabel && (
          <span className="tw:text-[11px] tw:text-gray-400 tw:shrink-0 tw:mb-2">
            {periodLabel}
          </span>
        )}
      </div>

      <div className="tw:bg-white tw:rounded-xl tw:border tw:border-gray-200 tw:divide-y tw:divide-gray-100">
        {data.map((item, idx) => (
          <div
            key={item._id}
            aria-label={`Party ${item.name}`}
            className="tw:px-3 tw:py-3"
          >
            <div className="tw:flex tw:items-center tw:gap-3">
              <PartyAvatar name={item.name} index={idx} size="sm" />

              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
                  {item.name}
                </div>
                <div className="tw:flex tw:items-center tw:gap-1.5 tw:mt-0.5">
                  <StateBadge state={item.state} />
                  <span className="tw:text-[11px] tw:text-gray-500 tw:tabular-nums tw:truncate">
                    {item.gstNumber || "no GSTIN"}
                  </span>
                </div>
              </div>

              <div className="tw:shrink-0 tw:text-right">
                <div className="tw:text-sm tw:font-bold tw:text-gray-900 tw:tabular-nums">
                  <Amount value={item.totalTaxableAmount} decimalPlaces={0} />
                </div>
                <div className="tw:text-[10px] tw:text-gray-400 tw:leading-tight">
                  taxable
                </div>
              </div>
            </div>

            <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2 tw:text-[11px] tw:tabular-nums">
              <span className="tw:text-gray-500">{item.orderCount} inv</span>
              <span className="tw:text-gray-300">·</span>
              <span className="tw:font-semibold tw:text-gray-700">
                <Amount value={item.totalTax} decimalPlaces={0} /> tax
              </span>
              <span className="tw:ml-auto">
                <MatchBadge matched={item.matched} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {showLoadMore && data.length > 0 && (
        <div className="tw:py-3 tw:flex tw:justify-center">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </>
  );
};

export default MobileView;
