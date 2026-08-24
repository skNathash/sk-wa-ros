import AppCard from "~/components/core/card/AppCard";

type SummaryItem = {
  key: string;
  label: string;
  value: string;
  hint: string;
  valueClassName?: string;
};

/**
 * Catalog headline stats for a vendor. Values are hard-coded for now — there is
 * no aggregate API for vendor catalog stats yet.
 */
const items: SummaryItem[] = [
  {
    key: "skus",
    label: "SKUs from this vendor",
    value: "12",
    hint: "across 4 categories",
  },
  {
    key: "below-par",
    label: "Below par",
    value: "6",
    hint: "need reordering",
    valueClassName: "tw:text-amber-600",
  },
  {
    key: "fast-movers",
    label: "Fast movers · 30d",
    value: "5",
    hint: "≥ 30 units sold",
  },
  {
    key: "margin",
    label: "Avg margin",
    value: "14%",
    hint: "MRP vs last buy",
  },
];

const CatalogSummary = ({ className }: { className?: string }) => {
  return (
    <div
      className={`tw:grid tw:grid-cols-2 tw:lg:grid-cols-4 tw:gap-2 tw:mb-3 ${className || ""}`}
    >
      {items.map((item) => (
        <AppCard
          key={item.key}
          className="tw:mb-0"
          noPadding
          bodyClassName="tw:p-3"
        >
          <div className="app-label tw:text-gray-500">{item.label}</div>
          <div
            className={`tw:mt-1 tw:text-xl tw:font-bold ${item.valueClassName || "tw:text-gray-900"}`}
          >
            {item.value}
          </div>
          <div className="tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
            {item.hint}
          </div>
        </AppCard>
      ))}
    </div>
  );
};

export default CatalogSummary;
