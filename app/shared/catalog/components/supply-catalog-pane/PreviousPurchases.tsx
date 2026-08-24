import clsx from "clsx";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import TintTile from "~/components/core/tint/TintTile";
import { CART_ITEM_ADDED, DEFAULT_BROWSE_DISTANCE } from "~/constants";
import SellerCatalogService from "~/services/SellerCatalogService";
import SellerListModal from "~/shared/catalog/modals/seller-list/SellerListModal";
import type { SellerDeal } from "~/types/CommonTypes";

export interface PreviousPurchaseItem {
  id: string;
  /** Product name as shown on the row. */
  name: string;
  /** Short brand label painted on the tile (falls back to the first letters). */
  brand?: string;
  /** Best price seen across the sellers carrying it. */
  price: number;
  /** How many sellers carry it. */
  sellerCount: number;
}

/** Reorder deal -> row shape used by this list. */
const mapDealToItem = (deal: SellerDeal): PreviousPurchaseItem => ({
  id: deal._id || deal.id,
  name: deal.name,
  brand: deal.brand?._displayName || deal.brand?.name || "",
  price: deal.displayPrice || deal.price || 0,
  sellerCount: Number(deal.totalSellers) || deal.sellers?.length || 0,
});

interface PreviousPurchasesProps {
  /** Pre-resolved rows. When omitted the reorder API is queried. */
  items?: PreviousPurchaseItem[];
  /** Maximum number of rows to show when fetching. */
  limit?: number;
  /** Browse distance for the reorder query. */
  distance?: string | number;
  /** Called when the row's Add button is tapped; defaults to the seller list. */
  onAdd?: (item: PreviousPurchaseItem) => void;
  /** Called when the row itself is tapped; defaults to the seller list. */
  onSelect?: (item: PreviousPurchaseItem) => void;
  /** Forwards cart events raised from the seller list modal. */
  callback?: (data: { action: string; data?: any }) => void;
  className?: string;
}

/**
 * "Usual" list for the catalog side pane — items the buyer has purchased
 * before, with a one-tap Add. Backed by the network reorder API unless the
 * caller supplies `items`; tapping a row opens the deal's seller list.
 */
const PreviousPurchases: React.FC<PreviousPurchasesProps> = ({
  items,
  limit = 3,
  distance = DEFAULT_BROWSE_DISTANCE,
  onAdd,
  onSelect,
  callback,
  className,
}) => {
  const [fetched, setFetched] = useState<PreviousPurchaseItem[]>([]);
  const [sellersModal, setSellersModal] = useState<{
    dealId: string;
    show: boolean;
  }>({ dealId: "", show: false });

  useEffect(() => {
    if (items) return;

    let active = true;

    const fetchData = async () => {
      try {
        const params = SellerCatalogService.getNetworkReorderParams({
          page: 1,
          count: limit,
        });
        const response = await SellerCatalogService.getReorder(params, distance);
        const data = response.data?.data || [];
        const formatted = SellerCatalogService.formatProductResponse(data, {
          view: "buyer",
        });
        if (active) setFetched(formatted.map(mapDealToItem));
      } catch (error) {
        console.error("Error fetching previous purchases:", error);
        if (active) setFetched([]);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [items, limit, distance]);

  const openSellers = (item: PreviousPurchaseItem) => {
    if (!item.id) return;
    setSellersModal({ dealId: item.id, show: true });
  };

  const handleSelect = (item: PreviousPurchaseItem) => {
    if (onSelect) {
      onSelect(item);
      return;
    }
    openSellers(item);
  };

  const handleAdd = (item: PreviousPurchaseItem) => {
    if (onAdd) {
      onAdd(item);
      return;
    }
    openSellers(item);
  };

  const handleModalCallback = useCallback(
    (data: { action: string; data?: any }) => {
      if (data.action === CART_ITEM_ADDED) {
        callback?.({
          action: CART_ITEM_ADDED,
          data: { dealId: data.data?.dealId },
        });
      }

      if (data.action === "close") {
        setSellersModal({ dealId: "", show: false });
      }
    },
    [callback],
  );

  const rows = (items ?? fetched).slice(0, limit);

  if (!rows.length) return null;

  return (
    <>
      <div
        className={clsx(
          "tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-100 tw:bg-white",
          className,
        )}
      >
        {rows.map((item, index) => (
          <div
            key={item.id}
            className="tw:flex tw:items-center tw:gap-2 tw:border-b tw:border-slate-100 tw:px-2.5 tw:py-1.5 tw:last:border-b-0"
          >
            <button
              type="button"
              onClick={() => handleSelect(item)}
              className="tw:flex tw:min-w-0 tw:flex-1 tw:cursor-pointer tw:items-center tw:gap-2 tw:text-left"
            >
              <TintTile
                index={index}
                className="tw:size-7 tw:shrink-0 tw:rounded-full"
              >
                <span className="tw:text-[8px] tw:font-bold tw:uppercase">
                  {(item.brand || item.name).slice(0, 5)}
                </span>
              </TintTile>

              <div className="tw:min-w-0 tw:flex-1">
                <p className="tw:truncate tw:text-xs tw:font-semibold tw:text-slate-800">
                  {item.name}
                </p>
                <p className="tw:text-[10px] tw:text-slate-500">
                  <Amount value={item.price} />
                  {" · "}
                  {item.sellerCount}{" "}
                  {item.sellerCount === 1 ? "seller" : "sellers"}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleAdd(item)}
              className="tw:flex tw:shrink-0 tw:cursor-pointer tw:items-center tw:gap-0.5 tw:text-[11px] tw:font-semibold tw:text-primary tw:transition-opacity tw:hover:opacity-80"
            >
              <Plus className="tw:size-3" />
              Add
            </button>
          </div>
        ))}
      </div>

      <SellerListModal
        show={sellersModal.show}
        dealId={sellersModal.dealId}
        callback={handleModalCallback}
        distance={distance}
      />
    </>
  );
};

export default PreviousPurchases;
