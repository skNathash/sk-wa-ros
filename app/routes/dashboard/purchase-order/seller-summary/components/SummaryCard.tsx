import clsx from "clsx";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";

type Props = {
  title: string;
  poValue: number;
  totalPo: number;
  totalVendors: number;
  type: "total" | "received" | "notReceived";
  description?: string;
  /** Full-width card: stats sit side by side from md up instead of stacking. */
  wide?: boolean;
  className?: string;
  callback: (a: { action: string; data?: any }) => void;
};

const SummaryCard = ({
  title,
  poValue,
  totalPo,
  totalVendors,
  type,
  description,
  wide = false,
  className,
  callback,
}: Props) => {
  const { t } = useTranslation(["common"]);

  const isNotReceived = type === "notReceived";

  const items = [
    {
      label: t("totalOrder"),
      value: totalPo || 0,
      isAmount: false,
      viewType: "order" as const,
    },
    {
      label: t("totalNetworkRetailers"),
      value: totalVendors || 0,
      isAmount: false,
      viewType: "sellers" as const,
    },
    {
      label: t("totalOrderValue"),
      value: poValue || 0,
      isAmount: true,
      viewType: undefined,
    },
  ];

  const goTo = (viewType: "sellers" | "order", value: number) =>
    callback({ action: viewType, data: { type, value } });

  /** Narrow card row: label on the left, value (and its View link) on the right. */
  const renderRow = (option: (typeof items)[number]) => (
    <div
      key={option.label}
      className={clsx(
        "tw:flex tw:items-center tw:justify-between tw:gap-4",
        "tw:py-3 tw:first:pt-0 tw:last:pb-0 tw:border-b tw:last:border-b-0",
        isNotReceived ? "tw:border-red-100" : "tw:border-slate-100",
      )}
    >
      <div className="tw:text-slate-600">{option.label}</div>
      <div className="tw:flex tw:items-center tw:gap-3">
        <div className="tw:font-bold tw:text-slate-900">
          {option.isAmount ? <Amount value={option.value} /> : option.value}
        </div>
        {option.viewType ? (
          <button
            type="button"
            className="tw:cursor-pointer tw:font-medium tw:text-primary tw:hover:underline"
            onClick={() => goTo(option.viewType!, option.value)}
          >
            {t("view")}
          </button>
        ) : null}
      </div>
    </div>
  );

  /**
   * Wide (md+) stat: label stacked over a large value. Stats that navigate
   * somewhere are buttons, so the whole block is the target instead of a
   * separate View link.
   */
  const renderWideItem = (option: (typeof items)[number]) => {
    const content = (
      <>
        <div className="tw:text-slate-600">{option.label}</div>
        <div className="tw:mt-1.5 tw:text-2xl tw:font-bold tw:text-slate-900">
          {option.isAmount ? <Amount value={option.value} /> : option.value}
        </div>
      </>
    );

    if (!option.viewType) {
      return <div key={option.label}>{content}</div>;
    }

    return (
      <button
        key={option.label}
        type="button"
        className="tw:text-left tw:cursor-pointer tw:hover:opacity-80"
        onClick={() => goTo(option.viewType!, option.value)}
      >
        {content}
      </button>
    );
  };

  return (
    <AppCard
      title={
        <div className="tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-3">
          <span
            className={clsx("tw:text-base tw:font-bold", {
              "tw:text-primary": type === "total",
              "tw:text-emerald-600": type === "received",
              "tw:text-red-500": isNotReceived,
            })}
          >
            {title}
          </span>
          {description ? (
            <span className="tw:hidden tw:sm:block tw:text-sm tw:font-normal tw:text-slate-500">
              {description}
            </span>
          ) : null}
        </div>
      }
      headerClassName={clsx(
        "tw:border-b tw:pb-3!",
        isNotReceived ? "tw:border-red-300!" : "tw:border-slate-200",
      )}
      className={clsx(
        "tw:mb-0 tw:py-4 tw:gap-3",
        // Red outline flags the card whose numbers ignore the date range.
        { "tw:border tw:border-red-400!": isNotReceived },
        className,
      )}
    >
      {/* Range note falls under the header when there is no room beside it. */}
      {description ? (
        <div className="tw:sm:hidden tw:text-xs tw:text-slate-500 tw:mb-3">
          {description}
        </div>
      ) : null}

      {wide ? (
        <>
          <div className="tw:md:hidden tw:flex tw:flex-col tw:text-sm">
            {items.map(renderRow)}
          </div>
          <div className="tw:hidden tw:md:grid tw:grid-cols-3 tw:gap-4 tw:text-sm">
            {items.map(renderWideItem)}
          </div>
        </>
      ) : (
        <div className="tw:flex tw:flex-col tw:text-sm">
          {items.map(renderRow)}
        </div>
      )}
    </AppCard>
  );
};

export default SummaryCard;
