import { Minus, Plus, Pencil, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDebouncedCallback } from "use-debounce";
import AppButton from "~/components/core/button/AppButton";
import { Input } from "~/components/ui/input";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CartService from "~/services/CartService";
import PosService from "~/services/PosService";
import MiscService from "~/services/MiscService";
import RackBinService from "~/services/RackBinService";
import SellerCatalogService from "~/services/SellerCatalogService";
import ChooseSanpshotModal from "~/shared/catalog/modals/sanpshots/ChooseSanpshotModal";
import type { SellerDeal, SnapshotMasterItem } from "~/types/CommonTypes";
import { POS_SCAN_INCREMENT_CART_ITEM } from "~/constants";

type PosAddToCartProps = {
  template?: 1 | 2;
  qty: number;
  dealId: string;
  callback: () => void;
  cartId?: string;
  snapshots?: Array<{
    barcode: string;
    expiry: string;
    id: string;
    mrp: number;
    purchaseprice: number;
    quantity: number;
  }>;
  customerType?: string;
  // Quick-checkout B2B carts follow the B2C fulfillment flow, so items must
  // carry snapshots (the physical stock units to debit) like a B2C POS cart.
  quickCheckout?: boolean;
  showSnapshotModal?: boolean;
  autoAdd?: boolean;
  disabled?: boolean;
  overridePrice?: number | null;
  purchasePrice?: number;
  assisted?: boolean;
  selectedStockUom?: string;
  scannedQty?: number;
  maxQty?: number;
};

const PosAddToCart = ({
  template = 1,
  qty,
  dealId,
  callback,
  cartId,
  snapshots,
  customerType,
  quickCheckout,
  showSnapshotModal = true,
  autoAdd,
  disabled: disabledProp,
  overridePrice,
  purchasePrice,
  assisted,
  selectedStockUom,
  scannedQty,
  maxQty,
}: PosAddToCartProps) => {
  const { t } = useTranslation(["common"]);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<"incr" | "decr" | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [masterData, setMasterData] = useState<SnapshotMasterItem[]>([]);
  const [deal, setDeal] = useState<SellerDeal | null>(null);
  const toast = useAppToast();
  const autoAddTriggered = useRef(false);
  const forceAutoAddedRef = useRef(false);

  const isLooseUom = selectedStockUom === "ml" || selectedStockUom === "gm";
  const altUom = selectedStockUom === "ml" ? "L" : "kg";
  const [inputQty, setInputQty] = useState<string>(() => {
    if (!isLooseUom || !qty) return "";
    if (qty >= 1000) return String(qty / 1000);
    return String(qty);
  });
  const [uom, setUom] = useState<string>(() => {
    if (!isLooseUom) return selectedStockUom || "";
    if (qty && qty >= 1000) return altUom;
    return selectedStockUom || "";
  });

  const toBaseQty = (val: string, currentUom: string): number => {
    const n = Number(val);
    if (!Number.isFinite(n) || n <= 0) return 0;
    if (currentUom === "kg" || currentUom === "L") return n * 1000;
    return n;
  };

  // Auto-add to cart when single search result (fresh add, not in cart yet).
  useEffect(() => {
    if (autoAdd && !autoAddTriggered.current && !loading) {
      autoAddTriggered.current = true;
      onAddToCart(
        "incr",
        scannedQty && scannedQty > 0 ? scannedQty : undefined,
      );
    }
    if (!autoAdd) {
      autoAddTriggered.current = false;
    }
  }, [autoAdd]);

  // Listen for scan-increment event when this component is mounted in the
  // cart panel (template=2). qty here is the accurate in-cart base quantity.
  useEffect(() => {
    if (template !== 2) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent)?.detail || {};
      if (!detail.dealId || detail.dealId !== dealId) return;
      const scanned =
        detail.scannedQty && detail.scannedQty > 0 ? detail.scannedQty : 1;
      if (isLooseUom && (qty || 0) > 0) {
        // Overwrite: remove existing line then re-add with scanned qty.
        (async () => {
          setLoading(true);
          try {
            const removeResult = await PosService.removeItemFromCart({
              dealId,
              ...(cartId ? { cartId } : {}),
            });
            if (removeResult && removeResult.statusCode === 200) {
              PosService.triggerRemoveFromCartEvent({
                dealId,
                quantity: qty,
                ...(cartId ? { cartId } : {}),
              });
            }
          } catch (err) {
            // surface via insufficient-stock check below if needed
          } finally {
            setLoading(false);
          }
          forceAutoAddedRef.current = true;
          onAddToCart("incr", scanned);
        })();
      } else {
        forceAutoAddedRef.current = true;
        onAddToCart("incr", (qty || 0) + scanned);
      }
    };
    MiscService.listenEvent(POS_SCAN_INCREMENT_CART_ITEM, handler);
    return () => {
      MiscService.removeEvent(POS_SCAN_INCREMENT_CART_ITEM, handler);
    };
  }, [template, dealId, qty, maxQty, isLooseUom, cartId]);

  // Fetch deal details + snapshot master data, with usedQty marked from the
  // current cart (or the `snapshots` prop as fallback). Returns null (after
  // showing a toast) when the data cannot be loaded.
  const fetchProcessedMasterData = async (): Promise<{
    dealData: any;
    processedMasterData: any[];
  } | null> => {
    // First, fetch the deal details using the dealId
    const dealResponse = await SellerCatalogService.getProducts({
      filter: {
        dealId: dealId,
      },
    });

    if (!dealResponse || dealResponse.statusCode !== 200) {
      toast.show({
        msg: "Failed to fetch product details.",
        color: "error",
      });
      return null;
    }

    const dealData = dealResponse.data.data?.[0] || {};
    setDeal(dealData);

    // Then fetch the master data using the deal details
    const response = await RackBinService.getSnapshotsMastersData(
      AuthService.getLoggedInUserId() || "",
      {
        filter: {
          quantity: { $gt: 0 },
          dealId: dealId,
          isUsable: true,
        },
      },
    );

    if (
      !response ||
      !response.data ||
      !Array.isArray(response.data.data) ||
      response.data.data.length === 0
    ) {
      toast.show({
        msg: "No master data found for this product.",
        color: "error",
      });
      return null;
    }

    let processedMasterData = response.data.data;

    // Try to fetch current cart and collect any used snapshots for this deal
    try {
      // map UI customerType to API cartType
      const cartTypeLower = (customerType || "").toLowerCase();
      const cartType = cartTypeLower === "b2b" ? "B2B" : "B2C";

      // For quick checkout target the exact cart so used-snapshot dedup
      // doesn't pick up a normal B2B cart for the same retailer.
      const cartFilter: Record<string, any> =
        quickCheckout && cartId
          ? { _id: cartId }
          : { platform: "POS", cartType };
      if (assisted) cartFilter.assistedOrder = true;
      const cartResp = await PosService.getCart({
        filter: cartFilter,
      });

      const cartData =
        cartResp.data?.data && Array.isArray(cartResp.data.data)
          ? cartResp.data.data[0] || {}
          : {};

      const cartItems = cartData.items || [];

      const matchedItem = cartItems.find(
        (i: any) => (i.deal && i.deal.id === dealId) || i.itemId === dealId,
      );

      if (matchedItem && Array.isArray(matchedItem.snapshots)) {
        // Use server-side used snapshots to mark usedQty in master data and reduce stock
        processedMasterData = RackBinService.updateMasterDataWithUsedQuantities(
          processedMasterData,
          matchedItem.snapshots,
          false,
        );
      } else if (
        snapshots &&
        Array.isArray(snapshots) &&
        snapshots.length > 0
      ) {
        // Fallback to snapshots passed from parent
        processedMasterData = RackBinService.updateMasterDataWithUsedQuantities(
          processedMasterData,
          snapshots,
          false,
        );
      }
    } catch (err) {
      // If cart fetch fails, fallback to provided snapshots (if any)
      if (snapshots && Array.isArray(snapshots) && snapshots.length > 0) {
        processedMasterData = RackBinService.updateMasterDataWithUsedQuantities(
          processedMasterData,
          snapshots,
          false,
        );
      }
    }

    return { dealData, processedMasterData };
  };

  // action can be 'incr' or 'decr' for B2B flows; default to 'incr'
  const onAddToCart = async (
    action: "incr" | "decr" = "incr",
    overrideQty?: number,
  ): Promise<boolean> => {
    if (AuthService.isMasterLogin()) {
      toast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "error",
      });
      return false;
    }

    // Block incrementing beyond available stock. overrideQty is the target
    // absolute quantity (e.g. qty + 1 from the stepper); for non-loose flows
    // a single tap requests one more unit than is currently in the cart.
    if (action === "incr" && typeof maxQty === "number" && maxQty > 0) {
      const requestedQty =
        typeof overrideQty === "number" && overrideQty > 0
          ? overrideQty
          : (qty || 0) + 1;
      if (requestedQty > maxQty) {
        toast.show({
          msg: "You've reached the maximum available stock for this item.",
          color: "error",
        });
        return false;
      }
    }

    setLoading(true);
    setActiveAction(action);
    try {
      const fetched = await fetchProcessedMasterData();
      if (!fetched) return false;
      const { dealData, processedMasterData } = fetched;

      // Quick-checkout B2B carts skip the snapshot-less temp-cart path and
      // fall through to the B2C snapshot flow below.
      if (customerType === "b2b" && !quickCheckout) {
        const totalQuantity = processedMasterData.reduce(
          (sum: number, snap: any) => {
            return sum + Number(snap.totalQuantity || 0);
          },
          0,
        );

        await handleB2bAddToCart(action, totalQuantity);
        return false;
      }

      // For loose-uom (gm/ml) with explicit qty, auto-pick masters across
      // snapshots to fulfill the requested base qty without showing the modal.
      if (isLooseUom && typeof overrideQty === "number" && overrideQty > 0) {
        if (!processedMasterData || processedMasterData.length === 0) {
          toast.show({
            msg: "No master data available to add to cart.",
            color: "error",
          });
          return false;
        }

        const targetMrp = dealData?.mrp || 0;
        const builtSnapshots: any[] = [];
        let remaining = overrideQty;

        for (const snap of processedMasterData) {
          if (remaining <= 0) break;
          if (!snap || !Array.isArray(snap.masters)) continue;
          const sortedMasters = [...snap.masters].sort((a: any, b: any) => {
            const aMatch = Number(a.mrp) === Number(targetMrp) ? 0 : 1;
            const bMatch = Number(b.mrp) === Number(targetMrp) ? 0 : 1;
            return aMatch - bMatch;
          });
          const usedMasters: any[] = [];
          let snapEntered = 0;
          for (const m of sortedMasters) {
            if (remaining <= 0) break;
            const avail = Number(m.quantity || 0);
            if (avail <= 0) continue;
            const useQty = Math.min(avail, remaining);
            usedMasters.push({ ...m, usedQty: useQty });
            snapEntered += useQty;
            remaining -= useQty;
          }
          if (usedMasters.length > 0) {
            builtSnapshots.push({
              ...snap,
              enteredStock: snapEntered,
              masters: usedMasters,
            });
          }
        }

        if (builtSnapshots.length === 0 || remaining > 0) {
          toast.show({
            msg: "Insufficient stock for the requested quantity.",
            color: "error",
          });
          return false;
        }

        return await handleAddToCart(builtSnapshots);
      }

      // If parent requested skipping the snapshot modal, auto-select a master.
      // Prefer a master that matches parent's `mrp` (from `snapshots` prop or `deal`),
      // otherwise fall back to the first available master.
      if (showSnapshotModal === false) {
        if (!processedMasterData || processedMasterData.length === 0) {
          toast.show({
            msg: "No master data available to add to cart.",
            color: "error",
          });
          return false;
        }

        const targetMrp = dealData?.mrp || 0;

        // Try to find a snapshot entry that contains a master with matching MRP
        let chosenSnapshot: any = null;
        let chosenMaster: any = null;

        if (typeof targetMrp !== "undefined") {
          for (const snap of processedMasterData) {
            if (!snap || !Array.isArray(snap.masters)) continue;
            const match = snap.masters.find(
              (m: any) => Number(m.mrp) === Number(targetMrp),
            );
            if (match) {
              chosenSnapshot = snap;
              chosenMaster = match;
              break;
            }
          }
        }

        // If no matching MRP master found, pick the first available master
        if (!chosenSnapshot) {
          const firstSnapshot = processedMasterData.find(
            (s: any) => s && Array.isArray(s.masters) && s.masters.length > 0,
          );

          if (!firstSnapshot) {
            toast.show({
              msg: "No master data available to add to cart.",
              color: "error",
            });
            return false;
          }

          chosenSnapshot = firstSnapshot;
          chosenMaster = firstSnapshot.masters[0];
        }

        const requestedQty =
          typeof overrideQty === "number" && overrideQty > 0
            ? overrideQty
            : qty || 1;
        const usedQty = Math.min(
          requestedQty,
          Number(chosenMaster.totalQuantity || 1),
        );

        const snapshotForPayload = {
          ...chosenSnapshot,
          enteredStock: usedQty,
          masters: [
            {
              ...chosenMaster,
              usedQty,
            },
          ],
        };

        // directly add to cart using the constructed snapshot payload
        return await handleAddToCart([snapshotForPayload]);
      }

      // The snapshot modal only exists to disambiguate between distinct
      // snapshots (MRP/barcode/expiry groups). If there is just one such
      // group there is no choice to make, so skip the modal and auto-pick it,
      // consuming its batch masters (FIFO) up to the requested qty. A single
      // group can still hold multiple batch masters (e.g. after adding stock),
      // which is why we count snapshots here, not individual masters.
      const availableSnapshots = processedMasterData.filter(
        (snap: any) =>
          snap &&
          Array.isArray(snap.masters) &&
          snap.masters.some((m: any) => Number(m?.quantity || 0) > 0),
      );
      if (availableSnapshots.length === 1) {
        const snap = availableSnapshots[0];
        const requestedQty =
          typeof overrideQty === "number" && overrideQty > 0
            ? overrideQty
            : qty || 1;
        let remaining = requestedQty;
        const usedMasters: any[] = [];
        for (const m of snap.masters) {
          if (remaining <= 0) break;
          const avail = Number(m.quantity || 0);
          if (avail <= 0) continue;
          const useQty = Math.min(avail, remaining);
          usedMasters.push({ ...m, usedQty: useQty });
          remaining -= useQty;
        }
        if (usedMasters.length > 0) {
          const snapshotForPayload = {
            ...snap,
            enteredStock: usedMasters.reduce(
              (sum: number, m: any) => sum + (m.usedQty || 0),
              0,
            ),
            masters: usedMasters,
          };
          return await handleAddToCart([snapshotForPayload]);
        }
      }

      setMasterData(processedMasterData);
      setShowModal(true);
      return false;
    } catch (error) {
      toast.show({
        msg: "Failed to load product data. Please try again.",
        color: "error",
      });
      return false;
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  // Tap on the qty in the stepper: open the snapshot modal so the user can
  // review/adjust which snapshots (MRP/expiry batches) the quantity uses.
  // Quick-checkout B2B carts carry snapshots like B2C, so allow it there too.
  const onQtyTap = async () => {
    if (loading || disabledProp || (customerType === "b2b" && !quickCheckout))
      return;
    setLoading(true);
    try {
      const fetched = await fetchProcessedMasterData();
      if (!fetched) return;
      setMasterData(fetched.processedMasterData);
      setShowModal(true);
    } catch (error) {
      toast.show({
        msg: "Failed to load product data. Please try again.",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleB2bAddToCart = async (
    action: "incr" | "decr" = "incr",
    totalQuantity?: number,
  ) => {
    // Determine existing quantity from temporary cart and increment/decrement
    const existing = CartService.getDealFromTmpCart(dealId);
    const currentQty = existing?.quantity || 0;
    const newQty =
      action === "decr" ? Math.max(0, currentQty - 1) : currentQty + 1;

    // If incrementing and totalQuantity is provided, block if exceeding stock
    if (action === "incr" && typeof totalQuantity === "number") {
      if (newQty > totalQuantity) {
        toast.show({
          msg: "You’ve reached the maximum available stock for this item.",
          color: "error",
        });
        return;
      }
    }

    // If decrement would result in zero, send quantity 0 (backend may remove)
    const payload = {
      dealId: dealId,
      quantity: newQty,
      snapshots: [],
      ...(cartId ? { cartId } : {}),
    };

    setLoading(true);
    const result = await PosService.addItemToCart(payload);
    if (result.statusCode === 200) {
      PosService.triggerAddToCartEvent({
        dealId: dealId,
        quantity: 1,
        snapshots: [],
        autoAdded: forceAutoAddedRef.current,
        ...(cartId ? { cartId } : {}),
      });
      forceAutoAddedRef.current = false;
      callback();
      const reachedMaxStock =
        typeof totalQuantity === "number" && newQty === totalQuantity;
      toast.show({
        msg: reachedMaxStock
          ? "Item added. You’ve reached the maximum available stock for this item."
          : result.data?.message || "Product added to cart",
        color: "success",
      });
    } else {
      toast.show({
        msg: result.data?.message || "Failed to add product to cart",
        color: "error",
      });
    }
    setLoading(false);
  };

  // Add to cart API implementation
  const handleAddToCart = async (snapshots: any[]): Promise<boolean> => {
    setLoading(true);
    try {
      const totalEnteredQty = snapshots.reduce(
        (sum, item) => sum + (item.enteredStock || 0),
        0,
      );

      // Flatten all masters from all snapshots into one array for payload
      const allMasters = snapshots
        .filter((item: any) => item.enteredStock > 0)
        .flatMap((item: any) =>
          Array.isArray(item.masters)
            ? item.masters
                .filter((master: any) => master.usedQty > 0)
                .map((master: any) => ({
                  id: master._id,
                  quantity: master.usedQty,
                  expiry: master.expiry,
                  barcode: master.barcode,
                  purchasePrice: master.purchasePrice,
                  mrp: master.mrp,
                }))
            : [],
        );

      const payload = {
        dealId: dealId,
        quantity: totalEnteredQty,
        snapshots: allMasters,
        ...(cartId ? { cartId } : {}),
      };

      const result = await PosService.addItemToCart(payload);
      if (result.statusCode === 200) {
        PosService.triggerAddToCartEvent({
          dealId: dealId,
          quantity: totalEnteredQty,
          snapshots: allMasters,
          autoAdded: !!autoAdd || forceAutoAddedRef.current,
          ...(cartId ? { cartId } : {}),
        });
        forceAutoAddedRef.current = false;
        callback();
        toast.show({
          msg: result.data?.message || "Product added to cart",
          color: "success",
        });
        return true;
      } else {
        toast.show({
          msg: result.data?.message || "Failed to add product to cart",
          color: "error",
        });
        return false;
      }
    } catch (e) {
      toast.show({
        msg: "Failed to add product to cart.",
        color: "error",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const lastCommittedRef = useRef<{ qty: string; uom: string }>({
    qty: inputQty,
    uom: uom,
  });

  useEffect(() => {
    if (!isLooseUom) return;
    const base = Number(qty) || 0;
    const displayNum = uom === "kg" || uom === "L" ? base / 1000 : base;
    const displayStr = base > 0 ? String(displayNum) : "";
    if (Number(displayStr || 0) === Number(inputQty || 0)) return;
    setInputQty(displayStr);
    lastCommittedRef.current = { qty: displayStr, uom };
  }, [qty, isLooseUom]);

  const debouncedLooseAddToCart = useDebouncedCallback(
    async (val: string, currentUom: string) => {
      const baseQty = toBaseQty(val, currentUom);
      if (baseQty <= 0) return;
      const previous = lastCommittedRef.current;
      const success = await onAddToCart("incr", baseQty);
      if (success) {
        lastCommittedRef.current = { qty: val, uom: currentUom };
      } else {
        setInputQty(previous.qty);
        setUom(previous.uom);
      }
    },
    500,
  );

  const handleLooseQtyChange = (val: string) => {
    setInputQty(val);
    debouncedLooseAddToCart(val, uom);
  };

  const handleLooseUomChange = (newUom: string) => {
    const n = Number(inputQty);
    let nextQty = inputQty;
    if (Number.isFinite(n) && n > 0 && newUom !== uom) {
      const baseUnits = ["gm", "ml"];
      const goingToBigger = !baseUnits.includes(newUom); // gm→kg or ml→L
      const converted = goingToBigger ? n / 1000 : n * 1000;
      nextQty = String(converted);
    }
    setUom(newUom);
    setInputQty(nextQty);
    if (nextQty) debouncedLooseAddToCart(nextQty, newUom);
  };

  const handleModalCallback = (result: { action: string; data?: any }) => {
    if (result.action === "close") {
      setShowModal(false);
      setMasterData([]);
    } else if (result.action === "select" && result.data) {
      setShowModal(false);
      setMasterData([]);
      handleAddToCart(result.data);
    }
  };

  const looseUomInput = (
    <div className="tw:flex tw:items-center tw:gap-1">
      <Input
        type="number"
        min={0}
        value={inputQty}
        onChange={(e) => handleLooseQtyChange(e.target.value)}
        disabled={loading || disabledProp}
        placeholder="Qty"
        className="tw:h-7 tw:w-14 tw:px-1.5 tw:text-xs tw:text-center tw:bg-white tw:border-slate-200 focus:tw:border-primary focus:tw:ring-1 focus:tw:ring-primary/20 tw:rounded-lg tw:font-semibold no-spinner"
      />
      <select
        value={uom}
        onChange={(e) => handleLooseUomChange(e.target.value)}
        disabled={loading || disabledProp}
        className="tw:h-7 tw:rounded-lg tw:border tw:border-slate-200 tw:bg-slate-50 tw:px-1.5 tw:text-xs tw:font-semibold tw:text-slate-600 focus:tw:outline-none focus:tw:border-primary tw:cursor-pointer"
      >
        <option value={selectedStockUom}>{selectedStockUom}</option>
        <option value={altUom}>{altUom}</option>
      </select>
    </div>
  );

  return (
    <>
      {template === 1 && (
        <AppButton
          onClick={() => onAddToCart("incr")}
          disabled={loading || disabledProp}
          size="small"
          color="success"
          fill="solid"
          className="tw:min-w-8 tw:h-8 tw:p-0"
        >
          {loading ? (
            <span className="tw:text-white tw:text-lg tw:flex tw:items-center tw:justify-center">
              <Loader2 size={16} className="tw:animate-spin" />
            </span>
          ) : (
            <span className="tw:text-white tw:text-lg">
              <Plus />
            </span>
          )}
        </AppButton>
      )}

      {template === 2 && isLooseUom && looseUomInput}

      {template === 2 && !isLooseUom && (
        <div className="tw:flex tw:items-center tw:bg-slate-100/80 tw:border tw:border-slate-200/50 tw:rounded-lg tw:p-0.5 tw:h-7">
          <button
            type="button"
            onClick={() => onAddToCart("decr", Math.max(1, qty - 1))}
            disabled={qty <= 1 || loading}
            className="tw:h-5 tw:w-5 tw:flex tw:items-center tw:justify-center tw:text-slate-500 hover:tw:text-slate-800 disabled:tw:opacity-40 tw:rounded-md tw:transition-colors tw:cursor-pointer"
          >
            {loading && activeAction === "decr" ? (
              <Loader2 size={12} className="tw:animate-spin" />
            ) : (
              <Minus size={12} />
            )}
          </button>
          <button
            type="button"
            onClick={onQtyTap}
            disabled={loading || disabledProp}
            title="Click to view/change batch details"
            className="tw:mx-1 tw:px-1.5 tw:h-5 tw:text-xs tw:font-bold tw:text-slate-800 hover:tw:text-primary tw:bg-white tw:border tw:border-slate-200/60 tw:rounded tw:transition-colors tw:cursor-pointer tw:flex tw:items-center tw:gap-1"
          >
            <span>{qty}</span>
            <Pencil size={8} className="tw:text-slate-400 hover:tw:text-primary" />
          </button>
          <button
            type="button"
            onClick={() => onAddToCart("incr", qty + 1)}
            disabled={
              loading ||
              (typeof maxQty === "number" && maxQty > 0 && qty >= maxQty)
            }
            className="tw:h-5 tw:w-5 tw:flex tw:items-center tw:justify-center tw:text-slate-500 hover:tw:text-slate-800 disabled:tw:opacity-40 tw:rounded-md tw:transition-colors tw:cursor-pointer"
          >
            {loading && activeAction === "incr" ? (
              <Loader2 size={12} className="tw:animate-spin" />
            ) : (
              <Plus size={12} />
            )}
          </button>
        </div>
      )}

      {showModal && (
        <ChooseSanpshotModal
          show={showModal}
          masterData={masterData}
          loading={loading}
          callback={handleModalCallback}
          minMrp={
            customerType !== "b2b" &&
            typeof overridePrice === "number" &&
            purchasePrice
              ? purchasePrice
              : undefined
          }
          selectedStockUom={deal?.selectedStockUom}
        />
      )}
    </>
  );
};

export default PosAddToCart;
