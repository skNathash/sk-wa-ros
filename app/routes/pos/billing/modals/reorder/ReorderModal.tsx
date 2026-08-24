import {
  Check,
  Info,
  Loader2,
  PackageX,
  PlusCircle,
  ShoppingCart,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import { AppCheckbox } from "~/components/core/form";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import NoData from "~/components/core/no-data/NoData";
import Rbac from "~/components/core/rbac/Rbac";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import PosService from "~/services/PosService";
import InventoryAddStockModal from "~/shared/catalog/modals/add-stock/InventoryAddStockModal";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import {
  buildSnapshots,
  getDealPrice,
  getDeals,
  getDealSellerId,
  getOrderDealIds,
  refreshDeal,
  type ReorderItem,
} from "./helper";

const rbacRoles = {
  addStock: ["INVENTORY.ADD-STOCK"],
};

interface ReorderModalProps {
  show: boolean;
  orderId: string;
  cartId: string;
  /** Cart customer type — "b2c" or "b2b". */
  type: string;
  /** Quick-checkout B2B carts fulfill like B2C, so they need snapshots too. */
  quickCheckout?: boolean;
  /** Items already in the active cart — they can't be reordered again. */
  cartItems?: any[];
  callback: (args: { action: string; data?: any }) => void;
}

const REORDER_QTY = 1;

const ReorderModal = ({
  show,
  orderId,
  cartId,
  type,
  quickCheckout,
  cartItems,
  callback,
}: ReorderModalProps) => {
  const { t } = useTranslation(["common"]);
  const toast = useAppToast();

  const isB2b = (type || "").toLowerCase() === "b2b";
  // Snapshot-backed carts: B2C, and B2B carts flagged for quick checkout.
  const needsSnapshots = !isB2b || !!quickCheckout;

  const [items, setItems] = useState<ReorderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // Deals already in the active cart — shown as read-only rows and never
  // included in the add-to-cart payload.
  const inCartDealIds = useMemo(
    () =>
      new Set(
        (cartItems || [])
          .map((item: any) => String(item?.deal?.id || ""))
          .filter(Boolean),
      ),
    [cartItems],
  );

  const [addStockModal, setAddStockModal] = useState<{
    show: boolean;
    data: ReorderItem | null;
  }>({ show: false, data: null });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setItems([]);
    setSelected({});
    try {
      const orderedDeals = await getOrderDealIds(orderId);
      const deals = await getDeals(orderedDeals, type);
      setItems(deals);
      // Everything is selected by default.
      const initial: Record<string, boolean> = {};
      deals.forEach((deal) => {
        initial[String(deal._id)] = true;
      });
      setSelected(initial);
    } catch (e) {
      setItems([]);
      toast.show({
        msg: "Failed to load the items from this order.",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [orderId, type]);

  useEffect(() => {
    if (show && orderId) fetchItems();
  }, [show, orderId, fetchItems]);

  const handleClose = () => callback({ action: "close" });

  const toggle = (dealId: string) =>
    setSelected((prev) => ({ ...prev, [dealId]: !prev[dealId] }));

  // Out-of-stock and already-in-cart rows can't be picked.
  const isSelectable = (item: ReorderItem) =>
    (item.maxQty || 0) > 0 && !inCartDealIds.has(String(item._id));

  const selectableItems = items.filter(isSelectable);

  const selectedItems = selectableItems.filter(
    (item) => selected[String(item._id)],
  );

  const allSelected =
    selectableItems.length > 0 &&
    selectableItems.every((item) => selected[String(item._id)]);

  const toggleAll = () => {
    const next: Record<string, boolean> = {};
    selectableItems.forEach((item) => {
      next[String(item._id)] = !allSelected;
    });
    setSelected(next);
  };

  const handleAddStockModal = async ({
    action,
    product,
  }: {
    action: string;
    product?: any;
  }) => {
    const target = addStockModal.data;
    setAddStockModal({ show: false, data: null });
    if (action !== "submit" || !product || !target) return;

    // Pull the deal back through the list pipeline so its stock (and the
    // resulting selectable state) matches the rest of the rows.
    try {
      const fresh = await refreshDeal(
        String(target._id),
        target.orderedQty,
        type,
      );
      if (!fresh) return;
      setItems((prev) =>
        prev.map((item) => (item._id === fresh._id ? fresh : item)),
      );
      // Newly stocked items become selectable — select them.
      if ((fresh.maxQty || 0) > 0) {
        setSelected((prev) => ({ ...prev, [String(fresh._id)]: true }));
      }
    } catch (e) {
      toast.show({
        msg: "Stock added, but the item could not be refreshed.",
        color: "warning",
      });
    }
  };

  const handleAddToCart = async () => {
    if (AuthService.isMasterLogin()) {
      toast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "error",
      });
      return;
    }

    if (selectedItems.length === 0) {
      toast.show({ msg: "Select at least one item.", color: "error" });
      return;
    }

    setAdding(true);
    try {
      let payloadItems = selectedItems.map((item) => ({
        dealId: String(item._id),
        quantity: REORDER_QTY,
        sellerId: getDealSellerId(item),
        ...(cartId ? { cartId } : {}),
        snapshots: [] as any[],
      }));

      if (needsSnapshots) {
        const { snapshotsByDeal, insufficient } = await buildSnapshots(
          payloadItems.map((item) => ({
            dealId: item.dealId,
            quantity: item.quantity,
          })),
        );

        payloadItems = payloadItems
          .filter((item) => snapshotsByDeal[item.dealId]?.length)
          .map((item) => ({
            ...item,
            snapshots: snapshotsByDeal[item.dealId],
          }));

        if (payloadItems.length === 0) {
          toast.show({
            msg: "No stock available for the selected items.",
            color: "error",
          });
          return;
        }

        if (insufficient.length > 0) {
          toast.show({
            msg: `${insufficient.length} item(s) skipped — not enough stock.`,
            color: "warning",
          });
        }
      }

      const result = await PosService.addItemsToCartBulk({
        items: payloadItems,
      });

      if (result.statusCode === 200) {
        PosService.triggerAddToCartEvent({
          quantity: payloadItems.length,
          ...(cartId ? { cartId } : {}),
        });
        toast.show({
          msg:
            result.data?.message ||
            `${payloadItems.length} item(s) added to cart`,
          color: "success",
        });
        callback({ action: "added", data: { count: payloadItems.length } });
      } else {
        toast.show({
          msg: result.data?.message || "Failed to add items to cart",
          color: "error",
        });
      }
    } catch (e) {
      toast.show({ msg: "Failed to add items to cart.", color: "error" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:flex-col">
          <span>Reorder Items</span>
          <span className="tw:text-xs tw:font-normal tw:text-slate-500">
            Pick the items you want to buy again
          </span>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:mb-3 tw:flex tw:items-start tw:gap-2 tw:rounded-lg tw:border tw:border-blue-100 tw:bg-blue-50 tw:px-3 tw:py-2">
          <Info size={14} className="tw:mt-0.5 tw:shrink-0 tw:text-blue-500" />
          <span className="tw:text-[12px] tw:text-blue-800">
            These items will be added to your existing cart. Quantity is set to
            1 for each item — you can change it in the cart.
          </span>
        </div>

        {loading && (
          <div className="tw:flex tw:flex-col tw:gap-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="tw:h-[76px] tw:animate-pulse tw:rounded-md tw:bg-slate-100"
              />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && <NoData />}

        {!loading && items.length > 0 && (
          <div className="tw:flex tw:flex-col tw:gap-2">
            <div className="tw:flex tw:items-center tw:justify-between tw:px-1">
              <AppCheckbox
                size="xs"
                label={allSelected ? "Unselect all" : "Select all"}
                value={allSelected}
                onChange={toggleAll}
              />
              <span className="tw:text-xs tw:text-slate-500">
                {selectedItems.length} of {selectableItems.length} selected
              </span>
            </div>

            {items.map((item) => {
              const dealId = String(item._id);
              const stock = item.maxQty || 0;
              const outOfStock = stock <= 0;
              const inCart = inCartDealIds.has(dealId);
              const price = getDealPrice(item, type);

              return (
                <div
                  key={dealId}
                  className={`tw:flex tw:items-center tw:gap-3 tw:rounded-lg tw:border tw:px-3 tw:py-2.5 tw:transition-colors ${
                    outOfStock || inCart
                      ? "tw:border-slate-200 tw:bg-slate-50"
                      : selected[dealId]
                        ? "tw:border-primary/40 tw:bg-primary/5"
                        : "tw:border-slate-200 tw:bg-white"
                  }`}
                >
                  {inCart ? (
                    <span className="tw:flex tw:h-4 tw:w-4 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-100">
                      <Check size={11} className="tw:text-emerald-600" />
                    </span>
                  ) : (
                    <AppCheckbox
                      size="xs"
                      label=""
                      value={!outOfStock && !!selected[dealId]}
                      onChange={() => !outOfStock && toggle(dealId)}
                    />
                  )}

                  <div className="tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-md tw:bg-slate-100">
                    {item.images?.[0] ? (
                      <ImgRender
                        assetId={item.images?.[0]}
                        alt={item.name}
                        className="tw:h-full tw:w-full tw:object-cover"
                      />
                    ) : (
                      <PackageX size={18} className="tw:text-slate-400" />
                    )}
                  </div>

                  <div className="tw:min-w-0 tw:flex-1">
                    <div className="tw:line-clamp-2 tw:text-[13px] tw:font-medium tw:text-slate-900">
                      {item.name}
                    </div>
                    <div className="tw:mt-1 tw:flex tw:items-center tw:gap-2">
                      <DisplayPrice
                        price={price}
                        uom={item.selectedStockUom}
                        className="tw:text-[13px] tw:font-bold tw:text-slate-900"
                      />
                      {item.mrp > price && (
                        <span className="tw:text-[11px] tw:text-slate-400 tw:line-through">
                          <Amount value={item.mrp} decimalPlaces={2} />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:gap-1">
                    <div
                      className={`tw:text-[11px] tw:font-semibold ${
                        inCart
                          ? "tw:text-emerald-600"
                          : outOfStock
                            ? "tw:text-rose-600"
                            : stock <= 5
                              ? "tw:text-amber-600"
                              : "tw:text-emerald-600"
                      }`}
                    >
                      {inCart ? (
                        "Already in cart"
                      ) : outOfStock ? (
                        "Out of stock"
                      ) : (
                        <>
                          <DisplayQty
                            qty={stock}
                            isLooseQty={false}
                            uom={item.selectedStockUom}
                            hideDefaultUom
                          />{" "}
                          in stock
                        </>
                      )}
                    </div>
                    {outOfStock && !inCart && (
                      <Rbac
                        roles={rbacRoles.addStock}
                        forceDisplay={AuthService.isMasterLogin()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setAddStockModal({ show: true, data: item })
                          }
                          className="tw:flex tw:items-center tw:gap-0.5 tw:rounded tw:border tw:border-blue-500 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-medium tw:text-blue-600 tw:whitespace-nowrap tw:cursor-pointer hover:tw:bg-blue-50"
                        >
                          <PlusCircle size={11} />
                          Add Stock
                        </button>
                      </Rbac>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer>
        <AppButton
          type="button"
          expand="full"
          color="primary"
          disabled={adding || loading || selectedItems.length === 0}
          onClick={handleAddToCart}
          className="tw:flex tw:items-center tw:justify-center tw:gap-2"
        >
          {adding ? (
            <Loader2 size={16} className="tw:animate-spin" />
          ) : (
            <ShoppingCart size={16} />
          )}
          Add {selectedItems.length > 0 ? selectedItems.length : ""} item
          {selectedItems.length === 1 ? "" : "s"} to cart
        </AppButton>
      </AppModal.Footer>

      <InventoryAddStockModal
        show={addStockModal.show}
        productId={addStockModal.data?._id}
        productName={addStockModal.data?.name}
        dealRefId={addStockModal.data?.id}
        mrp={addStockModal.data?.mrp}
        currentStock={addStockModal.data?.actualMaxQty}
        barcodes={addStockModal.data?.barcodes}
        selectedStockUom={addStockModal.data?.selectedStockUom}
        showCommission={false}
        callback={handleAddStockModal}
      />
    </AppModal>
  );
};

export default ReorderModal;
