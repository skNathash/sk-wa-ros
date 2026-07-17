import { useCallback, useEffect, useState } from "react";
import { orderBy } from "lodash";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppTab from "~/components/core/tab/AppTab";
import AppButton from "~/components/core/button/AppButton";
import { ShoppingBagIcon } from "lucide-react";
import {
  CART_ITEM_ADDED,
  CART_ITEM_REMOVED,
  DEFAULT_BROWSE_DISTANCE,
} from "~/constants";
import AuthService from "~/services/AuthService";
import CartService from "~/services/CartService";
import SellerCatalogService from "~/services/SellerCatalogService";
import ProductService from "~/services/ProductService";
import type { Deal, SellersArrayItem, TabItem } from "~/types/CommonTypes";
import Sellers from "./components/Sellers";
import SimilarDeals from "./components/similar-deals/SimilarDeals";
import useAppNav from "~/hooks/useAppNav";
import { useSearchParams } from "react-router";
import AppSwiper from "~/components/core/swiper";
import type { SwiperOptions } from "swiper/types";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import CommonService from "~/services/CommonService";
import AddToCartActionHandler from "~/shared/products/add-to-cart-action-handler/AddToCartActionHandler";
import { AppCheckbox } from "~/components/core/form";

const swiperConfig: SwiperOptions = {
  slidesPerView: 1,
  spaceBetween: 10,
  autoplay: {
    delay: 2500,
    disableOnInteraction: false,
  },
};

type Props = {
  show: boolean;
  dealId: string;
  callback: (a: { action: string; data?: any }) => void;
  distance?: number;
  type?: string;
};

const defaultTabs: TabItem[] = [
  { key: "sellers", name: "Available Sellers" },
  {
    key: "details",
    name: "Product Details",
  },
  { key: "similar", name: "Similar Deals" },
];

const SellerListModal = ({
  show,
  dealId,
  callback,
  distance = DEFAULT_BROWSE_DISTANCE,
  type,
}: Props) => {
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [silentLoading, setSilentLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [sellers, setSellers] = useState<
    Array<SellersArrayItem & { deal: Deal }>
  >([]);

  const [tabs, setTabs] = useState<TabItem[]>([...defaultTabs]);
  const [activeTab, setActiveTab] = useState<string>(defaultTabs[0].key);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [imgPreviewModal, setImgPreviewModal] = useState<{
    show: boolean;
    images: { id: string }[];
  }>({
    show: false,
    images: [],
  });

  const [slabOnly, setSlabOnly] = useState<boolean>(false);

  const connectedSeller = AuthService.getLinkedSeller();

  const hasSlabSellers = (sellers || []).some(
    (s: any) => s?.priceSlab?.isAvailable && s?.priceSlab?.configId,
  );

  const fetchSkSellerDealStock = async (userId: string) => {
    let skDealsData: Record<string, any> = {};
    const skCartResp = await CartService.fetchCartDetails({
      type: "B2B",
      id: userId,
    });

    const sellers = skCartResp.data?.sellers || [];

    sellers.forEach((seller: any) => {
      if (Array.isArray(seller.deals)) {
        seller.deals.forEach((deal: any) => {
          if (!skDealsData[deal.id]) {
            skDealsData[deal.id] = {
              qty: 0,
            };
          }
          // Only accumulate quantities from SK cart for in-cart counts. Do not derive maxQty from cart here.
          skDealsData[deal.id].qty += deal.quantity || 0;
        });
      }
    });

    return skDealsData;
  };

  const fetchSkDeal = async (dealId: string) => {
    let skDeal = {
      maxQty: 0,
      price: 0,
    };
    const dealResp = await ProductService.getProducts({
      page: 1,
      count: 1,
      filter: { _id: dealId },
    });
    if (Array.isArray(dealResp.data) && dealResp.data.length > 0) {
      const d = dealResp.data[0];
      skDeal.maxQty = Number(d?.maxQty || 0) || 0;
      skDeal.price = Number(d?.price ?? d?.dealPrice ?? 0) || 0;
    }
    return skDeal;
  };

  const sortSellers = (
    sellers: Array<
      SellersArrayItem & {
        deal: Deal;
        qty: number;
        price: any;
        displayPrice: any;
        discountPercentage: number;
      }
    >,
    isSkBuyer: boolean,
    connectedSellerId?: string,
  ): Array<
    SellersArrayItem & {
      deal: Deal;
      qty: number;
      price: any;
      displayPrice: any;
      discountPercentage: number;
    }
  > => {
    if (!sellers || sellers.length === 0) return sellers;

    // Create sorting orders
    const sortOrders: ("asc" | "desc")[] = [];
    const sortPaths: (string | ((item: any) => any))[] = [];

    if (isSkBuyer && connectedSellerId) {
      // For SK buyers: connected seller first (true=1, false=0)
      sortPaths.push((seller) => (seller.isConnectedSeller ? 0 : 1));
      sortOrders.push("asc");
    }

    // SK sellers second
    sortPaths.push((seller) => (seller.isSkSeller ? 0 : 1));
    sortOrders.push("asc");

    // Then sort by price (cheapest first)
    sortPaths.push((seller) => seller.price || Infinity);
    sortOrders.push("asc");

    // Then sort by distance (nearest first)
    sortPaths.push((seller) => seller.distance || Infinity);
    sortOrders.push("asc");

    return orderBy(sellers, sortPaths, sortOrders);
  };

  const attachDealToSellers = (
    sellers: Array<SellersArrayItem & { deal: Deal }>,
    productData: Deal,
    skDealsData: Record<string, any>,
    skDeal?: { maxQty: number; price: number },
  ) => {
    return (sellers || []).map((seller: SellersArrayItem & { deal: Deal }) => {
      // Prefer seller.cartQuantity for non-SK sellers. For SK seller fallback to skDeal.quantity
      const sellerCartQty = seller.cartQuantity || 0;

      let inCartStatus = sellerCartQty > 0;
      let inCartQty = sellerCartQty;

      if (seller.sellingType !== "UNIT") {
        inCartQty = SellerCatalogService.convertUnitsToPackQty(
          inCartQty,
          seller.packageQty || 0,
        );
      }

      if (seller.isSkSeller) {
        const q = skDealsData[productData.id]?.qty || 0;
        inCartStatus = q > 0;
        inCartQty = q;
      }

      // Preserve any seller-provided cartId/itemId if available, otherwise use SK cart values
      const cartId = seller.cartId || "";
      const itemId = seller.itemId || "";

      // For SK sellers, prefer authoritative max stock from ProductService, otherwise fallback to seller.qty
      let computedMaxQty = seller.isSkSeller
        ? (skDeal?.maxQty ?? seller.qty ?? 0)
        : seller.qty || 0;

      const basePrice = seller.isSkSeller
        ? (skDeal?.price ?? seller.price)
        : seller.price;

      // If seller has an active price slab and the item is already in cart,
      // compute price based on slab using the cart quantity. Otherwise use basePrice.
      const slabApplicable =
        seller.priceSlab &&
        seller.priceSlab.isAvailable &&
        seller.priceSlab.configId;
      const effectivePrice =
        slabApplicable && inCartQty > 0
          ? CommonService.getPriceFromSlab(
              seller.priceSlab,
              inCartQty,
              basePrice,
            )
          : basePrice;

      return {
        ...seller,
        qty: computedMaxQty,
        price: effectivePrice,
        displayPrice: effectivePrice,
        discountPercentage: CommonService.calculateDiscount(
          effectivePrice,
          seller.mrp,
        ),
        deal: {
          ...productData,
          inCart: {
            status: inCartStatus,
            qty: inCartQty,
          },
          cartId: cartId,
          itemId: itemId,
          maxQty: computedMaxQty,
          price: effectivePrice,
          displayPrice: effectivePrice,
          discount: CommonService.calculateDiscount(effectivePrice, seller.mrp),
          mrp: seller.mrp,
          buyFromOtherRetailer: {
            retailerId: seller.id,
            status: true,
          },
        },
      };
    });
  };

  const fetchProduct = useCallback(
    async (id: string, silent = false) => {
      if (!id) return;

      if (!silent) {
        setLoading(true);
      } else {
        setSilentLoading(true);
      }

      let skDealsData: Record<string, any> = {};

      try {
        const userId = AuthService.getLoggedInUserId(true);

        const params = {
          filter: { dealId: id },
        };
        let response;
        if (type === "PromotionalDeal") {
          response = await SellerCatalogService.getPromotionalDeal(
            params,
            distance,
          );
        } else {
          response = await SellerCatalogService.getNetworkDeals(
            params,
            distance,
          );
        }
        const data = response.data?.data || [];

        if (data.length > 0) {
          const formatted = SellerCatalogService.formatProductResponse(data, {
            view: "buyer",
          });

          const productData = formatted[0];

          const sellers = (productData.sellers || []).map((seller: any) => {
            return {
              ...seller,
              isConnectedSeller: seller.id === connectedSeller?._id,
            };
          });

          setProduct(productData);

          // Only fetch SK-related data (cart + authoritative deal) when an SK seller exists.
          let skDealForProduct: { maxQty: number; price: number } = {
            maxQty: 0,
            price: 0,
          };
          try {
            const hasSkSeller = (sellers || []).some((s: any) => s.isSkSeller);

            if (userId && hasSkSeller) {
              try {
                skDealsData = await fetchSkSellerDealStock(userId);
              } catch (e) {
                console.warn("Error fetching SK cart data:", e);
                skDealsData = {};
              }
            }

            if (hasSkSeller) {
              skDealForProduct = await fetchSkDeal(productData.id);
            }
          } catch (e) {
            console.warn("Error fetching SK deal/cart data:", e);
            skDealForProduct = { maxQty: 0, price: 0 };
            skDealsData = {};
          }

          let sellersWithDeal = attachDealToSellers(
            sellers,
            productData,
            skDealsData,
            skDealForProduct,
          );

          // Sort sellers: connected seller (if SK buyer) -> SK sellers -> by price (cheapest) -> by distance (nearest)
          try {
            const isSkBuyer = AuthService.isSkBuyer();
            sellersWithDeal = sortSellers(
              sellersWithDeal,
              isSkBuyer,
              connectedSeller?._id,
            );
          } catch (e) {
            // ignore
          }

          setSellers(sellersWithDeal);
          // update cart flag based on fetched sellers' inCart data
          try {
            const has = (sellersWithDeal || []).some(
              (s) =>
                Boolean(s?.deal?.inCart?.status) ||
                (Number(s?.deal?.inCart?.qty) || 0) > 0,
            );
            setHasCartItems(has);
          } catch (e) {
            setHasCartItems(false);
          }

          setTabs((prev) => {
            const tmp = [...prev];
            tmp[0].count = sellersWithDeal.length;
            return tmp;
          });
        } else {
          setProduct(null);
          setSellers([]);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
        setSellers([]);
      } finally {
        if (!silent) setLoading(false);
        else setSilentLoading(false);
      }
    },
    [distance, type, connectedSeller?._id],
  );

  useEffect(() => {
    if (show && dealId) {
      fetchProduct(dealId);
    }
  }, [show, dealId, fetchProduct]);

  // When modal opens ensure sellers tab is active and reset description expansion
  useEffect(() => {
    if (show) {
      setActiveTab(defaultTabs[0].key);
      setShowFullDescription(false);
    }
  }, [show]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleAddToCart = (response: { action: string; data: any }) => {
    if (response.action === "price-slab") {
      // Open price slab modal via action handler
      setCartAction({
        action: "price-slab",
        deal: null,
        dealId: response.data?.dealId || dealId,
        sellerId: response.data?.sellerId || "",
      });
      return;
    }

    if (
      response.action === CART_ITEM_ADDED ||
      response.action === CART_ITEM_REMOVED
    ) {
      const id = product?._id || dealId;
      if (id) {
        fetchProduct(id, true);
      }
    }

    callback(response);
  };

  const [cartAction, setCartAction] = useState<{
    action: string;
    deal: any;
    dealId?: string;
    sellerId?: string;
  }>({ action: "", deal: {}, dealId: "", sellerId: "" });

  const [hasCartItems, setHasCartItems] = useState<boolean>(false);

  const updateCartFlag = () => {
    try {
      const list = sellers || [];
      const has = list.some(
        (s) =>
          Boolean(s?.deal?.inCart?.status) ||
          (Number(s?.deal?.inCart?.qty) || 0) > 0,
      );
      setHasCartItems(has);
    } catch (e) {
      setHasCartItems(false);
    }
  };

  useEffect(() => {
    if (show) updateCartFlag();

    const addedCb = () => updateCartFlag();
    const removedCb = () => updateCartFlag();

    window.addEventListener("cart-added", addedCb as EventListener);
    window.addEventListener("cart-removed", removedCb as EventListener);

    return () => {
      window.removeEventListener("cart-added", addedCb as EventListener);
      window.removeEventListener("cart-removed", removedCb as EventListener);
    };
  }, [show]);

  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
  };

  const handleSimilarDealsCallback = (e: { action: string; data?: any }) => {
    if (!e) return;
    if (e.action === "click" && e.data?.deal) {
      const deal = e.data.deal;
      const idToLoad = deal._id || null;
      if (idToLoad) {
        setActiveTab("sellers");
        fetchProduct(idToLoad);
      }
    }
  };

  const mergeSearchParams = () => {
    const params: Record<string, any> = {};
    try {
      for (const [k, v] of Array.from(searchParams.entries())) {
        params[k] = v;
      }
    } catch (e) {
      // ignore
    }
    return params;
  };

  const viewCategory = async (category: any) => {
    if (!category) return;
    const params: any = mergeSearchParams();
    // remove brand params when navigating by category
    delete params.brandId;
    delete params.brandName;
    params.categoryId = category._id || "";
    params.categoryName = category.name || "";
    // close modal then navigate
    callback({ action: "close" });
    await new Promise((res) => setTimeout(res, 100));
    appNav.to("/products/buy-from-other-retailer/products/list", params);
  };

  const viewBrand = async (brand: any) => {
    if (!brand) return;
    const params: any = mergeSearchParams();
    // remove category params when navigating by brand
    delete params.categoryId;
    delete params.categoryName;
    params.brandId = brand._id || "";
    params.brandName = brand.name || "";
    // close modal then navigate
    callback({ action: "close" });
    await new Promise((res) => setTimeout(res, 100));
    appNav.to("/products/buy-from-other-retailer/products/list", params);
  };

  const handleSellerClick = async (
    seller: SellersArrayItem & { deal: Deal },
  ) => {
    callback({ action: "close" });
    await new Promise((res) => setTimeout(res, 300));

    // If this is an SK seller, redirect to the global products page
    if (seller?.isSkSeller) {
      appNav.to("/products/sk");
      return;
    }

    // Default behavior for other sellers: retailer page
    appNav.to("/products/buy-from-other-retailer/retailer/" + seller.id, {
      sellerId: seller.id,
    });
  };

  const handleImgPreviewModal = (images: string[]) => {
    setImgPreviewModal({
      show: true,
      images: images.map((image) => ({ id: image })),
    });
  };

  const handleImgPreviewModalClose = () => {
    setImgPreviewModal({ show: false, images: [] });
  };

  return (
    <>
      <AppModal
        show={show}
        callback={callback}
        className="tw:max-w-4xl tw:h-[90vh]"
      >
        <AppModal.Title onClose={handleClose}>
          <div className="tw:text-lg tw:font-semibold">
            Product Details & Sellers
          </div>
        </AppModal.Title>
        <AppModal.Content className="tw:h-[90vh]">
          {loading ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-64">
              <AppSpinner />
            </div>
          ) : product ? (
            <div className="tw:flex tw:flex-col tw:h-full">
              <AppCard noPadding>
                <div className="tw:flex tw:gap-3 tw:p-3">
                  <div
                    className="tw:shrink-0 tw:w-20 tw:h-20"
                    onClick={() => handleImgPreviewModal(product.images)}
                  >
                    <AppSwiper config={swiperConfig}>
                      {product.images?.map((image: any) => (
                        <AppSwiper.Slide key={image}>
                          <ImgRender
                            assetId={image}
                            alt={product.name}
                            className="tw:w-20 tw:h-20 tw:object-cover"
                          />
                        </AppSwiper.Slide>
                      ))}
                    </AppSwiper>
                  </div>
                  <div className="tw:flex-1 tw:min-w-0">
                    <h3 className="tw:text-sm tw:font-semibold tw:mb-1 tw:line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="tw:flex tw:flex-wrap tw:gap-x-4 tw:gap-y-1 tw:text-xs tw:text-gray-600">
                      {product.brand?.name && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => viewBrand(product.brand)}
                          className="tw:cursor-pointer tw:text-primary"
                        >
                          Brand: {product.brand.name}
                        </span>
                      )}
                      {product.category?.name && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => viewCategory(product.category)}
                          className="tw:cursor-pointer tw:text-primary"
                        >
                          Category: {product.category.name}
                        </span>
                      )}
                    </div>
                    {/* Price / MRP / Discount row */}
                    <div className="tw:flex tw:flex-row tw:items-center tw:gap-2 tw:mt-1">
                      {product.price != null && (
                        <span className="tw:text-base tw:font-semibold tw:text-green-600">
                          <Amount value={product.price} />
                        </span>
                      )}
                      {product.mrp != null && product.discount > 0 && (
                        <span className="tw:text-xs tw:text-gray-500 tw:line-through">
                          <Amount value={product.mrp} />
                        </span>
                      )}
                      {product.discount > 0 && (
                        <span className="tw:text-xs tw:text-orange-600 tw:font-semibold">
                          {product.discount}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </AppCard>

              <AppTab
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                className="tw:mb-4"
              />

              {activeTab === "sellers" && (
                <>
                  {hasSlabSellers && (
                    <div className="tw:py-2">
                      <AppCheckbox
                        label="Show Slab discount only"
                        value={slabOnly}
                        onChange={(e) => setSlabOnly(e)}
                        size="xs"
                      />
                    </div>
                  )}

                  <Sellers
                    loading={false}
                    silentLoading={silentLoading}
                    sellers={sellers}
                    onAddToCart={handleAddToCart}
                    onSellerClick={handleSellerClick}
                    slabOnly={slabOnly}
                  />
                </>
              )}

              {activeTab === "details" && (
                <div className="tw:px-1 tw:pt-2 tw:flex-1">
                  <div className="tw:flex tw:flex-col tw:gap-3 tw:text-xs">
                    <div className="tw:flex tw:items-start">
                      <div className="tw:w-36 tw:text-gray-500">Menu</div>
                      <div className="tw:flex-1 tw:font-medium tw:text-gray-800 tw:truncate">
                        {product.menu?.name || "-"}
                      </div>
                    </div>

                    <div className="tw:flex tw:items-start">
                      <div className="tw:w-36 tw:text-gray-500">Category</div>
                      <div className="tw:flex-1 tw:font-medium tw:text-gray-800 tw:truncate">
                        {product.category?.name ? (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={() => viewCategory(product.category)}
                            onKeyPress={() => viewCategory(product.category)}
                            className="tw:cursor-pointer tw:text-primary tw:truncate"
                          >
                            {product.category.name}
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>

                    <div className="tw:flex tw:items-start">
                      <div className="tw:w-36 tw:text-gray-500">Brand</div>
                      <div className="tw:flex-1 tw:font-medium tw:text-gray-800 tw:truncate">
                        {product.brand?.name ? (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={() => viewBrand(product.brand)}
                            onKeyPress={() => viewBrand(product.brand)}
                            className="tw:cursor-pointer tw:text-primary tw:truncate"
                          >
                            {product.brand.name}
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>

                    <div className="tw:flex tw:items-start">
                      <div className="tw:w-36 tw:text-gray-500">Deal ID</div>
                      <div className="tw:flex-1 tw:font-medium tw:text-gray-800 tw:truncate">
                        {product.id || "-"}
                      </div>
                    </div>

                    {product.description && (
                      <div className="tw:flex tw:items-start tw:flex-col">
                        <div className="tw:text-gray-500 tw:text-xs tw:mb-1">
                          Description
                        </div>
                        <div
                          className={`tw:flex-1 tw:font-medium tw:text-gray-800 tw:text-xs ${
                            showFullDescription
                              ? ""
                              : "tw:overflow-hidden tw:line-clamp-3"
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: product.description,
                          }}
                        />
                        {product.description &&
                          (product.description || "").length > 200 && (
                            <button
                              type="button"
                              className="tw:text-primary tw:underline tw:text-xs tw:mt-1 tw:self-start"
                              onClick={() =>
                                setShowFullDescription((prev) => !prev)
                              }
                            >
                              {showFullDescription ? "View less" : "View more"}
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "similar" && (
                <div className="tw:flex-1 tw:px-1 tw:pt-2">
                  <SimilarDeals
                    brandId={product?.brand?._id}
                    categoryId={product?.category?._id}
                    distance={distance}
                    excludeDealId={product?._id || product?.id}
                    callback={handleSimilarDealsCallback}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="tw:text-center tw:py-12">
              <p className="tw:text-gray-400">Product not found</p>
            </div>
          )}
        </AppModal.Content>

        {hasCartItems && !(loading || silentLoading) && (
          <AppModal.Footer>
            <div className="tw:flex tw:justify-end tw:gap-3">
              <AppButton
                onClick={() => {
                  callback({ action: "close" });
                  const t = setTimeout(() => {
                    clearTimeout(t);
                    appNav.to("/products/cart/check");
                  }, 500);
                }}
                size="small"
              >
                <ShoppingBagIcon size={16} />
                View Cart
              </AppButton>
            </div>
          </AppModal.Footer>
        )}
        <AddToCartActionHandler
          deal={cartAction.deal}
          action={cartAction.action}
          callback={(e) => {
            setCartAction({ action: "", deal: {}, dealId: "", sellerId: "" });
            fetchProduct(product?._id, true);
          }}
          sellerId={cartAction.sellerId}
          dealId={cartAction.dealId}
        />
      </AppModal>
      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={handleImgPreviewModalClose}
        images={imgPreviewModal.images}
      />
    </>
  );
};

export default SellerListModal;
