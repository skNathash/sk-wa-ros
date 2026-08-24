import { BarChart3, Package, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptySkipToData,
  getSkipToSummary,
  type SkipToData,
  type SkipToRow,
  type SkipToTone,
} from "./helper";

interface AccountsSkipToSummaryProps {
  /** Section heading rendered above the list. Defaults to "Skip to". */
  title?: string;
}

const ICONS: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  trending: TrendingUp,
  package: Package,
  "bar-chart": BarChart3,
  wallet: Wallet,
};

const iconBgClass: Record<SkipToTone, string> = {
  in: "tw:bg-emerald-600",
  out: "tw:bg-orange-500",
  neutral: "tw:bg-slate-500",
};

const amountClass: Record<SkipToTone, string> = {
  in: "tw:text-emerald-700",
  out: "tw:text-orange-600",
  neutral: "tw:text-slate-800",
};

/**
 * Skip-to snapshot for the accounts side pane.
 *
 * Renders the P&L headline rows (Revenue, COGS, Gross Profit, Operating
 * Expenses) returned by `/accounts/dashboard/profitLoss/fy?type=skip_to` as a
 * full-bleed list with hairline borders instead of cards.
 */
const AccountsSkipToSummary = ({
  title = "Skip to",
}: AccountsSkipToSummaryProps) => {
  const [data, setData] = useState<SkipToData>(emptySkipToData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      const result = await getSkipToSummary();
      if (!active) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <p className="tw:mb-2 tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
        {title}
      </p>

      <div className="app-bleed-x tw:divide-y tw:divide-slate-100 tw:border-y tw:border-slate-100 tw:bg-white">
        {loading ? (
          <div className="tw:flex tw:min-h-[60px] tw:items-center tw:justify-center tw:px-3 tw:py-4">
            <AppSpinner size="sm" />
          </div>
        ) : (
          data.items.map((item) => <SkipToRow key={item.key} item={item} />)
        )}
      </div>
    </div>
  );
};

const SkipToRow = ({ item }: { item: SkipToRow }) => {
  const Icon = ICONS[item.iconKey] ?? TrendingUp;

  return (
    <div className="tw:flex tw:items-center tw:gap-3 tw:px-3 tw:py-2.5">
      <div
        className={`tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:text-white ${iconBgClass[item.tone]}`}
      >
        <Icon size={16} />
      </div>

      <div className="tw:min-w-0 tw:flex-1">
        <div className="tw:truncate tw:text-sm tw:font-medium tw:text-slate-900">
          {item.label}
        </div>
        {item.note && (
          <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
            {item.note}
          </div>
        )}
      </div>

      <Amount
        value={item.amount}
        decimalPlaces={0}
        className={`tw:shrink-0 tw:text-sm tw:font-bold ${amountClass[item.tone]}`}
      />
    </div>
  );
};

export default AccountsSkipToSummary;
