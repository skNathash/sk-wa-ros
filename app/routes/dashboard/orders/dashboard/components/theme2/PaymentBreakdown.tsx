import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

/**
 * Theme-2 payment mix — the "where orders come from" list from the Analytics
 * design: one grouped card, a dotted row per method with a proportional share
 * bar and the amount on the right, instead of three detached tiles.
 *
 * The share drives only the bar width; the printed figures stay exactly the
 * ones the theme-1 card shows (label + amount).
 */
export type PaymentRow = {
  label: string;
  value: number;
  /** Share of the mix, 0-100 — bar width only. */
  percentage: number;
  color: string;
  icon: React.ReactNode;
};

const PaymentBreakdown: React.FC<{
  methods: PaymentRow[];
  loading?: boolean;
}> = ({ methods, loading = false }) => {
  const total = methods.reduce((sum, method) => sum + (method.value || 0), 0);

  return (
    <div className="tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-4 tw:py-3">
        <span className="tw:font-mono tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-500">
          Payment Methods
        </span>
        <span className="tw:text-xs tw:font-semibold tw:text-gray-500">
          {loading ? <AppSpinner size="sm" /> : <Amount value={total} />}
        </span>
      </div>

      <div className="tw:divide-y tw:divide-gray-100 tw:border-t tw:border-gray-100">
        {methods.map((method) => (
          <div key={method.label} className="tw:px-4 tw:py-3">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
              <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2.5">
                <span
                  className="tw:flex tw:h-7 tw:w-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg [&>svg]:tw:h-3.5 [&>svg]:tw:w-3.5"
                  style={{
                    backgroundColor: `${method.color}1a`,
                    color: method.color,
                  }}
                >
                  {method.icon}
                </span>
                <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
                  {method.label}
                </span>
              </div>
              <span className="tw:shrink-0 tw:text-base tw:font-bold tw:text-gray-900">
                {loading ? (
                  <AppSpinner size="sm" />
                ) : (
                  <Amount value={method.value} />
                )}
              </span>
            </div>

            <div className="tw:mt-2 tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-gray-100">
              <span
                className="tw:block tw:h-full tw:rounded-full"
                style={{
                  width: loading
                    ? "0%"
                    : `${Math.min(Math.max(method.percentage || 0, 0), 100)}%`,
                  backgroundColor: method.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentBreakdown;
