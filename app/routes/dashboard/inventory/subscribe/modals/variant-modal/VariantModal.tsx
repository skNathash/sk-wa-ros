import Amount from "app/components/core/amount/Amount";
import AppBadge from "app/components/core/badge/AppBadge";
import AppButton from "app/components/core/button/AppButton";
import ImgRender from "app/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import clsx from "clsx";
import { Plus, X, Eye } from "lucide-react";
import React, { useEffect, useState } from "react";
import Divider from "~/components/core/divider/Divider";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import RemoveSubscribeBtn from "~/shared/catalog/components/subscribe-buttons/RemoveSubscribeBtn";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";
import type { SellerDeal } from "~/types/CommonTypes";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  dealId: string;
  showAllDeals?: boolean;
};

type VariantDeal = SellerDeal & {
  added: boolean;
  label?: string;
  csa?: string;
  discount?: number;
  netWeight?: string;
  isLoading?: boolean;
  itemId?: string;
  dealId?: string;
  alreadySubscribed?: boolean;
  groupedOn?: string;
};

const VariantModal: React.FC<Props> = ({
  show,
  callback,
  dealId,
  showAllDeals = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [deal, setDeal] = useState<any>(null);
  const [variants, setVariants] = useState<VariantDeal[]>([]);
  const [isSubscribingAll, setIsSubscribingAll] = useState(false);
  const appToast = useAppToast();

  useEffect(() => {
    const fetchDeal = async () => {
      setLoading(true);
      try {
        // Fetch main deal details. If `showAllDeals` is true, don't force the NOTSUBSCRIBED filter
        const mainDealOpts: any = {
          filter: { _id: dealId },
          ignoreAsset: true,
        };
        if (!showAllDeals) {
          mainDealOpts.dealSubscribeType = "NOTSUBSCRIBED";
        }

        const res = await InventorySubscribeService.getDeals(mainDealOpts);

        const dealsData = res?.data?.data || [];
        if (dealsData.length > 0) {
          const d = InventorySubscribeService.formatDealResponse(dealsData, {
            groupDealOnlySubscribed: showAllDeals,
          })[0];
          setDeal(d);

          const groupDeals = d?.groupDeals || [];
          if (groupDeals.length > 0) {
            // Collect all inner deal object IDs to fetch their full details
            const groupDealIds = groupDeals
              .flatMap((g: any) => (g.values || []).map((v: any) => v._id))
              .filter(Boolean);

            if (groupDealIds.length > 0) {
              const groupDealOpts: any = {
                page: 1,
                limit: groupDealIds.length,
                filter: { _id: { $in: groupDealIds } },
                ignoreAsset: true,
              };

              if (!showAllDeals) {
                groupDealOpts.dealSubscribeType = "NOTSUBSCRIBED";
              }

              const groupDealsRes =
                await InventorySubscribeService.getDeals(groupDealOpts);

              const groupDealsData = groupDealsRes?.data?.data || [];
              const formattedGroupDeals =
                InventorySubscribeService.formatDealResponse(groupDealsData);

              // Map groupDeal values to formatted deals for additional data
              const variantsWithInfo = formattedGroupDeals.map(
                (formattedDeal: any) => {
                  // find the matching group value (if any)
                  let groupValue: any = null;
                  for (const g of groupDeals) {
                    const v = (g.values || []).find(
                      (x: any) => x._id === formattedDeal._id
                    );
                    if (v) {
                      groupValue = v;
                      break;
                    }
                  }

                  const inLocalCart =
                    InventorySubscribeService.getLocalCartItem(
                      formattedDeal._id
                    );

                  const alreadySubscribed = groupValue?.isSubscribed || false;
                  const isInLocalCart = !!inLocalCart;

                  return {
                    ...formattedDeal,
                    label: groupValue?.csa || undefined,
                    csa: groupValue?.csa || undefined,
                    groupedOn: groupValue?.groupedOn || undefined,
                    alreadySubscribed,
                    // mark as subscribed only if server says so
                    isSubscribed: alreadySubscribed,
                    // consider item added if either already subscribed or present in local cart
                    added: alreadySubscribed || isInLocalCart,
                    itemId: inLocalCart?.itemId || formattedDeal.itemId || "",
                  };
                }
              );

              // Move already subscribed variants to the bottom so unsubscribed variants appear first
              variantsWithInfo.sort((a: VariantDeal, b: VariantDeal) => {
                const aSubscribed = (a as any).alreadySubscribed ? 1 : 0;
                const bSubscribed = (b as any).alreadySubscribed ? 1 : 0;
                if (aSubscribed === bSubscribed) return 0;
                return aSubscribed ? 1 : -1;
              });

              setVariants(variantsWithInfo);
            } else {
              setVariants([]);
            }
          } else {
            setVariants([]);
          }
        } else {
          setDeal(null);
          setVariants([]);
        }
      } catch (e) {
        console.error("Error fetching deal:", e);
        setDeal(null);
        setVariants([]);
      } finally {
        setLoading(false);
      }
    };
    if (show && dealId) {
      fetchDeal();
    } else if (!show) {
      setDeal(null);
      setVariants([]);
    }
  }, [show, dealId]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleSubscribeCallback =
    (index: number) => (data: { action: string; data?: any }) => {
      if (data.action === "subscribed" && data.data) {
        setVariants((prev) =>
          prev.map((v, i) =>
            i === index
              ? {
                  ...v,
                  added: true,
                  itemId: data.data.itemId,
                  isSubscribed: true,
                }
              : v
          )
        );
      }
    };

  const handleRemoveCallback =
    (index: number) => (data: { action: string; data?: any }) => {
      if (data.action === "removed") {
        setVariants((prev) =>
          prev.map((v, i) =>
            i === index
              ? {
                  ...v,
                  added: false,
                  itemId: "",
                  isSubscribed: false,
                }
              : v
          )
        );
      }
    };

  const handleSubscribeAll = async () => {
    // Ignore variants that are already added (which includes alreadySubscribed)
    const unsubscribedVariants = variants.filter(
      (v) => !v.added && !(v as any).alreadySubscribed
    );
    if (unsubscribedVariants.length === 0) return;

    // Check cart limit
    const MAX_SUBSCRIPTIONS = 50;
    let uniqueCount = 0;
    try {
      const cartResp = await InventorySubscribeService.getCart();
      if (cartResp?.statusCode === 200) {
        const serverProducts = cartResp.data?.data?.products || [];
        const dealIds = serverProducts
          .map((p: any) => p.dealId || p._id)
          .filter(Boolean);
        uniqueCount = new Set(dealIds).size;
      }
    } catch (err) {
      const local = InventorySubscribeService.getLocalCart() || [];
      const dealIds = local.map((p: any) => p.dealId).filter(Boolean);
      uniqueCount = new Set(dealIds).size;
    }

    if (uniqueCount + unsubscribedVariants.length > MAX_SUBSCRIPTIONS) {
      appToast.show({
        msg: "You can only subscribe up to 50 items at a time. Please review your cart to subscribe",
        color: "warning",
      });
      return;
    }

    setIsSubscribingAll(true);

    try {
      const products = unsubscribedVariants.map((variant) => {
        const product: any = {
          dealId: variant._id,
          dealRefId: variant.dealId,
          name: variant.name,
          quantity: 0,
          mrp: variant.mrp,
          price: AuthService.isMasterLogin() ? variant.mrp : variant.price,
          images: variant.images || [],
          barcodes: variant.barcodes || [],
        };
        if (variant.hsn) product.hsnNumber = variant.hsn;
        const gstVal = variant.gst ?? variant.tax;
        if (gstVal !== undefined && gstVal !== "")
          product.gst = Number(gstVal);
        return product;
      });

      const response =
        await InventorySubscribeService.bulkSubscription(products);

      if (response.statusCode === 200) {
        const subscribedProducts = response.data?.data?.cart?.products || [];

        const localCartData = subscribedProducts
          .map((product: any) => {
            const variant = unsubscribedVariants.find(
              (v) => v._id === product.dealId
            );
            if (!variant) return null;

            return {
              dealId: variant._id,
              dealName: variant.name,
              quantity: 0,
              price: AuthService.isMasterLogin() ? variant.mrp : variant.price,
              images: variant.images || [],
              itemId: product.itemId || product._id,
            };
          })
          .filter(Boolean);

        if (localCartData.length > 0) {
          InventorySubscribeService.saveBulkInLocalCart(localCartData);
        }

        // Update variants with subscription status
        setVariants((prev) =>
          prev.map((v) => {
            const cartItem = localCartData.find(
              (item: any) => item.dealId === v._id
            );
            return cartItem
              ? {
                  ...v,
                  added: true,
                  itemId: cartItem.itemId,
                  isSubscribed: true,
                }
              : v;
          })
        );

        InventorySubscribeService.triggerItemAddedEvent({
          bulk: true,
          count: localCartData.length,
          dealIds: localCartData.map((v: any) => v.dealId),
        });

        appToast.show({
          msg: `${unsubscribedVariants.length} products subscribed successfully`,
          color: "success",
        });

        InventorySubscribeService.triggerOpenCartPopoverEvent();
      } else {
        appToast.show({
          msg: response?.data?.message || "Failed to subscribe items",
          color: "danger",
        });
      }
    } catch (error) {
      appToast.show({
        msg: "Failed to subscribe items",
        color: "danger",
      });
    } finally {
      setIsSubscribingAll(false);
    }
  };

  return (
    <AppModal show={show} callback={callback} className="tw:max-h-[95vh]">
      <AppModal.Title onClose={handleClose} noShadow={true}>
        Details
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[95vh]">
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-40">
            <AppSpinner className="tw:w-8 tw:h-8" />
          </div>
        ) : deal ? (
          <div className="tw:space-y-4">
            {/* Main Deal Block - Screenshot Layout */}
            <div className="tw:flex tw:gap-4 tw:items-center tw:mb-4">
              {/* Image */}
              <div className="tw:w-16 tw:h-16 tw:rounded-md tw:bg-gray-100 tw:flex tw:items-center tw:justify-center tw:overflow-hidden tw:border tw:border-gray-300">
                <ImgRender
                  assetId={
                    deal.images && deal.images.length > 0 && deal.images[0]
                      ? deal.images[0]
                      : undefined
                  }
                  alt={deal.name}
                  className="tw:w-16 tw:h-16 tw:object-cover tw:rounded-md"
                />
              </div>
              {/* Info Block */}
              <div className="tw:flex-1 tw:flex tw:flex-col tw:gap-1">
                <div className="tw:font-bold tw:text-sm tw:mb-0.5">
                  {deal.name}
                </div>
                {deal.netWeight && (
                  <div className="tw:font-medium tw:text-sm tw:text-gray-700">
                    {deal.netWeight}
                  </div>
                )}
                <div className="tw:flex tw:items-center tw:gap-1 tw:text-wrap">
                  <AppBadge variant="light" className="tw:text-gray-500">
                    {deal.brand?.name}
                  </AppBadge>
                  <AppBadge variant="light" className="tw:text-gray-500">
                    {deal.category?.name}
                  </AppBadge>
                </div>
              </div>
            </div>

            <Divider />

            {/* Shared UI above variants */}
            <div className="tw:flex tw:items-center tw:justify-between tw:mb-3">
              <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm">
                <span className="tw:font-medium tw:text-gray-700">
                  {variants.length} variants available
                </span>
              </div>
              {!deal?.isSubscribed && (
                <AppButton
                  size="small"
                  color="light"
                  fill="outline"
                  onClick={handleSubscribeAll}
                  isLoading={isSubscribingAll}
                  className="tw:flex tw:items-center"
                  noShadow={true}
                >
                  <Plus size={16} />
                  Subscribe All
                </AppButton>
              )}
            </div>
            {/* Variants List UI */}
            <div className="tw:mt-2 tw:space-y-3">
              {variants.map((variant, idx) => (
                <div
                  key={variant._id || variant.id}
                  className={clsx(
                    "tw:rounded tw:px-4 tw:py-3 tw:flex tw:items-center tw:justify-between tw:border",
                    variant.added
                      ? "tw:bg-yellow-50 tw:border-yellow-400"
                      : "tw:bg-gray-50 tw:border-gray-200"
                  )}
                >
                  {/* First column: netWeight and mrp */}
                  <div className="tw:flex tw:flex-col tw:gap-1">
                    {variant.csa && (
                      <span className="tw:font-semibold tw:text-sm tw:text-gray-700">
                        {variant.groupedOn}: {variant.csa}
                      </span>
                    )}
                    <div className="tw:flex tw:items-center tw:gap-1 tw:text-sm tw:mt-1">
                      <span className="tw:font-medium tw:text-gray-500">
                        MRP:
                      </span>
                      <Amount value={variant.mrp} className="tw:font-medium" />
                    </div>
                  </div>
                  {/* Second column: subscribe/remove button (icon only) */}
                  <div>
                    {variant.alreadySubscribed ? (
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <span className="tw:text-xs tw:font-semibold tw:text-green-600">
                          Subscribed
                        </span>
                        <AppLink
                          asLink
                          noUnderline
                          href={`/dashboard/inventory/products/view/${variant._id}?did=${deal._id}`}
                          onClick={handleClose}
                          className="tw:h-8 tw:px-3 tw:rounded tw:border tw:border-green-600 tw:text-green-700 tw:bg-white tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-medium hover:tw:bg-green-50 tw:transition-colors"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </AppLink>
                      </div>
                    ) : variant.added && variant.itemId ? (
                      <RemoveSubscribeBtn
                        itemId={variant.itemId}
                        size="small"
                        color="warning"
                        fill="outline"
                        className="tw:bg-white"
                        callback={handleRemoveCallback(idx)}
                      >
                        <X size={16} />
                      </RemoveSubscribeBtn>
                    ) : (
                      <SubscribeBtn
                        dealId={variant._id}
                        dealName={variant.name}
                        mrp={variant.mrp}
                        price={variant.price}
                        images={variant.images || []}
                        size="small"
                        color="primary"
                        callback={handleSubscribeCallback(idx)}
                      >
                        <Plus size={16} />
                      </SubscribeBtn>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="tw:p-4 tw:text-center tw:text-gray-500">
            No deal found.
          </div>
        )}
      </AppModal.Content>

      {showAllDeals && variants.some((v) => (v as any).isSubscribed) && (
        <AppModal.Footer>
          <div className="tw:w-full tw:flex tw:justify-end">
            <AppButton
              size="small"
              color="primary"
              onClick={() => callback({ action: "open_cart" })}
              isLoading={isSubscribingAll}
            >
              View Subscribe Cart
            </AppButton>
          </div>
        </AppModal.Footer>
      )}
    </AppModal>
  );
};

export default VariantModal;
