import clsx from "clsx";
import { Boxes, IndianRupee } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import useAppNav from "~/hooks/useAppNav";
import SellerCatalogService from "~/services/SellerCatalogService";
import { useInventoryStockUpdated } from "~/shared/inventory/events";

/** What the component shows — the two headline inventory numbers. */
interface InventoryTotals {
  totalItems: number;
  inventoryValue: number;
}

const EMPTY_TOTALS: InventoryTotals = { totalItems: 0, inventoryValue: 0 };

/**
 * Store-wide item count + stock value. Uses the same seller-deal analytics
 * endpoint that backs the products-list summary cards (`totalDeals` /
 * `inventoryValue`), so the numbers stay in step with the list summary.
 */
const fetchTotals = async (
  params?: Record<string, any>,
): Promise<InventoryTotals> => {
  try {
    const response = await SellerCatalogService.getInventoryAnalytics(
      params || {},
    );
    if (response.statusCode === 200 && response.data?.success) {
      const data = response.data.data || {};
      return {
        totalItems: Number(data.totalDeals) || 0,
        inventoryValue: Number(data.inventoryValue) || 0,
      };
    }
    return EMPTY_TOTALS;
  } catch (error) {
    console.error("Error fetching inventory totals:", error);
    return EMPTY_TOTALS;
  }
};

interface InventoryValueProps {
  /**
   * Optional analytics params (same shape the products list sends), so the
   * totals can be scoped to the applied filters. Omit for store-wide totals.
   */
  params?: Record<string, any>;
  /**
   * Fired when a tile is tapped — "totalItems" | "inventoryValue". When omitted
   * the tile navigates to the products list itself.
   */
  onSelect?: (key: "totalItems" | "inventoryValue") => void;
  /** Section heading. Pass null to drop it. */
  title?: string | null;
  className?: string;
}

/**
 * Two-tile inventory headline: how many items are stocked and what that stock
 * is worth. Fetches its own data on mount, so it can be dropped into any pane
 * without the host wiring up the inventory summary.
 */
const InventoryValue = ({
  params,
  onSelect,
  title = "Inventory",
  className,
}: InventoryValueProps) => {
  const appNav = useAppNav();
  const [totals, setTotals] = useState<InventoryTotals>(EMPTY_TOTALS);
  const [loading, setLoading] = useState(true);

  // Re-fetch whenever the scoping params change. Serialized so a caller passing
  // a fresh object literal each render doesn't loop.
  const paramsKey = params ? JSON.stringify(params) : "";

  // Totals move whenever stock is added, so re-fetch on the stock event too.
  const stockToken = useInventoryStockUpdated();

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const data = await fetchTotals(params);
      if (!active) return;
      setTotals(data);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [paramsKey, stockToken]);

  const handleSelect = (key: "totalItems" | "inventoryValue") => {
    if (onSelect) {
      onSelect(key);
      return;
    }
    appNav.to("/dashboard/inventory/products/list");
  };

  const tiles = [
    {
      key: "totalItems" as const,
      label: "Items",
      icon: <Boxes size={13} />,
      iconClass: "tw:text-blue-500",
      value: <>{totals.totalItems}</>,
    },
    {
      key: "inventoryValue" as const,
      label: "Stock Value",
      icon: <IndianRupee size={13} />,
      iconClass: "tw:text-emerald-600",
      value: <Amount value={totals.inventoryValue} decimalPlaces={0} />,
    },
  ];

  return (
    <div className={className}>
      {title ? (
        <p
          className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {title}
        </p>
      ) : null}

      {/* Single card, split down the middle — the two numbers read as one
          headline instead of two competing boxes. */}
      <div
        className={clsx(
          "tw:flex tw:items-stretch tw:overflow-hidden tw:rounded-xl tw:bg-white tw:ring-1 tw:ring-slate-100",
          title && "tw:mt-1.5",
        )}
      >
        {tiles.map((tile, index) => (
          <button
            key={tile.key}
            type="button"
            onClick={() => handleSelect(tile.key)}
            className={clsx(
              "tw:flex tw:min-w-0 tw:flex-1 tw:cursor-pointer tw:flex-col tw:gap-1 tw:px-3 tw:py-2.5 tw:text-left tw:transition-colors tw:hover:bg-slate-50 tw:active:bg-slate-100",
              index > 0 && "tw:border-l tw:border-slate-100",
            )}
          >
            <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-medium tw:text-slate-500">
              <span className={clsx("tw:shrink-0", tile.iconClass)}>
                {tile.icon}
              </span>
              <span className="tw:truncate">{tile.label}</span>
            </span>
            {loading ? (
              <span className="tw:block tw:h-5 tw:w-16 tw:animate-pulse tw:rounded tw:bg-slate-100" />
            ) : (
              <span className="app-amount tw:block tw:truncate tw:text-lg tw:leading-5 tw:font-bold tw:text-slate-900">
                {tile.value}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InventoryValue;
