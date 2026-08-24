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
 * Side-pane contents for the reserve-configuration cart in theme-2 desktop.
 *
 * Every line is a yes/no, and the save refuses the cart while any line is
 * still undecided — so the pane leads with how many are left, then names what
 * turning reserve on actually costs: the stock those lines hold back and what
 * it is worth at MRP.
 *
 * Must be rendered inside the page's `FormProvider`.
 */
const ReserveCartSidePane = () => {
  const { control } = useFormContext();
  const products: any[] = useWatch({ control, name: "products" }) || [];

  const stats = useMemo(() => {
    let enabled = 0;
    let disabled = 0;
    let reservedUnits = 0;
    let reservedValue = 0;
    let outOfStock = 0;

    products.forEach((product) => {
      const deal = product?.dealInfo || {};
      const choice = product?.formData?.enableReserve;
      const quantity = Number(deal.quantity) || 0;

      if (choice === "yes") {
        enabled++;
        reservedUnits += quantity;
        reservedValue += quantity * (Number(deal.mrp) || 0);
        // Reserve on a line with nothing on hand changes nothing today — worth
        // seeing before saving a rule that looks applied but isn't.
        if (quantity <= 0) outOfStock++;
      } else if (choice === "no") {
        disabled++;
      }
    });

    return {
      total: products.length,
      enabled,
      disabled,
      undecided: products.length - enabled - disabled,
      reservedUnits,
      reservedValue,
      outOfStock,
    };
  }, [products]);

  return (
    <CartPaneShell title="Reserve Config" subtitle="Hold stock back from sale">
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

      <PaneCard title="Reserve split">
        <PaneSplitBar
          total={stats.total}
          segments={[
            {
              key: "yes",
              label: "Reserve enabled",
              count: stats.enabled,
              barClass: "tw:bg-emerald-500",
            },
            {
              key: "no",
              label: "Reserve disabled",
              count: stats.disabled,
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

      {stats.enabled > 0 && (
        <PaneCard title="What gets held back">
          <PaneStatRow
            label="Reserved value"
            value={stats.reservedValue}
            amount
            emphasis
          />
          <PaneStatRow label="Reserved units" value={stats.reservedUnits} />
          {stats.outOfStock > 0 && (
            <PaneStatRow
              label="Enabled with no stock"
              value={stats.outOfStock}
              dotClass="tw:bg-amber-500"
            />
          )}
          <PaneNote>
            Current on-hand stock on the enabled lines, valued at MRP.
          </PaneNote>
        </PaneCard>
      )}
    </CartPaneShell>
  );
};

export default ReserveCartSidePane;
