import React from "react";
import DateFormat from "~/components/core/date/DateFormat";
import AppBadge from "~/components/core/badge/AppBadge";

type Props = {
  items: any[];
  loading: boolean;
  onItemClick: (item: any) => void;
};

const MobileView: React.FC<Props> = ({ items, loading, onItemClick }) => {
  if (loading) return <div>Loading...</div>;

  if (!items || items.length === 0) return <div>No receipts found</div>;

  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      {items.map((it) => (
        <div
          key={it._id || it.id}
          className="tw:border tw:p-3 tw:rounded tw:bg-white tw:shadow-sm"
        >
          <div className="tw:flex tw:justify-between tw:items-start">
            <div className="tw:flex-1">
              <div className="tw:font-medium tw:text-sm">
                {it.paymentType || it.type || it._id}
              </div>
              <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                <DateFormat
                  value={it.createdAt}
                  formatStr="dd MMM yyyy, hh:mm a"
                />
              </div>
              <div className="tw:text-sm tw:mt-2">
                Amount:{" "}
                <span className="tw:font-semibold">
                  {typeof it.amount === "number"
                    ? it.amount.toFixed(2)
                    : it.amount || "-"}
                </span>
              </div>
            </div>
            <div className="tw:ml-3 tw:flex tw:flex-col tw:items-end">
              <AppBadge
                className="tw:mb-2"
                variant={
                  it.status === "Success"
                    ? "success"
                    : it.status === "Pending"
                    ? "warning"
                    : "danger"
                }
              >
                {it.status || "-"}
              </AppBadge>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => onItemClick(it)}
              >
                View
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
