import React from "react";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import type { LaneSummary, PartyFilter } from "../helper";
import { formatCompactAmount } from "../helper";

interface Props {
  b2b: LaneSummary;
  b2c: LaneSummary;
  /** Parties whose GSTIN state prefix disagrees with their state. */
  mismatches: number;
  /** Caption under the mismatch tile, e.g. "follow up before 15 Aug". */
  mismatchCaption?: string;
  loading?: boolean;
  /** The tile driving the table below — each tile doubles as its filter. */
  active: PartyFilter;
  onSelect: (filter: PartyFilter) => void;
}

const Value: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`tw:text-2xl tw:md:text-3xl tw:font-bold tw:tabular-nums ${className}`}
  >
    {children}
  </div>
);

const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="tw:text-xs tw:text-gray-500 tw:mt-2">{children}</div>
);

const Summary: React.FC<Props> = ({
  b2b,
  b2c,
  mismatches,
  mismatchCaption,
  loading = false,
  active,
  onSelect,
}) => (
  <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-2 tw:md:gap-3 tw:mb-4">
    <AppStatsCard
      label="B2B Parties"
      color="success"
      active={active === "b2b"}
      onClick={() => onSelect("b2b")}
      info="Distinct registered customers billed in this period, with the taxable value behind them."
    >
      <Value className="tw:text-emerald-600">
        {loading ? "—" : b2b.parties.toLocaleString("en-IN")}
      </Value>
      <Caption>
        registered · {formatCompactAmount(b2b.totalTaxableAmount)} taxable
      </Caption>
    </AppStatsCard>

    <AppStatsCard
      label="B2C Small"
      color="primary"
      active={active === "b2c"}
      onClick={() => onSelect("b2c")}
      info="Unregistered (B2C) invoices in this period and the taxable value behind them."
    >
      <Value className="tw:text-gray-900">
        {loading ? "—" : b2c.orders.toLocaleString("en-IN")}
      </Value>
      <Caption>
        invoices · {formatCompactAmount(b2c.totalTaxableAmount)} taxable
      </Caption>
    </AppStatsCard>

    <AppStatsCard
      label="Mismatches"
      color="warning"
      active={active === "mismatch"}
      onClick={() => onSelect("mismatch")}
      info="Parties whose GSTIN state code does not agree with their recorded state — these will not reconcile against GSTR-2A."
    >
      <Value className="tw:text-amber-500">
        {loading ? "—" : mismatches.toLocaleString("en-IN")}
      </Value>
      <Caption>{mismatchCaption || "nothing to follow up"}</Caption>
    </AppStatsCard>
  </div>
);

export default Summary;
