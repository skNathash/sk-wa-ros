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

/**
 * Side-pane contents for the B2B price-update cart in theme-2 desktop.
 *
 * The table shows one line at a time; the save validates all of them at once,
 * so the pane carries the cart-wide reading — how many lines still have no
 * price (the save blocks on those), how the cart is split between the two
 * pricing modes, what it adds up to against MRP, and how many lines would go
 * out below their purchase price.
 *
 * Reads the live form, so edits in the table move these numbers immediately.
 * Must be rendered inside the page's `FormProvider`.
 */
const PriceCartSidePane = () => {
  const { control } = useFormContext();
  const products: any[] = useWatch({ control, name: "products" }) || [];

  const stats = useMemo(() => {
    let priced = 0;
    let fixed = 0;
    let onMrp = 0;
    let belowCost = 0;
    let mrpValue = 0;
    let b2bValue = 0;
    let discountSum = 0;
    let discountCount = 0;

    products.forEach((product) => {
      const deal = product?.dealInfo || {};
      const form = product?.formData || {};
      const price = Number(form.price) || 0;
      const mrp = Number(deal.mrp) || 0;
      const purchasePrice = Number(deal.purchasePrice) || 0;

      // A line saves only once it carries a price; that is the gate the footer
      // Save runs into, so it's what "ready" means here.
      if (price > 0) priced++;
      if (form.type === "fixed") fixed++;
      else onMrp++;

      // Below the purchase price the line sells at a loss — worth naming before
      // the save rather than after.
      if (price > 0 && purchasePrice > 0 && price < purchasePrice) belowCost++;

      mrpValue += mrp;
      b2bValue += price;

      // The effective cut off MRP, whichever mode set the price.
      if (mrp > 0 && price > 0) {
        discountSum += ((mrp - price) / mrp) * 100;
        discountCount++;
      }
    });

    return {
      total: products.length,
      priced,
      fixed,
      onMrp,
      belowCost,
      mrpValue,
      b2bValue,
      avgDiscount: discountCount
        ? Math.round((discountSum / discountCount) * 10) / 10
        : 0,
    };
  }, [products]);

  return (
    <CartPaneShell title="Price Update" subtitle="B2B network selling price">
      <PaneCard
        title="Ready to save"
        meta={`${stats.total} item${stats.total === 1 ? "" : "s"}`}
      >
        <PaneProgress
          ready={stats.priced}
          total={stats.total}
          readyLabel="priced"
          pendingLabel="need price"
        />
        <PaneNote>
          Save applies the whole cart — a line without a price stops it.
        </PaneNote>
      </PaneCard>

      <PaneCard title="Pricing mode">
        <PaneSplitBar
          total={stats.total}
          segments={[
            {
              key: "on_mrp",
              label: "Discount on MRP",
              count: stats.onMrp,
              barClass: "tw:bg-indigo-500",
            },
            {
              key: "fixed",
              label: "Fixed price",
              count: stats.fixed,
              barClass: "tw:bg-sky-500",
            },
          ]}
        />
      </PaneCard>

      <PaneCard title="Cart value">
        <PaneStatRow label="B2B value" value={stats.b2bValue} amount emphasis />
        <PaneStatRow label="MRP value" value={stats.mrpValue} amount />
        <PaneStatRow label="Avg. cut off MRP" value={`${stats.avgDiscount}%`} />
        <PaneStatRow
          label="Below purchase price"
          value={stats.belowCost}
          dotClass={stats.belowCost ? "tw:bg-rose-500" : "tw:bg-slate-300"}
        />
        <PaneNote>
          Values are per-unit prices summed across the cart, not order totals.
        </PaneNote>
      </PaneCard>
    </CartPaneShell>
  );
};

export default PriceCartSidePane;
