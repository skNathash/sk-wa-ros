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
 * Side-pane contents for the promotional-deal cart in theme-2 desktop.
 *
 * Each line is a yes/no flag and the save blocks on any line left unanswered,
 * so the pane leads with that count, then shows the split and the size of what
 * is being promoted — the stock and MRP value riding on the "yes" lines.
 *
 * Must be rendered inside the page's `FormProvider`.
 */
const PromotionalDealCartSidePane = () => {
  const { control } = useFormContext();
  const products: any[] = useWatch({ control, name: "products" }) || [];

  const stats = useMemo(() => {
    let promotional = 0;
    let regular = 0;
    let promoUnits = 0;
    let promoValue = 0;

    products.forEach((product) => {
      const deal = product?.dealInfo || {};
      const choice = product?.formData?.isPromotionalDeal;

      if (choice === "yes") {
        promotional++;
        const quantity = Number(deal.quantity) || 0;
        promoUnits += quantity;
        promoValue += quantity * (Number(deal.mrp) || 0);
      } else if (choice === "no") {
        regular++;
      }
    });

    return {
      total: products.length,
      promotional,
      regular,
      undecided: products.length - promotional - regular,
      promoUnits,
      promoValue,
    };
  }, [products]);

  return (
    <CartPaneShell
      title="Promotional Deals"
      subtitle="Flag products as promotional"
    >
      <PaneCard
        title="Ready to save"
        meta={`${stats.total} item${stats.total === 1 ? "" : "s"}`}
      >
        <PaneProgress
          ready={stats.total - stats.undecided}
          total={stats.total}
          readyLabel="decided"
          pendingLabel="undecided"
        />
        <PaneNote>
          Every line needs a yes or a no before the cart can be saved.
        </PaneNote>
      </PaneCard>

      <PaneCard title="Promotional split">
        <PaneSplitBar
          total={stats.total}
          segments={[
            {
              key: "yes",
              label: "Promotional",
              count: stats.promotional,
              barClass: "tw:bg-emerald-500",
            },
            {
              key: "no",
              label: "Regular",
              count: stats.regular,
              barClass: "tw:bg-slate-400",
            },
            {
              key: "undecided",
              label: "Not set",
              count: stats.undecided,
              barClass: "tw:bg-amber-500",
            },
          ]}
        />
      </PaneCard>

      {stats.promotional > 0 && (
        <PaneCard title="On promotion">
          <PaneStatRow
            label="Stock value"
            value={stats.promoValue}
            amount
            emphasis
          />
          <PaneStatRow label="Units" value={stats.promoUnits} />
          <PaneNote>
            Current on-hand stock on the promotional lines, valued at MRP.
          </PaneNote>
        </PaneCard>
      )}
    </CartPaneShell>
  );
};

export default PromotionalDealCartSidePane;
