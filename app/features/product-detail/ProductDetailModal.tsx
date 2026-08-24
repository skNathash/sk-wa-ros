import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { produce } from "immer";
import orderBy from "lodash/orderBy";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import NoData from "~/components/core/no-data/NoData";
import AppSwiper from "~/components/core/swiper";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AddToCart from "~/components/feature/products/add-to-cart/AddToCart";
import KingSlabInfo from "~/components/feature/products/king-slab/KingSlabInfo";
import ProductDescription from "~/components/feature/products/product-description/ProductDescription";
import { CART_ITEM_ADDED, CART_ITEM_REMOVED, EVENTS } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import MiscService from "~/services/MiscService";
import ProductService from "~/services/ProductService";
import SellerCatalogService from "~/services/SellerCatalogService";
import BrandBlk from "./components/brand-blk/BrandBlk";
import BrandInCategory from "./components/brand-in-category/BrandInCategory";
import SimilarProductSlide from "./components/similar-products/SimilarProductSlide";
import TopInCategory from "./components/top-in-category/TopInCategory";
import ProductVariants from "./components/variants/ProductVariants";
import { AuthService } from "~/services/AuthService";
import AppBadge from "~/components/core/badge/AppBadge";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import type { BuyCartType } from "~/types/CommonTypes";
import { useTranslation } from "react-i18next";
import CommonService from "~/services/CommonService";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

type Props = {
  show: boolean;
  dealId: string;
  callback: (a: { action: string }) => void;
  cartType?: BuyCartType;
  retailerId?: any;
  hideAddToCart?: boolean;
};

const imgSliderOptions: SwiperOptions = {
  pagination: false,
  navigation: true,
  // navigation: {
  //   nextEl: "button",
  //   prevEl: "button",
  // },
};

if (MiscService.isDesktopView()) {
  imgSliderOptions.navigation = true;
}

const ProductDetailModal = ({
  show = false,
  dealId = "",
  callback,
  cartType,
  retailerId,
  hideAddToCart = false,
}: Props) => {
  const { t } = useTranslation();
  const appNav = useAppNav();

  // Determine cartType based on user type if not provided
  let finalCartType =
    cartType || (AuthService.isBuyerUser() ? "buyer" : "normal");

  if (cartType === "buy-from-other-retailer") {
    finalCartType = "buy-from-other-retailer";
  }

  const [display, setDisplay] = useState("loading");

  const [details, setDetails] = useState<any>({});

  const [priceSlab, setPriceSlab] = useState<any[]>([]);

  const [cartAction, setCartAction] = useState<{ action: string; deal: any }>({
    action: "",
    deal: {},
  });

  const [images, setImages] = useState([]);

  const productsInfoRef = useRef<Array<any>>([]);

  const [showDescription, setShowDescription] = useState(false);

  const init = useCallback(
    async (id: string) => {
      if (!id) {
        return;
      }

      setShowDescription(false);

      setDisplay("loading");

      // Use SellerCatalogService for buyer users so we can format using its formatter
      const productFilter =
        finalCartType === "buyer" || finalCartType === "buy-from-other-retailer"
          ? { dealId: id, status: "Active" }
          : { _id: id };

      let d: any = {};

      if (
        finalCartType === "buyer" ||
        finalCartType === "buy-from-other-retailer"
      ) {
        const params: Record<string, any> = {
          parent: true,
          filter: productFilter,
          sort: { popularDeals: -1 },
        };

        if (finalCartType === "buy-from-other-retailer") {
          params.sellerId = retailerId;
        }

        const r = await SellerCatalogService.getProducts(params);

        const formatted = SellerCatalogService.formatProductResponse(
          r.data?.data || [],
          {
            ignoreGroupDeals: false,
            view: "buyer",
            sellerId:
              finalCartType === "buy-from-other-retailer"
                ? retailerId
                : undefined,
          },
        );

        d =
          formatted.length > 0
            ? { ...formatted[0], _ignoreGroupDeals: true }
            : {};

        let groupDeals: Array<any> = [];
        if (formatted.length > 0) {
          d.groupDeals.forEach((x: any) => {
            x.values = x.values.filter((y: any) => y.isSubscribed);
            if (x.values.length > 0) {
              groupDeals.push(x);
            }
          });
        }
      } else {
        const r = await ProductService.getProducts(
          {
            filter: productFilter,
            sort: { popularDeals: -1 },
          },
          { includeRawResp: true },
        );

        d = Array.isArray(r.data) && r.data.length > 0 ? r.data[0] : {};
      }

      // fetch the seller details
      if (d?._id) {
        productsInfoRef.current = d;

        delete d._raw;

        d.description = d.description
          ?.replace(/font-family:[^;]+;/gi, "")
          ?.replace(/font-size:[^;]+;/gi, "");

        d._ignorePriceSlab = true;
        d._ignoreStoreOffer = true;

        if (productsInfoRef.current.length > 0) {
          productsInfoRef.current[0].description = d.description;
        }
      }

      if (finalCartType === "buy-from-other-retailer" && retailerId) {
        d.buyFromOtherRetailer = {
          status: true,
          retailerId: String(retailerId),
        };
      }

      // for fetching the group deals
      if (d.groupDeals?.length > 0) {
        d._ignoreVariant = true;
        const ids: Array<string> = d.groupDeals
          .map((x: any) => x.values.map((y: any) => y._id))
          .flat();

        if (ids.length > 0) {
          let params = {
            page: 1,
            limit: ids.length,
            filter: { dealId: { $in: ids } },
            parent: true,
          };

          if (finalCartType === "buy-from-other-retailer" && retailerId) {
            Object.assign(params, { sellerId: retailerId });
          }
          const groupDealResp = await SellerCatalogService.getProducts(params);

          if (
            Array.isArray(groupDealResp.data?.data) &&
            groupDealResp.data.data.length > 0
          ) {
            const formatted = SellerCatalogService.formatProductResponse(
              groupDealResp.data.data,
            ).filter((x: any) => x.maxQty > 0);

            d.groupDeals = d.groupDeals.map((x: any) => {
              x.values = x.values.map((y: any) => {
                const t = formatted.find((i: any) => i.id == y.dealId);
                if (t && t?.id) {
                  y._deal = t;
                }
                return y;
              });
              return x;
            });
          }
        }
      }

      // for fetching the variants
      if (d.variants?.length > 0) {
        d._ignoreVariant = true;
        const ids: Array<any> = [];
        d.variants.forEach((e: any) => {
          (e.values || []).forEach((x: any) => {
            ids.push(x._id);
          });
        });
        // For buyers use SellerCatalogService and its formatter
        const variantFilter =
          finalCartType === "buyer"
            ? { dealId: { $in: ids } }
            : { _id: { $in: ids } };
        if (finalCartType === "buyer") {
          const varResp = await SellerCatalogService.getProducts({
            parent: true,
            filter: variantFilter,
          });
          const formattedVars = SellerCatalogService.formatProductResponse(
            varResp.data?.data || [],
          );
          if (Array.isArray(formattedVars) && formattedVars.length > 0) {
            d.variants.forEach((x: any) => {
              x.values.forEach((e: any) => {
                const t = formattedVars.find((i: any) => i._id == e._id);
                if (t?._id) {
                  e._deal = t;
                }
              });
              x.values = orderBy(
                x.values.filter((e: any) => e._deal?._id),
                ["csaValue"],
                ["asc"],
              );
            });
          }
        } else {
          const varResp = await ProductService.getProducts({
            filter: variantFilter,
          });
          if (Array.isArray(varResp.data) && varResp.data.length > 0) {
            d.variants.forEach((x: any) => {
              x.values.forEach((e: any) => {
                const t = varResp.data.find((i: any) => i._id == e._id);
                if (t?._id) {
                  e._deal = t;
                }
              });
              x.values = orderBy(
                x.values.filter((e: any) => e._deal?._id),
                ["csaValue"],
                ["asc"],
              );
            });
          }
        }
      }

      setImages(d?.images || []);

      setDetails({
        ...d,
        _showViewMoreDescBtn: d.description?.length > 300 ? true : false,
        _description: d.description ? { __html: d.description } : null,
        _previewImgs: (d.images || []).map((x: any) => ({ id: x })),
      });
      // Prepare priceSlab state: prefer network price slab when available
      setPriceSlab(d.priceSlabs || []);
      setDisplay(d._id ? "details" : "no-result");
    },
    [finalCartType, retailerId],
  );

  useEffect(() => {
    if (show && dealId) {
      init(dealId);
    } else {
      setDisplay("loading");
    }
  }, [dealId, init, show]);

  // useEffect(() => {
  //   if (!viewEnteredRef.current) {
  //     return;
  //   }
  //   init();
  // }, [init]);

  const viewCategory = () => {
    // close modal
    callback({ action: "close" });

    const t = setTimeout(() => {
      clearTimeout(t);
      appNav.to("/products/sk", {
        categoryIds: details.category?._id,
        categoryNames: details.category?.name,
      });
    }, 200);
  };

  // const toggleDesc = () => {
  //   setViewMoreDesc((v) => !v);
  // };

  // const viewImgPreviewModal = () => {
  //   setShowImgPreviewModal(true);
  // };

  // const onImgPreviewModalCb = () => {
  //   setShowImgPreviewModal(false);
  // };

  const onCartCb = useCallback(
    (e: any) => {
      if (["add", "update", "remove"].includes(e.action)) {
        setDetails(
          produce((draft: any) => {
            const priceSlabs = details?.priceSlabs || [];

            if (priceSlabs?.length > 0) {
              const qty = e.data?.data?.quantity;
              draft.displayPrice = CommonService.getPriceFromSlab(
                { isAvailable: true, slab: priceSlabs },
                qty,
                draft.price,
              );
            }

            draft.alreadyInCart = e.action === CART_ITEM_ADDED ? true : false;
            // if removed clear qty
            if (e.action === CART_ITEM_REMOVED) {
              draft.qty = 0;
              draft.inCart = { status: false, qty: 0 };
            } else {
              // Update inCart for add/update actions
              const qty = e.data?.data?.quantity || 1;
              draft.inCart = { status: true, qty: qty };
            }
          }),
        );
      }

      if (e.deal?.posPriceSlab?.length > 0) {
        // setDetails(
        //   produce((draft: any) => {
        //     draft.displayPrice = CommonService.getPosSlabPriceOnQty(
        //       e.uom == "kg" ? e.qty * 1000 : e.qty,
        //       e.deal.posPriceSlab,
        //       e.deal.roundPrice
        //     );
        //     draft.discountPerc = CommonService.calculateDiscount(
        //       draft.mrp,
        //       draft.displayPrice,
        //       true
        //     );
        //   })
        // );
      }

      if (e.isActionHandler) {
        setCartAction({ action: e.action, deal: e.deal });
      }
    },
    [callback],
  );

  const cartActionCb = () => {
    const t = setTimeout(() => {
      clearTimeout(t);
      setCartAction({ action: "", deal: {} });
    }, 500);
  };

  const viewVariant = (d: any) => {
    init(d._id);
    // NavService.nav(
    //   router,
    //   "/products/detail",
    //   {
    //     id: d._id,
    //   },
    //   true
    // );
  };

  const prdCb = (e: any) => {
    if (e.action == "click" && e?.data.deal?._id) {
      init(e.data.deal._id);
    }
  };

  const onClose = () => {
    callback({ action: "close" });
  };

  const viewAllBrandCb = (e: any) => {
    callback({ action: "close" });
    if (finalCartType === "buy-from-other-retailer") {
      appNav.to("/products/buy-from-other-retailer/retailer/" + retailerId, {
        brandId: e.data.brandIds,
        brandName: e.data.brandNames,
      });
    } else {
      appNav.to("/products/sk", e.data);
    }
  };

  const brandCb = () => {
    callback({ action: "close" });
  };

  const handleTopInCategoryProductClick = (dealId: string) => {
    init(dealId);
  };

  const toggleDescription = () => {
    setShowDescription((prev) => !prev);
  };

  const renderBreadcrumb = () => {
    const breadcrumbItems = [];

    // Add brand if available
    if (details?.brand?.name) {
      breadcrumbItems.push(
        <button
          key="brand"
          onClick={() => {
            callback({ action: "close" });
            if (finalCartType === "buy-from-other-retailer") {
              appNav.to(
                "/products/buy-from-other-retailer/retailer/" + retailerId,
                {
                  brandId: details.brand._id,
                  brandName: details.brand.name,
                },
              );
            } else {
              appNav.to("/products/sk", {
                brandIds: details.brand._id,
                brandNames: details.brand.name,
              });
            }
          }}
          className="tw:text-sm tw:text-app-primary tw:hover:underline tw:cursor-pointer"
        >
          {details.brand.name}
        </button>,
      );
    }

    // Add category if available
    if (details?.category?.name) {
      if (breadcrumbItems.length > 0) {
        breadcrumbItems.push(
          <ChevronRight
            key="separator"
            className="tw:text-gray-400 tw:mx-1"
            size={16}
          />,
        );
      }
      breadcrumbItems.push(
        <button
          key="category"
          onClick={() => {
            callback({ action: "close" });
            if (finalCartType === "buy-from-other-retailer") {
              appNav.to(
                "/products/buy-from-other-retailer/retailer/" + retailerId,
                {
                  categoryId: details.category._id,
                  categoryName: details.category.name,
                },
              );
            } else {
              appNav.to("/products/sk", {
                categoryIds: details.category._id,
                categoryNames: details.category.name,
              });
            }
          }}
          className="tw:text-sm tw:text-app-primary tw:hover:underline tw:cursor-pointer"
        >
          {details.category.name}
        </button>,
      );
    }

    return breadcrumbItems.length > 0 ? (
      <nav className="tw:flex tw:items-center tw:space-x-1">
        {breadcrumbItems}
      </nav>
    ) : null;
  };

  const renderPrice = (isFooter = false) => {
    if (details.b2bScheme?.status === "Running") {
      return (
        <div className="tw:flex tw:flex-col">
          <div className="tw:text-[10px] tw:font-bold tw:text-orange-600 tw:uppercase tw:flex tw:items-center tw:gap-1">
            <span className="tw:w-1.5 tw:h-1.5 tw:bg-orange-600 tw:rounded-full tw:animate-pulse"></span>
            Scheme Price
          </div>
          <div className="tw:flex tw:items-baseline tw:gap-2">
            <span
              className={clsx(
                "tw:text-orange-600 tw:font-bold",
                isFooter ? "tw:text-lg" : "tw:text-2xl",
              )}
            >
              <Amount
                value={details.displayPrice || details.mrp}
                decimalPlaces={2}
              />
            </span>
            <span className="tw:bg-orange-100 tw:text-orange-600 tw:text-xs tw:px-1.5 tw:py-0.5 tw:rounded tw:font-bold">
              {details.discount}% OFF
            </span>
          </div>
          <div
            className={clsx(
              "tw:flex tw:items-center tw:gap-3 tw:text-gray-500 tw:mt-0.5",
              isFooter ? "tw:text-[9px]" : "tw:text-sm",
            )}
          >
            <div className="tw:flex tw:items-center tw:gap-1">
              <span className="tw:text-gray-400">MRP:</span>
              <span className="tw:line-through">
                <Amount value={details.mrp} decimalPlaces={2} />
              </span>
            </div>
            <div className="tw:flex tw:items-center tw:gap-1">
              <span className="tw:text-gray-400">B2B:</span>
              <span className="tw:font-medium tw:text-gray-700">
                <Amount value={details.b2bPrice} decimalPlaces={2} />
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <span
          className={clsx(
            "tw:me-2 tw:text-app-primary tw:font-semibold",
            isFooter ? "tw:text-lg" : "tw:text-xl",
          )}
        >
          {details.sellForFree ? (
            <span className="tw:text-orange-600">FREE!</span>
          ) : (
            <Amount
              value={details.displayPrice || details.mrp}
              decimalPlaces={2}
            />
          )}
        </span>
        {details.discount ? (
          <>
            <span className="tw:text-app-gray-4 tw:text-sm">MRP </span>
            <span className="tw:line-through tw:text-app-gray-4 tw:text-sm">
              <Amount value={details.mrp} decimalPlaces={2} />
            </span>

            {/* off margin */}
            <span className="discount-bg tw:text-xs tw:text-white tw:ms-2 tw:px-1 tw:py-0.5 tw:rounded tw:font-semibold">
              {details.discount}%
            </span>
          </>
        ) : null}
      </>
    );
  };

  const renderAddBtn = (from?: string) => {
    if (hideAddToCart) {
      return <AppBadge variant="danger">{t("notServiceable")}</AppBadge>;
    }

    if (details.maxQty == 0) {
      return <AppBadge variant="danger">Out of stock</AppBadge>;
    }

    return (
      <div className="tw:text-end">
        {priceSlab?.length > 0 && (
          <div className="tw:-mt-4">
            <KingSlabInfo slabs={priceSlab} size="md" />
          </div>
        )}
        <AddToCart
          deal={details}
          callback={onCartCb}
          cartType={finalCartType}
          ignorePriceSlab={true}
        />
        <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-green-600">
          <span>
            In Stock:{" "}
            {details.selectedStockUom ? (
              <DisplayQty
                qty={details.maxQty || 0}
                isLooseQty={false}
                uom={details.selectedStockUom}
                hideDefaultUom={true}
              />
            ) : (
              <>
                {details.maxQty || 0}{" "}
                <SellingTypeDisplay sellingType={details.sellingType} />
              </>
            )}
          </span>
          <CaseQtyPopover
            packageQty={details.packageQty}
            sellingType={details.sellingType}
          />
        </div>
      </div>
    );
  };

  const cartViewCb = (e: any) => {
    if (e.action == "viewCart") {
      callback({ action: "close" });
    }
  };

  return (
    <>
      <AppModal show={show} callback={callback} className="tw:h-[95vh]">
        <AppModal.Title onClose={onClose}>
          <div className="tw:text-lg tw:font-semibold">
            {t("productDetails")}
          </div>
        </AppModal.Title>

        <AppModal.Content className="tw:bg-gray-100 tw:max-h-[95vh]">
          {display == "loading" ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-full tw:mt-4">
              <AppSpinner />
            </div>
          ) : null}

          {display == "no-result" ? <NoData /> : null}

          {display == "details" && show ? (
            <>
              {/* breadcrumb navigation */}
              <div className="tw:mt-2">{renderBreadcrumb()}</div>

              {/* image slider start */}
              <div className="tw:bg-white tw:rounded-lg tw:pt-8 tw:overflow-hidden tw:mt-2">
                <div>
                  <AppSwiper config={imgSliderOptions}>
                    {images.map((x: any) => (
                      <AppSwiper.Slide key={x}>
                        <button className="tw:w-full">
                          <ImgRender
                            assetId={x}
                            className="tw:h-64"
                            size="500x500"
                          />
                        </button>
                      </AppSwiper.Slide>
                    ))}
                  </AppSwiper>

                  <div className="tw:px-4">
                    {/* category name */}
                    {/* <div className="tw:text-sm tw:text-app-gray-4 tw:mb-2">
                      <button
                        onClick={viewCategory}
                        className="tw:bg-gray-100 tw:text-xs tw:px-2 tw:py-1 tw:rounded-md"
                      >
                        {details.category?.name}
                      </button>
                    </div> */}

                    {finalCartType === "buy-from-other-retailer" && (
                      <div className="tw:text-[9px] tw:text-gray-500 tw:font-normal tw:flex tw:items-center tw:gap-1">
                        {details.menu?.name ? <span>Menu</span> : null}
                        {details.parentCategory?.name ? (
                          <span>/ Parent Category</span>
                        ) : null}
                        {details.category?.name ? (
                          <span>/ Category</span>
                        ) : null}
                      </div>
                    )}

                    {finalCartType === "buy-from-other-retailer" && (
                      <div className="tw:flex tw:items-center tw:gap-1 tw:mb-2">
                        {details.menu?.name ? (
                          <div className="tw:text-xs tw:text-slate-600 tw:font-normal">
                            {details.menu?.name}
                          </div>
                        ) : null}

                        {details.parentCategory?.name ? (
                          <div className="tw:text-xs tw:text-slate-600 tw:font-normal">
                            / {details.parentCategory?.name}
                          </div>
                        ) : null}

                        {details.category?.name ? (
                          <div className="tw:text-xs tw:text-slate-600 tw:font-normal">
                            / {details.category?.name}
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* product name */}
                    <div className="tw:font-semibold tw:text-lg tw:mb-4 tw:flex tw:items-center">
                      <div className="flex-1 pe-2">{details.name}</div>
                    </div>

                    {/* pricing */}
                    <div className="tw:flex tw:pb-4 tw:relative">
                      <div className="tw:flex-1 tw:self-end">
                        {details.consumerOffer?.enabled ? (
                          <div className="tw:mb-2">
                            <ConsumerOfferBadge size="md" />
                          </div>
                        ) : null}
                        {renderPrice()}
                      </div>
                      {/* <div className="tw:w-1/4">{renderAddBtn("pinfo")}</div> */}
                    </div>

                    {/* variants start */}
                    <ProductVariants
                      variants={details.groupDeals}
                      currentDealId={details._id}
                      viewVariant={viewVariant}
                    />
                    {/* variants end */}
                  </div>
                </div>

                <div className="tw:border-t tw:border-gray-200 tw:p-4">
                  <button
                    className="tw:text-xs tw:text-app-primary tw:flex tw:items-center tw:uppercase"
                    onClick={toggleDescription}
                  >
                    {t("viewMoreProductDetails")}
                    {showDescription ? (
                      <ChevronUp className="tw:align-middle tw:ms-2" />
                    ) : (
                      <ChevronDown className="tw:align-middle tw:ms-2" />
                    )}
                  </button>

                  <div
                    className={`tw:transition-all tw:duration-300 ${
                      showDescription
                        ? "tw:max-h-screen tw:mt-4"
                        : "tw:max-h-0 tw:overflow-hidden"
                    }`}
                  >
                    <ProductDescription
                      products={productsInfoRef.current}
                      type={
                        details.comboDealConfig?.length > 0 ? "combo" : "normal"
                      }
                      dealId={details.id}
                      pids={details.pidsString}
                    />
                  </div>
                </div>
              </div>
              {/* image slider end */}

              <div className="tw:bg-white tw:mb-3 tw:rounded-lg tw:px-4">
                <BrandBlk
                  brandId={details?.brand?._id}
                  callback={viewAllBrandCb}
                />
              </div>
              <div
                className={clsx("tw:flex tw:flex-col", {
                  "tw:flex-col-reverse": details?.storeOffers?.length,
                })}
              >
                <div>
                  {finalCartType !== "buy-from-other-retailer" ? (
                    <SimilarProductSlide
                      categoryId={details?.category?._id}
                      brandId={details?.brand?._id}
                      dealId={details._id}
                      callback={prdCb}
                      onProductClick={handleTopInCategoryProductClick}
                    />
                  ) : null}
                </div>
              </div>
              <div className="mb-3">
                {finalCartType !== "buy-from-other-retailer" ? (
                  <TopInCategory
                    categoryId={details?.category?._id}
                    categoryName={details?.category?.name}
                    onProductClick={handleTopInCategoryProductClick}
                  />
                ) : null}

                <BrandInCategory
                  categoryId={details?.category?._id}
                  callback={brandCb}
                  cartType={finalCartType}
                  retailerId={retailerId}
                />

                {/* <PeopleBought
                  categoryId={details?.category?._id}
                  categoryName={details?.category[0]?.name}
                /> */}
              </div>
            </>
          ) : null}
        </AppModal.Content>

        {display == "details" && details.alreadyInCart ? (
          <AppModal.Footer className="tw:bg-white">
            <div className="">
              {/* <CartViewBtn callback={cartViewCb} /> */}
            </div>
          </AppModal.Footer>
        ) : null}

        {display == "details" && !details?.alreadyInCart ? (
          <AppModal.Footer>
            <div className="tw:flex tw:justify-between tw:w-full">
              <div className="tw:flex-1">
                {renderPrice(true)}
                <div className="tw:text-xs tw:text-app-gray-4">
                  (Incl of all taxes)
                </div>
              </div>
              <div>{renderAddBtn()}</div>
            </div>
          </AppModal.Footer>
        ) : null}
      </AppModal>

      {/* {display == "details" ? (
        <AddToCartActionHandler
          action={cartAction.action}
          deal={cartAction.deal}
          callback={cartActionCb}
        />
      ) : null} */}
    </>
  );
};

export default ProductDetailModal;
