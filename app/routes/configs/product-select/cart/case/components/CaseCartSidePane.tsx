import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import SellerCatalogService from "~/services/SellerCatalogService";
import {
  CartPaneShell,
  PaneCard,
  PaneNote,
  PaneProgress,
  PaneSplitBar,
  PaneStatRow,
} from "../../components/side-pane/CartPaneKit";

/** Bar colour per pack type, keyed by the API value stored on the form. */
const PACK_BAR_CLASS: Record<string, string> = {
  Unit: "tw:bg-slate-400",
  Ladi: "tw:bg-amber-500",
  InnerCase: "tw:bg-sky-500",
  Case: "tw:bg-emerald-500",
};

/**
 * Side-pane contents for the sell-in (case config) cart in theme-2 desktop.
 *
 * Sell-in decides the unit the product is sold in, so the pane reports the mix
 * across the cart, and the one thing the per-row fields can't show: lines whose
 * on-hand stock doesn't cover a single pack, which would leave them unsellable
 * once the pack size is applied.
 *
 * Must be rendered inside the page's `FormProvider`.
 */
const CaseCartSidePane = () => {
  const { control } = useFormContext();
  const products: any[] = useWatch({ control, name: "products" }) || [];

  const stats = useMemo(() => {
    const sellingTypes = SellerCatalogService.getSellingTypes();
    const labelFor = (apiValue: string) =>
      sellingTypes.find((type) => type.apiValue === apiValue)?.label ||
      apiValue;

    const counts: Record<string, number> = {};
    let configured = 0;
    let overrideAllowed = 0;
    let packQtySum = 0;
    let packQtyCount = 0;
    let largestPack = 0;
    let shortOfOnePack = 0;

    products.forEach((product) => {
      const deal = product?.dealInfo || {};
      const form = product?.formData || {};
      const packageType = form.packageType;
      const packageQty = Number(form.packageQty) || 0;

      if (!packageType || packageType === "Choose") return;

      counts[packageType] = (counts[packageType] || 0) + 1;

      // Same gate as the page's own validation: a pack type, plus a positive
      // quantity for everything that isn't sold loose.
      if (packageType === "Unit" || packageQty > 0) configured++;
      if (form.allowPackageQtyOverride) overrideAllowed++;

      if (packageType !== "Unit" && packageQty > 0) {
        packQtySum += packageQty;
        packQtyCount++;
        if (packageQty > largestPack) largestPack = packageQty;

        const stock = Number(deal.quantity) || 0;
        if (stock < packageQty) shortOfOnePack++;
      }
    });

    const segments = Object.keys(counts).map((packageType) => ({
      key: packageType,
      label: labelFor(packageType),
      count: counts[packageType],
      barClass: PACK_BAR_CLASS[packageType] || "tw:bg-indigo-500",
    }));

    const notSet = products.length - configured;
    if (notSet > 0) {
      segments.push({
        key: "not-set",
        label: "Not set",
        count: notSet,
        barClass: "tw:bg-amber-500",
      });
    }

    return {
      total: products.length,
      configured,
      overrideAllowed,
      largestPack,
      shortOfOnePack,
      segments,
      avgPackQty: packQtyCount
        ? Math.round((packQtySum / packQtyCount) * 10) / 10
        : 0,
      hasPacks: packQtyCount > 0,
    };
  }, [products]);

  return (
    <CartPaneShell title="Sell In Config" subtitle="Pack the product sells in">
      <PaneCard
        title="Ready to save"
        meta={`${stats.total} item${stats.total === 1 ? "" : "s"}`}
      >
        <PaneProgress
          ready={stats.configured}
          total={stats.total}
          readyLabel="configured"
          pendingLabel="need pack"
        />
        <PaneNote>
          A pack type is required on every line, and a pack quantity on
          everything not sold as units.
        </PaneNote>
      </PaneCard>

      <PaneCard title="Sell-in mix">
        <PaneSplitBar total={stats.total} segments={stats.segments} />
      </PaneCard>

      {stats.hasPacks && (
        <PaneCard title="Pack sizes">
          <PaneStatRow
            label="Average pack"
            value={`${stats.avgPackQty} units`}
            emphasis
          />
          <PaneStatRow
            label="Largest pack"
            value={`${stats.largestPack} units`}
          />
          <PaneStatRow
            label="Qty override allowed"
            value={stats.overrideAllowed}
          />
          {stats.shortOfOnePack > 0 && (
            <PaneStatRow
              label="Stock under one pack"
              value={stats.shortOfOnePack}
              dotClass="tw:bg-amber-500"
            />
          )}
          <PaneNote>
            Lines holding less stock than one pack can't be sold until they
            restock or allow a quantity override.
          </PaneNote>
        </PaneCard>
      )}
    </CartPaneShell>
  );
};

export default CaseCartSidePane;
