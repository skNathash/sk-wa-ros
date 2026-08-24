import { format, isValid } from "date-fns";
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  CartPaneShell,
  PaneCard,
  PaneNote,
  PaneProgress,
  PaneSplitBar,
  PaneStatRow,
} from "../../components/side-pane/CartPaneKit";
import { validateForm } from "../helper";

/** Parses whatever the date pickers put on the form into a usable Date. */
const toDate = (value: any) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return isValid(date) ? date : null;
};

/**
 * Side-pane contents for the B2B scheme cart in theme-2 desktop.
 *
 * A scheme line needs four things together — a discount, a start, an end and a
 * tax basis — and the save rejects the cart until every line has all four. The
 * pane runs the page's own row validation to count what's still short, then
 * reports the two things the table can't show across lines: the window the
 * whole cart runs for, and how deep the discounts go.
 *
 * Must be rendered inside the page's `FormProvider`.
 */
const SchemeCartSidePane = () => {
  const { control } = useFormContext();
  const products: any[] = useWatch({ control, name: "products" }) || [];

  const stats = useMemo(() => {
    let ready = 0;
    let beforeTax = 0;
    let afterTax = 0;
    let belowCost = 0;
    let discountSum = 0;
    let discountCount = 0;
    let maxDiscount = 0;
    let schemeValue = 0;
    let earliestStart: Date | null = null;
    let latestEnd: Date | null = null;

    products.forEach((product) => {
      const deal = product?.dealInfo || {};
      const form = product?.formData || {};

      // Same check the footer Save runs per row, so "ready" here and the error
      // it raises can never disagree.
      if (!validateForm(form)) ready++;

      if (form.calculateOn === "afterTax") afterTax++;
      else if (form.calculateOn === "beforeTax") beforeTax++;

      const discount = Number(form.offerDiscount) || 0;
      if (discount > 0) {
        discountSum += discount;
        discountCount++;
        if (discount > maxDiscount) maxDiscount = discount;
      }

      const schemePrice = Number(form.schemePrice) || 0;
      const purchasePrice = Number(deal.purchasePrice) || 0;
      schemeValue += schemePrice;
      if (schemePrice > 0 && purchasePrice > 0 && schemePrice < purchasePrice) {
        belowCost++;
      }

      const start = toDate(form.offerStartDate);
      if (start && (!earliestStart || start < earliestStart)) {
        earliestStart = start;
      }
      const end = toDate(form.offerEndDate);
      if (end && (!latestEnd || end > latestEnd)) latestEnd = end;
    });

    return {
      total: products.length,
      ready,
      beforeTax,
      afterTax,
      belowCost,
      schemeValue,
      maxDiscount,
      avgDiscount: discountCount
        ? Math.round((discountSum / discountCount) * 10) / 10
        : 0,
      earliestStart: earliestStart as Date | null,
      latestEnd: latestEnd as Date | null,
    };
  }, [products]);

  const formatDay = (date: Date | null) =>
    date ? format(date, "dd MMM yyyy") : "—";

  return (
    <CartPaneShell title="B2B Scheme" subtitle="Time-bound B2B discounts">
      <PaneCard
        title="Ready to save"
        meta={`${stats.total} item${stats.total === 1 ? "" : "s"}`}
      >
        <PaneProgress
          ready={stats.ready}
          total={stats.total}
          readyLabel="complete"
          pendingLabel="incomplete"
        />
        <PaneNote>
          A scheme line needs a discount, both dates and a tax basis before the
          cart can be saved.
        </PaneNote>
      </PaneCard>

      <PaneCard title="Scheme window">
        <PaneStatRow label="Starts" value={formatDay(stats.earliestStart)} />
        <PaneStatRow label="Ends" value={formatDay(stats.latestEnd)} />
        <PaneNote>
          The earliest start and latest end across the cart — individual lines
          can run shorter.
        </PaneNote>
      </PaneCard>

      <PaneCard title="Discount depth">
        <PaneStatRow
          label="Average discount"
          value={`${stats.avgDiscount}%`}
          emphasis
        />
        <PaneStatRow label="Deepest discount" value={`${stats.maxDiscount}%`} />
        <PaneStatRow label="Scheme value" value={stats.schemeValue} amount />
        <PaneStatRow
          label="Below purchase price"
          value={stats.belowCost}
          dotClass={stats.belowCost ? "tw:bg-rose-500" : "tw:bg-slate-300"}
        />
      </PaneCard>

      <PaneCard title="Calculated on">
        <PaneSplitBar
          total={stats.total}
          segments={[
            {
              key: "beforeTax",
              label: "Before tax",
              count: stats.beforeTax,
              barClass: "tw:bg-indigo-500",
            },
            {
              key: "afterTax",
              label: "After tax",
              count: stats.afterTax,
              barClass: "tw:bg-sky-500",
            },
          ]}
        />
        <PaneNote>
          The discount is applied on the B2B price, before or after tax as set
          per line.
        </PaneNote>
      </PaneCard>
    </CartPaneShell>
  );
};

export default SchemeCartSidePane;
