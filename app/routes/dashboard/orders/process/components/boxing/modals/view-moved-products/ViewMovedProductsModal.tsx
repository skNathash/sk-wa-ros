import { produce } from "immer";
import { Box, Copy, Package, Trash, Layers } from "lucide-react";
import React, { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import SellerService from "~/services/SellerService";
import { getData } from "./helper";

interface CallbackArg {
  action: string;
  data?: any;
}

interface ViewMovedProductsModalProps {
  show: boolean;
  callback: (arg: CallbackArg) => void;
  boxId: string;
}

const ViewMovedProductsModal: React.FC<ViewMovedProductsModalProps> = ({
  show,
  callback,
  boxId,
}) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [box, setBox] = useState<any>(null);
  const [productCount, setProductCount] = useState<number>(0);
  const [unitCount, setUnitCount] = useState<number>(0);
  const toast = useAppToast();

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleCopyBoxId = () => {
    const pkgId = box?.packageRefNo || "";
    try {
      CommonService.copyToClipboard(String(pkgId));
      toast.show({ msg: "Box ID copied", color: "success" });
    } catch (e) {
      toast.show({ msg: "Unable to copy", color: "error" });
    }
  };

  useEffect(() => {
    if (!show || !boxId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getData(boxId);
        if (!mounted) return;
        setItems(res.items || []);
        setBox(res.box || null);
      } catch (e) {
        console.error("ViewMovedProductsModal - load error", e);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [show, boxId]);

  useEffect(() => {
    // compute distinct products and total units
    if (!items || items.length === 0) {
      setProductCount(0);
      setUnitCount(0);
      return;
    }

    const distinct = items.length;
    // items carry totalQty; sum across all mps quantities if available otherwise use totalQty
    let units = 0;
    for (const p of items) {
      if (p.totalQty != null) {
        units += Number(p.totalQty) || 0;
      } else if (p.mps && p.mps.length > 0) {
        for (const m of p.mps) {
          units += Number(m.quantity) || 0;
        }
      }
    }

    setProductCount(distinct);
    setUnitCount(units);
  }, [items]);

  const handleRemove = async (dealId: string) => {
    if (!box?._id) {
      toast.show({ msg: "Box id missing", color: "error" });
      return;
    }

    const pkgId = box?._id;

    setItems(
      produce((draft) => {
        const index = draft.findIndex((i) => i.dealId === dealId);
        if (index !== -1) {
          draft[index].isRemoving = true;
        }
      })
    );

    try {
      const resp = await SellerService.removeBoxItem(String(pkgId), dealId);
      if (resp?.statusCode === 200) {
        toast.show({ msg: "Item removed", color: "success" });
        const res = await getData(String(pkgId));
        setItems(res.items || []);
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to remove item",
          color: "error",
        });
      }
    } catch (e: any) {
      console.error("remove error", e);
      toast.show({ msg: e?.message || "Error removing item", color: "error" });
    } finally {
      setItems(
        produce((draft) => {
          const index = draft.findIndex((i) => i.dealId === dealId);
          if (index !== -1) {
            draft[index].isRemoving = false;
          }
        })
      );
    }
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold tw:text-gray-900">View Box Items</div>
      </AppModal.Title>

      <AppModal.Content className="tw:h-[90vh]">
        {loading ? (
          <div className="tw:py-10 tw:flex tw:justify-center tw:text-gray-500">
            Loading...
          </div>
        ) : (
          <div className="tw:space-y-3">
            {/* Box details header & Summary */}
            <div className="tw:bg-blue-50/50 tw:border tw:border-blue-100 tw:rounded-lg tw:p-3 tw:mb-3">
              <div className="tw:flex tw:items-start tw:justify-between tw:gap-3 tw:mb-3">
                <div className="tw:flex tw:items-center tw:gap-3 tw:min-w-0">
                  <div className="tw:bg-blue-100 tw:text-blue-600 tw:p-2 tw:rounded-lg tw:shrink-0">
                    <Box className="tw:w-4 tw:h-4" />
                  </div>
                  <div className="tw:flex tw:flex-col tw:min-w-0">
                    <span className="tw:text-xs tw:text-blue-600 tw:font-medium">
                      Box Details
                    </span>
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <span className="tw:text-sm tw:font-bold tw:text-gray-900 tw:truncate">
                        #{box?.packageRefNo}
                      </span>
                      {box?.name && (
                        <span className="tw:text-sm tw:text-gray-500 tw:truncate tw:border-l tw:border-blue-200 tw:pl-2">
                          {box.name}
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

              <div className="tw:flex tw:items-center tw:bg-white tw:rounded-md tw:border tw:border-blue-100 tw:px-3 tw:py-2">
                <div className="tw:flex-1 tw:flex tw:items-center tw:gap-2">
                  <span className="tw:text-xs tw:text-gray-500">Products</span>
                  <span className="tw:text-sm tw:font-bold tw:text-gray-900">
                    {productCount}
                  </span>
                </div>
                <div className="tw:w-px tw:h-4 tw:bg-gray-200 tw:mx-2"></div>
                <div className="tw:flex-1 tw:flex tw:items-center tw:justify-end tw:gap-2">
                  <span className="tw:text-xs tw:text-gray-500">
                    Total Units
                  </span>
                  <span className="tw:text-sm tw:font-bold tw:text-gray-900">
                    {unitCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="tw:space-y-1">
              <div className="tw:flex tw:items-center tw:gap-2">
                <div className="tw:bg-gray-100 tw:rounded-md tw:p-1">
                  <Layers className="tw:w-4 tw:h-4 tw:text-gray-600" />
                </div>
                <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                  Items in Box
                </div>
              </div>

              {items.length === 0 ? (
                <NoData />
              ) : (
                <>
                  {items.map((p) => (
                    <AppCard
                      key={p.dealId}
                      noPadding
                      className="tw:overflow-hidden tw:mb-3 last:tw:mb-0"
                      noShadow
                    >
                      <div className="tw:flex tw:items-start tw:gap-3 tw:p-3">
                        <div className="tw:shrink-0">
                          {p.raw?.images && p.raw.images.length > 0 ? (
                            <ImgRender
                              assetId={p.raw.images[0]}
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
                          <div className="tw:flex tw:items-start tw:justify-between tw:gap-2 tw:mb-1">
                            <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:line-clamp-2">
                              {p.dealName}
                            </div>
                            <button
                              onClick={() => handleRemove(p.dealId)}
                              className="tw:shrink-0 tw:text-red-400 hover:tw:text-red-500 tw:p-1 tw:rounded-md hover:tw:bg-red-50 tw:transition-colors"
                              title="Remove product"
                              disabled={p.isRemoving}
                            >
                              {p.isRemoving ? (
                                <AppSpinner />
                              ) : (
                                <Trash className="tw:w-4 tw:h-4" />
                              )}
                            </button>
                          </div>

                          <div className="tw:flex tw:items-center tw:justify-between tw:bg-gray-50 tw:rounded tw:px-2 tw:py-1 tw:mb-2">
                            <span className="tw:text-xs tw:text-gray-500">
                              Total Quantity
                            </span>
                            <span className="tw:text-xs tw:font-bold tw:text-gray-900">
                              {p.displaySummary || `${p.totalQty} Units`}
                            </span>
                          </div>

                          {p.mps && p.mps.length > 0 && (
                            <div className="tw:space-y-1">
                              {p.mps.map((m: any, idx: number) => (
                                <div
                                  key={`${p.dealId}-mrp-${m.mrp}-${idx}`}
                                  className="tw:flex tw:items-center tw:justify-between tw:text-xs tw:text-gray-600 tw:border-b tw:border-dashed tw:border-gray-100 last:tw:border-0 tw:pb-1 last:tw:pb-0"
                                >
                                  <div className="tw:flex tw:items-center tw:gap-1">
                                    <span>MRP</span>
                                    <span className="tw:font-medium text-gray-900">
                                      <Amount
                                        value={Number(m.mrp) || 0}
                                        decimalPlaces={2}
                                      />
                                    </span>
                                  </div>
                                  <span className="tw:font-medium">
                                    {m.quantity} Units
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </AppCard>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default ViewMovedProductsModal;
