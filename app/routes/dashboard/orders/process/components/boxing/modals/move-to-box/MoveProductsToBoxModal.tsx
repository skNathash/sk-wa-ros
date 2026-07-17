import { produce } from "immer";
import { Box, Copy, Minus, Package, Plus } from "lucide-react";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import React, { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import SellerService from "~/services/SellerService";
import { getData } from "./helper";
import NoData from "~/components/core/no-data/NoData";

interface CallbackArg {
  action: string;
  data?: any;
}

interface MoveProductsToBoxModalProps {
  show: boolean;
  callback: (arg: CallbackArg) => void;
  toBox?: any;
  orderId: string;
}

interface ProductView {
  dealId: string;
  dealName?: string;
  totalQty: number;
  remainingQty: number;
  quantity?: number;
  mrps: Array<{
    mrp: number;
    quantity: number;
    displayQuantity: number;
    snapshots?: any[];
    enteredQty?: number | string;
  }>;
  images?: string[];
  raw?: any;
  pickingId?: string;
}

const MoveProductsToBoxModal: React.FC<MoveProductsToBoxModalProps> = ({
  show,
  callback,
  toBox,
  orderId,
}) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductView[]>([]);

  const toast = useAppToast();

  const isLooseUom = (uom?: string) => {
    const u = String(uom || "").toLowerCase().trim();
    return ["gm", "g", "kg", "ml", "l", "ltr"].includes(u);
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleCopyBoxId = () => {
    const pkgId = toBox?.packageRefNo || "";
    try {
      CommonService.copyToClipboard(String(pkgId));
      toast.show({ msg: "Box ID copied", color: "success" });
    } catch (e) {
      toast.show({ msg: "Unable to copy", color: "error" });
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!show || !orderId) return;

      setLoading(true);

      const res = await getData(orderId);

      // ensure each mrp has an enteredQty key (default 1)
      const items = (res.items || []).map((it: any) => ({
        ...it,
        mrps: (it.mrps || []).map((m: any) => ({
          ...m,
          enteredQty: Math.min(
            m.enteredQty ?? (m.quantity || 0),
            m.quantity || 0
          ),
        })),
      }));

      setProducts(items);
      setLoading(false);
    };

    load();
  }, [show, orderId, toBox]);

  const handleMrpQtyChange = (
    dealId: string,
    mrpIndex: number,
    value: number | string
  ) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.dealId !== dealId) return prod;
        const mrps = (prod.mrps || []).map((m, idx) => {
          if (idx !== mrpIndex) return m;
          const max = m.quantity || 0;
          if (value === "") {
            return { ...m, enteredQty: "" };
          }
          let v = Number(value);
          if (v < 0) v = 0;
          if (v > max) v = max;
          return { ...m, enteredQty: v, displayQuantity: max - v };
        });
        return { ...prod, mrps };
      })
    );
  };

  const handleMove = async (prodIndex: number, mrpIndex: number) => {
    const prod = products[prodIndex];
    if (!prod) {
      toast.show({ msg: "Product not found", color: "error" });
      return;
    }

    const m = (prod.mrps || [])[mrpIndex];
    if (!m) {
      toast.show({ msg: "MRP not found", color: "error" });
      return;
    }

    const entered = isLooseUom((m as any).uom)
      ? Number(m.quantity ?? 0)
      : Number(m.enteredQty ?? 0);
    if (!toBox?._id) {
      toast.show({ msg: "No box selected", color: "error" });
      return;
    }

    if (entered <= 0) {
      toast.show({ msg: "Quantity must be greater than 0", color: "error" });
      return;
    }

    let remaining = entered;
    const snaps: any[] = [];
    (m.snapshots || []).forEach((s: any) => {
      if (remaining <= 0) return;
      const avail = Number(s.quantity ?? 0) || 0;
      if (avail <= 0) return;
      const use = Math.min(avail, remaining);
      snaps.push({
        dealId: prod.dealId,
        qty: use,
        mrp: s.mrp ?? m.mrp,
        snapshotId: s.snapshotId || s._id || s.id,
      });
      remaining -= use;
    });

    if (snaps.length === 0) {
      toast.show({ msg: "No snapshots available to move", color: "error" });
      return;
    }

    const pickingId = prod.pickingId;

    const payload: any = { items: snaps };
    if (pickingId) payload.pickingId = pickingId;

    try {
      const resp = await SellerService.saveBox(toBox._id, payload);
      if (resp?.statusCode === 200) {
        toast.show({
          msg: `Moved ${entered} item(s) to ${
            toBox.displayBoxName || toBox.packageRefNo
          }`,
          color: "success",
        });

        setProducts(
          produce((draft) => {
            draft[prodIndex].mrps[mrpIndex].enteredQty = "";
            draft[prodIndex].mrps[mrpIndex].quantity -= entered;
          })
        );
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to add item to box",
          color: "error",
        });
      }
    } catch (err: any) {
      console.error("Error saving box item:", err);
      toast.show({
        msg: err?.message || "Error while moving item",
        color: "error",
      });
    }
  };

  const handleMoveAll = async () => {
    if (!toBox?._id) {
      toast.show({ msg: "No box selected", color: "error" });
      return;
    }

    const headers: { pickingId?: string; items: any[] }[] = [];

    const getHeader = (pId?: string) => {
      let h = headers.find((x) => x.pickingId === pId);
      if (!h) {
        h = { pickingId: pId, items: [] };
        headers.push(h);
      }
      return h;
    };

    let totalMoving = 0;

    products.forEach((p) => {
      (p.mrps || []).forEach((m) => {
        const avail = m.quantity || 0;
        if (avail <= 0) return;

        let remaining = avail; // Move all available

        (m.snapshots || []).forEach((s: any) => {
          if (remaining <= 0) return;
          const sQty = Number(s.quantity ?? 0) || 0;
          if (sQty <= 0) return;

          const use = Math.min(sQty, remaining);

          const header = getHeader(p.pickingId);
          header.items.push({
            dealId: p.dealId,
            qty: use,
            mrp: s.mrp ?? m.mrp,
            snapshotId: s.snapshotId || s._id || s.id,
          });

          remaining -= use;
          totalMoving += use;
        });
      });
    });

    if (totalMoving === 0 || headers.length === 0) {
      toast.show({ msg: "No products available to move", color: "error" });
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      for (const h of headers) {
        const payload: any = { items: h.items };
        if (h.pickingId) payload.pickingId = h.pickingId;

        const resp = await SellerService.saveBox(toBox._id, payload);
        if (resp?.statusCode === 200) {
          successCount += h.items.reduce(
            (acc: number, i: any) => acc + i.qty,
            0
          );
        }
      }

      if (successCount > 0) {
        toast.show({
          msg: `Successfully moved ${successCount} products`,
          color: "success",
        });
        // Refresh the modal content
        const res = await getData(orderId);
        const items = (res.items || []).map((it: any) => ({
          ...it,
          mrps: (it.mrps || []).map((m: any) => ({
            ...m,
            enteredQty: Math.min(
              m.enteredQty ?? (m.quantity || 0),
              m.quantity || 0
            ),
          })),
        }));

        setProducts(items);
        handleClose();
      } else {
        toast.show({ msg: "Failed to move products", color: "error" });
      }
    } catch (err: any) {
      console.error(err);
      toast.show({
        msg: err.message || "Error moving all products",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const pendingUnits = products.reduce((acc, p) => {
    const prodTotal = p.mrps.reduce((accM, m) => {
      const qty = m.quantity || 0;
      return accM + qty;
    }, 0);
    return acc + prodTotal;
  }, 0);

  const pendingDisplay =
    CommonService.groupQtyByUom(
      products.flatMap((p) =>
        (p.mrps || []).map((m) => ({
          uom: (m as any).uom || (p as any).uom || "unit",
          qty: m.quantity || 0,
        })),
      ),
    ).label || "0 units";

  return (
    <AppModal
      show={show}
      callback={handleClose}
      backdropDismiss={true}
      className="tw:h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold">Move To Box</div>
      </AppModal.Title>

      <AppModal.Content className="tw:h-[90vh]">
        {loading ? (
          <div className="tw:py-10 tw:flex tw:justify-center tw:text-gray-500">
            Loading...
          </div>
        ) : (
          <div className="tw:space-y-3">
            {/* Box details header */}
            <div className="tw:bg-blue-50/50 tw:border tw:border-blue-100 tw:rounded-lg tw:p-3 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:mb-2">
              <div className="tw:flex tw:items-center tw:gap-3 tw:min-w-0">
                <div className="tw:bg-blue-100 tw:text-blue-600 tw:p-2 tw:rounded-lg tw:shrink-0">
                  <Box className="tw:w-4 tw:h-4" />
                </div>
                <div className="tw:flex tw:flex-col tw:min-w-0">
                  <span className="tw:text-xs tw:text-blue-600 tw:font-medium">
                    Moving to Box
                  </span>
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:text-sm tw:font-bold tw:text-gray-900 tw:truncate">
                      #{toBox?.packageRefNo}
                    </span>
                    {toBox?.name && (
                      <span className="tw:text-sm tw:text-gray-500 tw:truncate tw:border-l tw:border-blue-200 tw:pl-2">
                        {toBox.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleCopyBoxId}
                className="tw:p-2 tw:text-gray-400 hover:tw:text-blue-600 hover:tw:bg-blue-100 tw:rounded-md tw:transition-colors"
                title="Copy Box ID"
              >
                <Copy className="tw:w-4 tw:h-4" />
              </button>
            </div>
            {products.length === 0 ? (
              <NoData title="No products available" />
            ) : (
              products.map((p, pIndex) => (
                <AppCard
                  key={p.dealId}
                  noPadding
                  className="tw:overflow-hidden"
                  noShadow={true}
                >
                  <div className="tw:flex tw:gap-3 tw:p-3">
                    <div className="tw:shrink-0">
                      {p.images && p.images.length > 0 ? (
                        <ImgRender
                          assetId={p.images[0]}
                          alt={p.dealName}
                          className="tw:h-12 tw:w-12 tw:object-cover tw:rounded-md tw:border tw:border-gray-100"
                        />
                      ) : (
                        <div className="tw:h-12 tw:w-12 tw:flex tw:items-center tw:justify-center tw:bg-gray-100 tw:rounded-md">
                          <Package className="tw:text-gray-400 tw:w-6 tw:h-6" />
                        </div>
                      )}
                    </div>

                    <div className="tw:flex-1 tw:min-w-0">
                      <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:line-clamp-2 tw:mb-1">
                        {p.dealName}
                      </div>
                      <AppBadge
                        variant="success"
                        className="tw:shrink-0 tw:border tw:border-gray-200"
                      >
                        {(p as any).displaySummary ||
                          `${p.remainingQty} units`}
                      </AppBadge>
                    </div>
                  </div>

                  {/* MRPs list */}
                  {p.mrps && p.mrps.length > 0 && (
                    <div className="tw:bg-gray-50 tw:border-t tw:border-gray-100 tw:p-2 tw:space-y-2">
                      {p.mrps.map((m, idx) => (
                        <div
                          key={`${p.dealId}-mrp-${m.mrp}-${idx}`}
                          className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:bg-white tw:rounded tw:border tw:border-gray-200 tw:px-2 tw:py-1.5"
                        >
                          <div className="tw:flex tw:flex-col">
                            <div className="tw:text-sm tw:font-bold tw:text-gray-800">
                              <span className="tw:text-xs tw:font-medium tw:text-gray-500 tw:mr-1">
                                MRP
                              </span>
                              <Amount
                                value={Number(m.mrp) || 0}
                                decimalPlaces={2}
                              />
                            </div>
                            {!isLooseUom((m as any).uom) && (
                              <div className="tw:text-[10px] tw:text-gray-500 tw:font-medium">
                                {CommonService.groupQtyByUom([
                                  {
                                    uom: (m as any).uom || "unit",
                                    qty: m.displayQuantity || 0,
                                  },
                                ]).label || "0 units"}{" "}
                                available
                              </div>
                            )}
                          </div>

                          <div className="tw:flex tw:items-center tw:gap-2">
                            {isLooseUom((m as any).uom) ? (
                              <div className="tw:px-2 tw:py-1 tw:text-sm tw:font-semibold tw:text-gray-800 tw:border tw:border-gray-200 tw:rounded tw:bg-gray-50">
                                <DisplayQty
                                  qty={m.quantity || 0}
                                  isLooseQty={false}
                                  noConv={false}
                                  uom={(m as any).uom}
                                />
                              </div>
                            ) : (
                              <div className="tw:flex tw:items-center tw:border tw:border-gray-300 tw:rounded">
                                <button
                                  className="tw:h-8 tw:w-8 tw:flex tw:items-center tw:justify-center tw:text-gray-600 hover:tw:bg-gray-100 disabled:tw:opacity-50"
                                  disabled={
                                    (m.enteredQty ? Number(m.enteredQty) : 0) <=
                                    0
                                  }
                                  onClick={() => {
                                    const current = Number(m.enteredQty || 0);
                                    handleMrpQtyChange(
                                      p.dealId,
                                      idx,
                                      Math.max(0, current - 1)
                                    );
                                  }}
                                >
                                  <Minus className="tw:w-3 tw:h-3" />
                                </button>
                                <input
                                  type="number"
                                  className="tw:w-12 tw:h-8 tw:text-center tw:border-x tw:border-gray-300 tw:text-sm focus:tw:ring-0 focus:tw:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  min={0}
                                  max={m.quantity || 0}
                                  value={m.enteredQty ?? ""}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleMrpQtyChange(
                                      p.dealId,
                                      idx,
                                      e.target.value
                                    )
                                  }
                                  disabled={(m.quantity || 0) <= 0}
                                />
                                <button
                                  className="tw:h-8 tw:w-8 tw:flex tw:items-center tw:justify-center tw:text-gray-600 hover:tw:bg-gray-100 disabled:tw:opacity-50"
                                  disabled={
                                    (m.enteredQty ? Number(m.enteredQty) : 0) >=
                                    (m.quantity || 0)
                                  }
                                  onClick={() => {
                                    const current = Number(m.enteredQty || 0);
                                    handleMrpQtyChange(
                                      p.dealId,
                                      idx,
                                      Math.min(m.quantity || 0, current + 1)
                                    );
                                  }}
                                >
                                  <Plus className="tw:w-3 tw:h-3" />
                                </button>
                              </div>
                            )}

                            {/* Move Action Button */}
                            <AppButton
                              size="small"
                              color="primary"
                              onClick={() => handleMove(pIndex, idx)}
                              disabled={
                                isLooseUom((m as any).uom)
                                  ? !(m.quantity > 0)
                                  : !m.enteredQty || Number(m.enteredQty) <= 0
                              }
                            >
                              Move
                            </AppButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AppCard>
              ))
            )}
          </div>
        )}
      </AppModal.Content>

      {products?.length > 0 ? (
        <AppModal.Footer>
          <div className="tw:w-full tw:flex tw:justify-between tw:gap-3">
            <div>
              {pendingUnits ? (
                <AppButton
                  onClick={handleMoveAll}
                  disabled={loading || products.length === 0}
                  color="success"
                  className="tw:w-full"
                  fill="outline"
                >
                  Move All Products ({pendingDisplay})
                </AppButton>
              ) : null}
            </div>
            <div>
              <AppButton
                onClick={handleClose}
                disabled={loading || products.length === 0}
                className="tw:w-full"
              >
                Done
              </AppButton>
            </div>
          </div>
        </AppModal.Footer>
      ) : null}
    </AppModal>
  );
};

export default MoveProductsToBoxModal;
