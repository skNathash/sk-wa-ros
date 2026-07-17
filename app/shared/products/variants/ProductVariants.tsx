import { produce } from "immer";
import { useCallback, useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AddToCart from "~/components/feature/products/add-to-cart/AddToCart";
import { PRD_IMG_RESOLUTION } from "~/constants";
import { AuthService } from "~/services/AuthService";
import SellerCatalogService from "~/services/SellerCatalogService";
// Discount badge rendered inline over images

type Props = {
  dealId: string;
  cartType?: "normal" | "buyer";
  sellerId?: string;
};

const ProductVariants = ({ dealId, cartType, sellerId }: Props) => {
  const finalCartType =
    cartType || (AuthService.isBuyerUser() ? "buyer" : "normal");
  const [loading, setLoading] = useState(false);

  const [deals, setDeals] = useState<Array<any>>([]);

  const [title, setTitle] = useState("");

  const init = useCallback(async () => {
    if (!dealId) {
      setLoading(false);
      setDeals([]);
      return;
    }

    setLoading(true);
    setDeals([]);

    let params: Record<string, any> = {
      filter: { dealId: dealId },
      parent: true,
    };

    if (sellerId) {
      params.sellerId = sellerId;
    }

    // fetch the current deal details
    const r = await SellerCatalogService.getProducts(params);

    const d = r.data?.data?.[0] || {};

    const deal: Record<string, any> = d?._id
      ? SellerCatalogService.formatProductResponse([d], {
          view: "buyer",
        })?.[0]
      : {};

    setTitle(deal?.name);

    // collect all variants deal ids
    const groupDeals = deal?.groupDeals || [];

    const ids: Array<string> = [];

    groupDeals.forEach((x: any) => {
      x.values.forEach((e: any) => {
        ids.push(e._id);
      });
    });

    if (!ids.length) {
      setLoading(false);
      setDeals([]);
      return;
    }

    // fetching the variants deal data
    const p: Record<string, any> = {
      filter: {
        dealId: {
          $in: ids,
        },
      },
    };

    if (sellerId) {
      p.sellerId = sellerId;
    }

    const varDealsResp = await SellerCatalogService.getProducts({
      ...p,
      parent: true,
    });

    const t = Array.isArray(varDealsResp.data?.data)
      ? SellerCatalogService.formatProductResponse(varDealsResp.data?.data, {
          view: "buyer",
        })
      : [];
    // t.unshift({ ...d, variants: [] });

    const varDeals = t.map((x) => ({
      ...x,
      _ignoreGroupDeals: true,
    }));

    // Attach CSA value to each variant by matching group deal _id
    const varDealsWithCsa = varDeals.map((vd) => {
      let matchedCsa = "";
      (groupDeals || []).forEach((g: any) => {
        const found = (g.values || []).find(
          (v: any) => String(v._id) === String(vd._id),
        );
        if (found && found.csa) {
          matchedCsa = found.csa;
        }
      });
      return {
        ...(vd as any),
        csa: matchedCsa || (vd as any).csa || undefined,
      };
    });

    const inStock: Array<any> = [];
    const outOfStock: Array<any> = [];

    varDealsWithCsa.forEach((item: any) => {
      const isOos = !!item.isOutOfStock || (item.stock === 0 && !item.maxQty);
      if (isOos) outOfStock.push(item);
      else inStock.push(item);
    });

    let updateDeals = [...inStock, ...outOfStock];
    if (sellerId) {
      updateDeals = updateDeals.map((item) => ({
        ...item,
        buyFromOtherRetailer: {
          retailerId: sellerId,
          status: true,
        },
      }));
    }

    setDeals(updateDeals);
    setLoading(false);
  }, [dealId, sellerId]);

  useEffect(() => {
    init();
  }, [init]);

  // Cart state is now updated via the AddToCart callback (`cartCb`)
  // so we no longer listen to global cart events here.

  const cartCb = (response: any) => {
    const action = response?.action;
    const payload = response?.data || {};
    const inner = payload.data || {};
    const id = inner.dealId;

    if (!id) return;

    const index = deals.findIndex((x) => String(x._id) === String(id));
    if (index === -1) return;

    if (action === "add") {
      const qty = inner.quantity || 0;
      setDeals(
        produce((draft) => {
          draft[index]._qty = qty;
          draft[index].inCart = { status: true, qty };
        }),
      );
    } else if (action === "update") {
      const qty = inner.quantity || 0;
      setDeals(
        produce((draft) => {
          draft[index]._qty = qty;
          draft[index].inCart = { status: qty > 0, qty };
        }),
      );
    } else if (action === "remove") {
      setDeals(
        produce((draft) => {
          draft[index]._qty = 0;
          draft[index].inCart = { status: false, qty: 0 };
        }),
      );
    }
  };

  return (
    <>
      <div className="tw:py-3 tw:border-b tw:border-app-gray-2 tw:flex tw:items-center tw:gap-3 tw:mb-4">
        <div className="tw:flex-none tw:w-12 tw:h-12 tw:rounded tw:overflow-hidden tw:bg-gray-50 tw:flex tw:items-center tw:justify-center">
          {deals[0]?.images && deals[0].images.length ? (
            <ImgRender
              assetId={deals[0].images[0]}
              alt={title}
              className="tw:w-full tw:h-full tw:object-contain"
              size={PRD_IMG_RESOLUTION}
            />
          ) : (
            <div className="tw:text-gray-400">📦</div>
          )}
        </div>

        <div className="tw:flex-1 tw:min-w-0">
          <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
            {title || "Product"}
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
            {deals.length} variant{deals.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="tw:py-6 tw:flex tw:items-center tw:justify-center">
          <AppSpinner />
        </div>
      ) : null}

      {/* Total product count (aligned with list padding) */}
      <div className="tw:pb-1 tw:text-xs tw:text-gray-600">
        Total products: <span className="tw-font-semibold">{deals.length}</span>
      </div>

      <div className="tw:space-y-1">
        {deals.map((x) => {
          const added = !!x.inCart?.status;
          const bgClass = x.isOutOfStock
            ? "tw:bg-red-50 tw:border-red-200"
            : added
              ? "tw:bg-yellow-50 tw:border-yellow-400"
              : "tw:bg-gray-50 tw:border-gray-200";

          return (
            <div
              key={x._id}
              className={`tw:rounded tw:p-2 tw:flex tw:items-center tw:gap-3 tw:border ${bgClass} ${
                x.isOutOfStock ? "tw:opacity-60" : ""
              }`}
            >
              {/* Image first (left) */}
              <div className="tw:flex-none">
                <div className="tw:relative tw:w-16 tw:h-16 tw:flex tw:items-center tw:justify-center tw:overflow-hidden tw:rounded">
                  {x?.images && x.images.length ? (
                    <>
                      <ImgRender
                        assetId={x.images[0]}
                        alt={x.name}
                        className={`tw:w-full tw:h-full tw:object-contain ${
                          x.isOutOfStock ? "tw:opacity-40" : ""
                        }`}
                        size={PRD_IMG_RESOLUTION}
                      />

                      {x.discount > 0 && (x.displayPrice || x.mrp) !== x.mrp ? (
                        <div className="tw:absolute tw:top-0 tw:left-0 tw:bg-red-600 tw:text-white tw:text-[11px] tw:font-semibold tw:px-1 tw:py-0.5 tw:rounded-br">
                          {x.discount}%
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div
                      className={`tw:w-16 tw:h-16 tw:flex tw:items-center tw:justify-center tw:bg-gray-100 ${
                        x.isOutOfStock ? "tw:opacity-40" : ""
                      }`}
                    >
                      <div className="tw:text-gray-400">📦</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle: CSA, then price + MRP row (with optional weight) */}
              <div className="tw:flex-1 tw:min-w-0 tw:flex tw:flex-col tw:gap-1">
                <div
                  className={`tw:text-sm tw:font-medium tw:text-gray-900 tw:leading-5 tw:line-clamp-2 ${
                    x.isOutOfStock ? "tw:opacity-60" : ""
                  }`}
                >
                  {x?.csa || x?.name}
                </div>

                {x.netWeight && (
                  <div className="tw:text-xs tw:text-gray-500">
                    {x.netWeight}
                  </div>
                )}

                {/* Price + MRP on same line */}
                <div className="tw:flex tw:items-center tw:gap-2">
                  {x.isFree ? (
                    <span className="tw:text-sm tw:font-semibold tw:text-green-600">
                      FREE
                    </span>
                  ) : (
                    <Amount
                      value={x.displayPrice || x.mrp}
                      className="tw:text-sm tw:font-semibold tw:text-green-600"
                      showSymbol={true}
                      decimalPlaces={2}
                    />
                  )}

                  {x.discount > 0 && (x.displayPrice || x.mrp) !== x.mrp ? (
                    <span className="tw:text-[11px] tw:text-gray-400 tw:line-clamp-1">
                      <span className="tw:line-through">
                        <Amount value={x.mrp} decimalPlaces={2} />
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Right: Add to cart, then stock (column) */}
              <div className="tw:flex-none tw:flex tw:flex-col tw:items-end tw:gap-1">
                <div className="tw:flex tw:items-center tw:justify-end">
                  {!x.isOutOfStock ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <AddToCart
                        deal={x}
                        callback={cartCb}
                        cartType={finalCartType}
                      />
                    </div>
                  ) : (
                    <span className="tw:text-sm tw:text-red-700 tw:font-semibold">
                      Out of stock
                    </span>
                  )}
                </div>

                {x.stock !== undefined ? (
                  <div className="tw:text-xs tw:text-gray-700">
                    Stock: {x.stock}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ProductVariants;
