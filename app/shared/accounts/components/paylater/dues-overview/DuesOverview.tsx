import { endOfDay } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import CommonService from "~/services/CommonService";
import PaylaterService from "~/services/PaylaterService";

/**
 * Shape of the derived dues figures rendered by {@link DuesOverview}. Any of
 * these can be passed in directly (see {@link DuesOverviewProps}) to skip the
 * network fetch — useful for previews, tests, or when a parent already holds
 * the metrics.
 */
interface DuesData {
  /** Total amount currently owed across all PayLater accounts. */
  outstanding: number;
  /** Total credit limit issued across all accounts (the ceiling). */
  limitIssued: number;
  /** Accounts with an active/utilised PayLater line. */
  active: number;
  /** Accounts past their repayment validity with a balance owing. */
  overdue: number;
  /** Accounts falling due within the {@link DUE_SOON_WINDOW_DAYS} window. */
  dueSoon: number;
}

const EMPTY_DATA: DuesData = {
  outstanding: 0,
  limitIssued: 0,
  active: 0,
  overdue: 0,
  dueSoon: 0,
};

/** How many days out counts as "due soon". */
const DUE_SOON_WINDOW_DAYS = 7;

interface HealthBand {
  score: number;
  /** Translation key for the qualitative label (e.g. "Excellent"). */
  labelKey: string;
  labelFallback: string;
  /** Tailwind text colour for the status dot. */
  dotClassName: string;
}

/**
 * Derive a 0-100 "health" score from utilisation and overdue pressure. A book
 * that is lightly drawn-down with few overdue accounts scores high; heavy
 * utilisation and a large overdue share drag it down.
 */
const deriveHealth = (data: DuesData): HealthBand => {
  const utilisation =
    data.limitIssued > 0 ? Math.min(1, data.outstanding / data.limitIssued) : 0;
  const overdueRatio =
    data.active > 0 ? Math.min(1, data.overdue / data.active) : 0;

  const score = Math.max(
    0,
    Math.min(100, Math.round(100 - utilisation * 40 - overdueRatio * 60)),
  );

  if (score >= 85)
    return {
      score,
      labelKey: "healthExcellent",
      labelFallback: "Excellent",
      dotClassName: "tw:text-emerald-400",
    };
  if (score >= 70)
    return {
      score,
      labelKey: "healthGood",
      labelFallback: "Good",
      dotClassName: "tw:text-emerald-400",
    };
  if (score >= 50)
    return {
      score,
      labelKey: "healthFair",
      labelFallback: "Fair",
      dotClassName: "tw:text-amber-400",
    };
  return {
    score,
    labelKey: "healthPoor",
    labelFallback: "Poor",
    dotClassName: "tw:text-rose-400",
  };
};

interface DuesOverviewProps {
  /**
   * Pre-computed figures. When provided, the component renders these directly
   * and skips the network fetch. Omit to have the card fetch its own data.
   */
  data?: DuesData;
  className?: string;
}

/**
 * PayLater dues overview — a single hero card summarising the outstanding book
 * at a glance: total owed against the issued limit, a derived health score,
 * and a breakdown of active / overdue / due-soon accounts.
 *
 * Sits alongside {@link OutstandingBalance} (which splits totals by B2C/B2B)
 * in the PayLater layout side pane. Self-fetches from
 * {@link PaylaterService.getDashboardMetrics} plus overdue/due-soon counts
 * ({@link PaylaterService.getRequestCount}) unless `data` is supplied.
 */
const DuesOverview = ({
  data: dataProp,
  className = "",
}: DuesOverviewProps) => {
  const { t } = useTranslation();
  const [data, setData] = useState<DuesData>(dataProp ?? EMPTY_DATA);
  const [loading, setLoading] = useState(!dataProp);

  useEffect(() => {
    if (dataProp) {
      setData(dataProp);
      return;
    }

    let mounted = true;

    const now = new Date();
    const dueSoonEnd = new Date(now);
    dueSoonEnd.setDate(dueSoonEnd.getDate() + DUE_SOON_WINDOW_DAYS);

    const fetchData = async () => {
      setLoading(true);
      try {
        const [metricsResp, overdueResp, dueSoonResp]: any[] =
          await Promise.all([
            PaylaterService.getDashboardMetrics(),
            PaylaterService.getRequestCount({
              filter: {
                totalPayableAmount: { $gt: 0 },
                validityEndDate: { $lte: endOfDay(now) },
              },
              isMyNetwork: true,
            }),
            PaylaterService.getRequestCount({
              filter: {
                totalPayableAmount: { $gt: 0 },
                validityEndDate: {
                  $gt: endOfDay(now),
                  $lte: endOfDay(dueSoonEnd),
                },
              },
              isMyNetwork: true,
            }),
          ]);

        const payload = metricsResp?.data?.data ?? {};
        const b2c = payload?.b2cWallets ?? {};
        const b2b = payload?.b2bWallets ?? {};
        const b2cCustomers = payload?.b2cCustomers ?? {};
        const b2bCustomers = payload?.b2bCustomers ?? {};

        const next: DuesData = {
          outstanding:
            (b2c.totalOutstandingBalance || 0) +
            (b2b.totalOutstandingBalance || 0),
          limitIssued:
            (b2c.totalCreditLimit || 0) + (b2b.totalCreditLimit || 0),
          active: (b2cCustomers.count || 0) + (b2bCustomers.count || 0),
          overdue: overdueResp?.data?.data?.count ?? 0,
          dueSoon: dueSoonResp?.data?.data?.count ?? 0,
        };

        if (mounted) setData(next);
      } catch (e) {
        if (mounted) setData(EMPTY_DATA);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [dataProp]);

  const health = deriveHealth(data);
  // Sub-line copy is built here, not in the JSX — the headline keeps full
  // precision, only this line collapses to "₹1.65L".
  const limitIssuedLabel = CommonService.formatCompact(data.limitIssued);

  const stats = [
    {
      key: "active",
      label: t("active", { defaultValue: "Active" }),
      value: data.active,
      valueClassName: "tw:text-white",
    },
    {
      key: "overdue",
      label: t("overdue", { defaultValue: "Overdue" }),
      value: data.overdue,
      valueClassName: "tw:text-amber-300",
    },
    {
      key: "dueSoon",
      label: t("dueSoon", { defaultValue: "Due Soon" }),
      value: data.dueSoon,
      valueClassName: "tw:text-white",
    },
  ];

  return (
    <div
      className={`tw:rounded-2xl tw:bg-gradient-to-br tw:from-violet-600 tw:to-purple-800 tw:p-5 tw:text-white tw:shadow-lg ${className}`}
    >
      {/* Headline row: outstanding balance + health score */}
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
        <div className="tw:min-w-0">
          <div className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wider tw:text-white/70">
            {t("outstanding", { defaultValue: "Outstanding" })}
          </div>
          <div className="tw:mt-1 tw:text-3xl tw:font-bold tw:leading-tight">
            {loading ? (
              <AppSpinner className="tw-w-7 tw-h-7" />
            ) : (
              <Amount value={data.outstanding} decimalPlaces={0} />
            )}
          </div>
          <div className="tw:mt-1 tw:text-sm tw:text-white/70">
            {t("ofLimitIssued", {
              defaultValue: "of {{limit}} limit issued",
              limit: limitIssuedLabel,
            })}
          </div>
        </div>

        <div className="tw:shrink-0 tw:text-right">
          <div className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wider tw:text-white/70">
            {t("health", { defaultValue: "Health" })}
          </div>
          <div className="tw:mt-1 tw:flex tw:items-center tw:justify-end tw:gap-1.5 tw:text-2xl tw:font-bold">
            <span className={health.dotClassName}>●</span>
            <span>{loading ? "—" : health.score}</span>
          </div>
          <div className="tw:mt-1 tw:text-sm tw:text-white/70">
            {loading
              ? ""
              : t(health.labelKey, { defaultValue: health.labelFallback })}
          </div>
        </div>
      </div>

      {/* Account breakdown chips */}
      <div className="tw:mt-4 tw:grid tw:grid-cols-3 tw:gap-2">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="tw:rounded-xl tw:bg-white/10 tw:px-3 tw:py-2.5"
          >
            <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-white/70">
              {stat.label}
            </div>
            <div
              className={`tw:mt-0.5 tw:text-xl tw:font-bold ${stat.valueClassName}`}
            >
              {loading ? "—" : stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DuesOverview;
