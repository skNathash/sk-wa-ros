import {
  Bell,
  CheckCircle2,
  Eye,
  Info,
  Layers,
  Plus,
  ShoppingCart,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import AppHeader from "~/components/core/header/AppHeader";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import NoData from "~/components/core/no-data/NoData";
import PageLoader from "~/components/core/page-loader/PageLoader";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import RemoveSubscribeBtn from "~/shared/catalog/components/subscribe-buttons/RemoveSubscribeBtn";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import VariantModal from "../modals/variant-modal/VariantModal";
import Barcodes from "./components/Barcodes";
import Images from "./components/Images";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: { path: "/dashboard" },
    langKey: "dashboard",
  },
  { label: "Product Details" },
];

export default function ProductDetail() {
  const { t } = useTranslation(["common", "inventorySubscribe"]);
  const appNav = useAppNav();
  const { id } = useParams();
  const appToast = useAppToast();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [variantModal, setVariantModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: null });

  const fetchProduct = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await InventorySubscribeService.getDeals({
        filter: { _id: id },
      });
      if (response?.data?.data && response.data.data.length > 0) {
        const formatted = InventorySubscribeService.formatDealResponse(
          response.data.data,
        )[0];

        setProduct(formatted);
      } else {
        setProduct(null);
      }
    } catch (error) {
      console.error("Failed to fetch product details", error);
      appToast.show({ msg: "Failed to load product details", color: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleVariantModalCallback = (params: {
    action: string;
    data?: any;
  }) => {
    if (params.action === "close") {
      setVariantModal({ show: false, data: null });
      // Check if any variant is in local cart and update isInCart and itemId
      if (product?.groupDeals && product.groupDeals.length > 0) {
        const variantIds = product.groupDeals
          .flatMap((g: any) => (g.values || []).map((v: any) => v._id))
          .filter(Boolean);
        const localCart = InventorySubscribeService.getLocalCart() || [];
        const cartItem = localCart.find((item: any) =>
          variantIds.includes(item.dealId),
        );
        const isAnyVariantInCart = !!cartItem;
        setProduct((prev: any) =>
          prev
            ? {
                ...prev,
                isInCart: isAnyVariantInCart,
                itemId: cartItem?.itemId || null,
              }
            : prev,
        );
      }
      return;
    }

    if (params.action === "subscribed" && params.data) {
      setVariantModal({ show: false, data: null });
      setProduct((prev: any) =>
        prev
          ? {
              ...prev,
              isInCart: true,
              itemId: params.data?.itemId || prev.itemId,
            }
          : prev,
      );
      return;
    }

    if (params.action === "removed" && params.data) {
      setVariantModal({ show: false, data: null });
      setProduct((prev: any) =>
        prev ? { ...prev, isInCart: false, itemId: null } : prev,
      );
      return;
    }

    // Open subscribe cart (triggered from VariantModal footer)
    if (params.action === "open_cart" || params.action === "openCart") {
      setVariantModal({ show: false, data: null });
      appNav.to("/dashboard/inventory/subscribe/cart");
      return;
    }
  };

  const handleRedirectToSearch = (
    type: "brand" | "category" | "company" | "menu",
  ) => {
    if (!product) return;
    const params: Record<string, any> = {};
    if (type === "brand" && product.brand) {
      params.brandId = product.brand._id || product.brand.id;
      params.brandName = product.brand.name;
    }
    if (type === "category" && product.category) {
      params.categoryId = product.category._id || product.category.id;
      params.categoryName = product.category.name;
    }
    if (type === "menu" && product.menu) {
      params.menuId = product.menu._id || product.menu.id;
      params.menuName = product.menu.name;
    }
    if (type === "company" && product.companyName) {
      // subscribe/search expects companyId and companyName; product.companyName may be a string
      params.companyId = product.companyId || product.companyName;
      params.companyName = product.companyName;
    }

    // Preserve current tab as 'search' by default
    params.tab = "search";

    appNav.to("/dashboard/inventory/subscribe/search", params);

    // Show toast to indicate filter applied
    if (type === "brand") {
      appToast.show({
        msg: `Filtered by brand ${product.brand?.name}`,
        color: "success",
      });
    }
    if (type === "category") {
      appToast.show({
        msg: `Filtered by category ${product.category?.name}`,
        color: "success",
      });
    }
    if (type === "menu") {
      appToast.show({
        msg: `Filtered by menu ${product.menu?.name}`,
        color: "success",
      });
    }
    if (type === "company") {
      appToast.show({
        msg: `Filtered by company ${product.companyName}`,
        color: "success",
      });
    }
  };

  const handleSubscribeCallback = (data: { action: string; data?: any }) => {
    if (data?.action === "subscribed") {
      setProduct((prev: any) =>
        prev
          ? { ...prev, isInCart: true, itemId: data?.data?.itemId || null }
          : prev,
      );
    }
  };

  const handleRemoveCallback = (data: { action: string; data?: any }) => {
    if (data?.action === "removed") {
      setProduct((prev: any) =>
        prev ? { ...prev, isInCart: false, itemId: null } : prev,
      );
    }
  };

  return (
    <>
      <AppHeader title={t("productDetails")} />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

          {loading ? (
            <div className="tw:flex tw:items-center tw:justify-center tw:min-h-[400px]">
              <PageLoader />
            </div>
          ) : !product ? (
            <NoData />
          ) : (
            <div className="tw:flex tw:gap-4 tw:flex-col tw:md:flex-row ">
              <div className="tw:md:w-1/2">
                <Images images={product.images} />
              </div>
              <div className="tw:md:w-1/2">
                <AppCard className="tw:h-full tw:mb-0">
                  <div className="tw:flex tw:items-start tw:justify-between">
                    <div>
                      <div
                        className="tw:text-xs tw:text-primary tw:font-semibold tw:mb-1 tw:cursor-pointer"
                        onClick={() => handleRedirectToSearch("brand")}
                      >
                        {product.brand?.name || "No Brand"}
                      </div>
                      <div className="tw:text-2xl tw:font-bold tw:leading-tight">
                        {product.name}
                      </div>
                      <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                        Deal ID: {product.dealId || product._id}
                      </div>

                      <div className="tw:flex tw:gap-2 tw:mt-3 tw:flex-wrap">
                        <div
                          className="tw:cursor-pointer"
                          onClick={() => handleRedirectToSearch("category")}
                        >
                          <AppBadge
                            variant="outline"
                            className="tw:px-2 tw:py-1"
                          >
                            <Layers
                              size={12}
                              className="tw:inline-block tw:mr-1"
                            />
                            {product.category?.name}
                          </AppBadge>
                        </div>

                        <div
                          className="tw:cursor-pointer"
                          onClick={() => handleRedirectToSearch("menu")}
                        >
                          <AppBadge variant="light" className="tw:px-2 tw:py-1">
                            {product.menu?.name}
                          </AppBadge>
                        </div>

                        {product.companyName && (
                          <div
                            className="tw:cursor-pointer"
                            onClick={() => handleRedirectToSearch("company")}
                          >
                            <AppBadge
                              variant="white"
                              className="tw:px-2 tw:py-1"
                            >
                              {product.companyName}
                            </AppBadge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="tw:mt-4">
                    <div className="tw:p-4 tw:bg-gray-50 tw:rounded-md">
                      <div className="tw:flex tw:gap-1 tw:items-baseline tw:mb-1">
                        <div className="tw:text-3xl tw:font-semibold">
                          <Amount value={product.mrp || 0} />
                        </div>
                        <div className="tw:text-xs tw:text-gray-500">MRP</div>
                      </div>
                      <div className="tw:flex tw:gap-1">
                        <AppBadge variant="outline" className="tw:text-xs">
                          GST: {product.gst || 0}%
                        </AppBadge>
                        <AppBadge variant="outline" className="tw:text-xs">
                          HSN: {product.hsn || "-"}
                        </AppBadge>
                      </div>
                    </div>
                  </div>

                  {product.groupDeals && product.groupDeals.length > 0 && (
                    <div
                      className="tw:mt-4 tw:mb-2 tw:text-sm tw:text-blue-600 tw:font-semibold tw:cursor-pointer tw:flex tw:items-center tw:gap-1 tw:hover:text-blue-800"
                      onClick={() =>
                        setVariantModal({ show: true, data: product })
                      }
                    >
                      <Plus size={14} />
                      {product.groupDeals?.[0]?.values?.length} options
                      available
                    </div>
                  )}

                  {!product.isSubscribed ? (
                    <>
                      <div className="tw:mt-4 tw:bg-blue-50 tw:rounded tw:p-3">
                        <div className="tw:text-sm tw:text-blue-800 tw:flex tw:items-center">
                          <Info
                            size={14}
                            className="tw:mr-2 tw:flex-shrink-0"
                          />
                          <span>You have not subscribed for this product.</span>
                        </div>
                      </div>

                      <div className="tw:flex tw:gap-3 tw:mt-4 tw:flex-wrap">
                        {product.isInCart ? (
                          <RemoveSubscribeBtn
                            itemId={product.itemId}
                            size="large"
                            className="tw:w-full tw:md:flex-1"
                            color="danger"
                            fill="outline"
                            callback={handleRemoveCallback}
                          >
                            <Trash2 size={16} className="tw:mr-2" /> Remove from
                            Cart
                          </RemoveSubscribeBtn>
                        ) : product.groupDeals &&
                          product.groupDeals.length > 0 ? (
                          <AppButton
                            size="large"
                            className="tw:w-full tw:md:flex-1"
                            color="primary"
                            onClick={() =>
                              setVariantModal({ show: true, data: product })
                            }
                          >
                            <Plus size={16} className="tw:mr-2" /> Choose Option
                          </AppButton>
                        ) : (
                          <SubscribeBtn
                            dealId={product._id}
                            dealName={product.name}
                            mrp={product.mrp || 0}
                            price={product.price || product.mrp || 0}
                            images={product.images || []}
                            size="large"
                            className="tw:w-full tw:md:flex-1"
                            color="primary"
                            callback={handleSubscribeCallback}
                          >
                            <Bell size={16} className="tw:mr-2" /> Subscribe
                          </SubscribeBtn>
                        )}

                        <AppButton
                          size="large"
                          fill="outline"
                          className="tw:w-full tw:md:w-36"
                          color="light"
                          onClick={() =>
                            appNav.to("/dashboard/inventory/subscribe/cart")
                          }
                        >
                          <ShoppingCart size={16} className="tw:mr-2" /> View
                          Cart
                        </AppButton>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="tw:mt-4 tw:bg-purple-50 tw:rounded tw:p-3 tw:flex tw:items-center tw:justify-between">
                        <div className="tw:text-sm tw:text-purple-800 tw:flex tw:items-center">
                          <CheckCircle2
                            size={14}
                            className="tw:mr-2 tw:flex-shrink-0"
                          />
                          <span>You are subscribed for this product.</span>
                        </div>
                      </div>
                      <div className="tw:mt-4 tw:flex tw:gap-3 tw:flex-wrap">
                        <AppButton
                          size="large"
                          fill="outline"
                          className="tw:w-full tw:md:w-36"
                          color="light"
                          onClick={() =>
                            appNav.to(
                              `/dashboard/inventory/products/view/${product._id}`,
                            )
                          }
                        >
                          <Eye size={16} className="tw:mr-2" /> View Product
                        </AppButton>
                      </div>
                    </>
                  )}

                  <VariantModal
                    show={variantModal.show}
                    dealId={product._id}
                    callback={handleVariantModalCallback}
                    showAllDeals={true}
                  />

                  <Divider />

                  <div className="tw:flex tw:items-center tw:gap-4 tw:bg-gray-50 tw:p-4 tw:rounded-md">
                    <div className="tw:bg-primary tw:text-white tw:rounded-full tw:w-12 tw:h-12 tw:flex tw:items-center tw:justify-center">
                      <Users size={20} />
                    </div>
                    <div>
                      <div className="tw:text-2xl tw:font-bold">
                        {product.totalSubscribed || 0}
                      </div>
                      <div className="tw:text-xs tw:text-gray-500">
                        TOTAL SUBSCRIBED
                      </div>
                    </div>
                  </div>
                </AppCard>
              </div>
            </div>
          )}

          {!loading && product && (
            <div className="tw:mt-4">
              <Barcodes barcodes={product?.barcodes} />
            </div>
          )}

          {!loading && product && (
            <div className="tw:mt-4">
              <AppCard title="Description">
                <AppScrollArea className="tw:h-[400px]">
                  <div className="tw:text-sm tw:text-gray-700 tw:pr-3">
                    {product.description ? (
                      <div
                        className="rich-text"
                        dangerouslySetInnerHTML={{
                          __html: product.description,
                        }}
                      />
                    ) : (
                      <span className="tw:text-gray-400">
                        No description available.
                      </span>
                    )}
                  </div>
                </AppScrollArea>
              </AppCard>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
