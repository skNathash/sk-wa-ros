import {
  ArrowRight,
  CheckCircle2,
  PackageSearch,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import useAppNav from "~/hooks/useAppNav";
import DealScopeBadge from "~/shared/inventory/components/DealScopeBadge";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";

type LinkedDeal = {
  dealName?: string;
  dealId?: string | number;
  sellerDealId?: string | number;
  mrp?: number;
  price?: number;
  images?: string[];
  isLocalDeal?: boolean;
  [key: string]: any;
};

type BarcodeLinkedProductsModalProps = {
  show: boolean;
  barcode?: string;
  linkedDeals: LinkedDeal[];
  // Hide the "create new product" block (e.g. when the user is already in
  // the add-product form) and offer "use barcode anyway" instead.
  hideCreateProduct?: boolean;
  callback: (params: { action: string; data?: any }) => void;
};

const BarcodeLinkedProductsModal = ({
  show,
  barcode,
  linkedDeals,
  hideCreateProduct = false,
  callback,
}: BarcodeLinkedProductsModalProps) => {
  const { t } = useTranslation(["common", "inventorySubscribe"]);
  const appNav = useAppNav();
  const [subscribed, setSubscribed] = useState<{
    dealName: string;
  } | null>(null);

  const onClose = () => {
    setSubscribed(null);
    callback({ action: "close" });
  };

  const handleCreateProduct = () => {
    callback({ action: "createProduct", data: { barcode } });
  };

  const handleUseBarcode = () => {
    callback({ action: "useBarcode", data: { barcode } });
  };

  const handleGoToCart = () => {
    setSubscribed(null);
    callback({ action: "close" });
    appNav.to("/dashboard/inventory/subscribe/cart");
  };

  const handleSubscribeCallback = (deal: LinkedDeal) => (res: any) => {
    if (res?.action === "subscribed") {
      setSubscribed({ dealName: deal.dealName || deal.name || "this product" });
      // Let the parent know a subscription happened so it can refresh.
      callback({
        action: "subscribed",
        data: { ...res.data, deal, barcode },
      });
    }
  };

  const itemCount = linkedDeals.length;
  const isMany = itemCount > 1;
  const hasUnsubscribedCatalogDeals = linkedDeals.some((d) => !d.isSubscribed);
  // The barcode already belongs to a subscribed local deal — creating
  // another product with it makes no sense, so hide that path.
  const hasSubscribedLocalDeal = linkedDeals.some(
    (d) => d.isLocalDeal && d.isSubscribed,
  );
  const showFallback = !hasSubscribedLocalDeal;

  return (
    <AppModal
      show={show}
      callback={onClose}
      className="tw:h-auto tw:max-h-[90vh] tw:w-full tw:max-w-lg"
      isAutoHeight
    >
      <AppModal.Title onClose={onClose}>
        <span className="tw:flex tw:items-center tw:gap-2.5 tw:text-base tw:font-semibold">
          <span
            className={`tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg ${
              subscribed ? "tw:bg-emerald-50" : "tw:bg-primary/10"
            }`}
          >
            {subscribed ? (
              <CheckCircle2 className="tw:h-4.5 tw:w-4.5 tw:text-emerald-600" />
            ) : (
              <PackageSearch className="tw:h-4.5 tw:w-4.5 tw:text-primary" />
            )}
          </span>
          {subscribed
            ? t("addedToYourCart")
            : isMany
              ? t("barcodeFoundTitlePlural")
              : t("barcodeFoundTitle")}
        </span>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[60vh] tw:overflow-y-auto">
        {subscribed ? (
          <div className="tw:flex tw:flex-col tw:gap-4 tw:animate-in tw:fade-in tw:zoom-in-95">
            <div className="tw:flex tw:items-start tw:gap-3 tw:rounded-xl tw:bg-emerald-50 tw:p-4">
              <CheckCircle2 className="tw:h-6 tw:w-6 tw:shrink-0 tw:text-emerald-600" />
              <div className="tw:flex tw:flex-col tw:gap-1">
                <p className="tw:text-sm tw:font-semibold tw:text-emerald-900">
                  {t("addedToSubscribeCart", { name: subscribed.dealName })}
                </p>
                <p className="tw:text-xs tw:leading-relaxed tw:text-emerald-800">
                  {t("canFinishSubscribingFromCart")}
                </p>
              </div>
            </div>

            <div className="tw:flex tw:items-center tw:gap-2.5 tw:rounded-xl tw:bg-blue-50 tw:p-3">
              <ShoppingCart className="tw:h-5 tw:w-5 tw:shrink-0 tw:text-blue-600" />
              <p className="tw:text-sm tw:leading-relaxed tw:text-blue-900">
                {t("goToSubscribeCartQuestion")}
              </p>
            </div>
          </div>
        ) : (
          <div className="tw:flex tw:flex-col tw:gap-4">
            {/* 1. Scanned barcode — styled like the physical product label */}
            {barcode ? (
              <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:px-3 tw:py-2 tw:shadow-xs">
                <div
                  aria-hidden
                  className="tw:h-6 tw:w-9 tw:shrink-0 tw:opacity-80"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, #18181b 0 2px, transparent 2px 4px, #18181b 4px 5px, transparent 5px 8px, #18181b 8px 11px, transparent 11px 12px, #18181b 12px 13px, transparent 13px 15px, #18181b 15px 18px, transparent 18px 20px, #18181b 20px 21px, transparent 21px 24px, #18181b 24px 26px, transparent 26px 27px, #18181b 27px 28px, transparent 28px 30px, #18181b 30px 33px, transparent 33px 34px, #18181b 34px 36px, transparent 36px)",
                  }}
                />
                <div className="tw:flex tw:min-w-0 tw:flex-col">
                  <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wider tw:text-gray-400">
                    {t("barcodeLabel", { defaultValue: "Barcode" })}
                  </span>
                  <span className="tw:truncate tw:font-mono tw:text-sm tw:font-semibold tw:tracking-[0.12em] tw:text-gray-900">
                    {barcode}
                  </span>
                </div>
              </div>
            ) : null}

            {/* 2. Matching catalog deals — the primary path */}
            {linkedDeals.length > 0 && (
              <div className="tw:flex tw:flex-col tw:gap-2">
                <p className="tw:text-xs tw:leading-relaxed tw:text-gray-500">
                  {hasUnsubscribedCatalogDeals
                    ? t("matchingCatalogProducts", {
                        defaultValue:
                          "This barcode matches these catalog products. Add one to your store:",
                      })
                    : t("alreadySubscribedCatalogProducts", {
                        defaultValue:
                          "You are already subscribed to these catalog products:",
                      })}
                </p>
                <ul className="tw:flex tw:flex-col tw:gap-3">
                  {linkedDeals.map((d, index) => {
                    const imagesArray = Array.isArray(d.images)
                      ? d.images
                      : typeof d.images === "string"
                        ? [d.images]
                        : [];
                    const firstImage = imagesArray.find(
                      (img) => typeof img === "string" && img.trim() !== "",
                    );
                    const mrp = Number(d.mrp) || 0;
                    return (
                      <li
                        key={`${d.dealId ?? d.dealName ?? "deal"}-${index}`}
                        className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-3 tw:transition-all tw:hover:border-gray-300 tw:hover:shadow-sm tw:animate-in tw:fade-in tw:slide-in-from-bottom-2"
                        style={{
                          animationDelay: `${index * 60}ms`,
                          animationFillMode: "backwards",
                        }}
                      >
                        {firstImage ? (
                          <ImgRender
                            assetId={firstImage}
                            alt={d.dealName}
                            className="tw:h-12 tw:w-12 tw:shrink-0 tw:rounded-lg tw:bg-gray-50 tw:object-contain tw:ring-1 tw:ring-gray-100"
                          />
                        ) : (
                          <div className="tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-gray-100 tw:text-2xl">
                            📦
                          </div>
                        )}
                        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
                          <span className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap tw:text-sm tw:font-semibold tw:text-gray-900 tw:leading-snug">
                            <span>{d.dealName || d.name}</span>
                            {d.isLocalDeal && (
                              <DealScopeBadge
                                isLocalDeal={true}
                                size="xs"
                                className="tw:shrink-0"
                              />
                            )}
                          </span>
                          {d.dealId ? (
                            <span className="tw:font-mono tw:text-[10px] tw:text-gray-400">
                              ID: {d.dealId}
                            </span>
                          ) : null}
                          {mrp ? (
                            <span className="tw:text-xs tw:text-gray-600">
                              {t("mrpLabel")}{" "}
                              <span className="tw:font-semibold tw:text-gray-900">
                                ₹{mrp}
                              </span>
                            </span>
                          ) : null}
                        </div>

                        {d.isSubscribed ? (
                          <span className="tw:text-xs tw:font-semibold tw:text-emerald-600 tw:shrink-0">
                            {t(
                              "inventorySubscribe:search.table.actions.subscribed",
                              {
                                defaultValue: "Subscribed",
                              },
                            )}
                          </span>
                        ) : d._id || d.dealId || d.sellerDealId ? (
                          <SubscribeBtn
                            dealId={String(d._id ?? d.dealId ?? d.sellerDealId)}
                            dealName={d.dealName || d.name || ""}
                            mrp={mrp}
                            price={Number(d.price ?? d.b2bPrice) || 0}
                            images={imagesArray}
                            size="small"
                            color="success"
                            callback={handleSubscribeCallback(d)}
                            className="tw:shrink-0"
                          >
                            {t("subscribe")}
                          </SubscribeBtn>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Decision fork between the two paths */}
            {showFallback && linkedDeals.length > 0 && (
              <div className="tw:flex tw:items-center tw:gap-3" aria-hidden>
                <span className="tw:h-px tw:flex-1 tw:bg-gray-200" />
                <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-widest tw:text-gray-400">
                  {t("orDivider", { defaultValue: "or" })}
                </span>
                <span className="tw:h-px tw:flex-1 tw:bg-gray-200" />
              </div>
            )}

            {/* 3. Fallback path — create a new product, or, when the user
                is already in the add-product form, use the barcode anyway.
                Hidden entirely when the barcode already belongs to a
                subscribed local deal. */}
            {showFallback && (
              <div className="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-xl tw:bg-gray-50 tw:p-4">
                {hideCreateProduct ? (
                  <>
                    <p className="tw:text-xs tw:leading-relaxed tw:text-gray-500">
                      {t("useBarcodeAnywayDesc", {
                        defaultValue:
                          "None of these match what you're selling? You can still use this barcode for your product.",
                      })}
                    </p>
                    <AppButton
                      fill="outline"
                      color="medium"
                      expand="full"
                      className="tw:bg-white"
                      onClick={handleUseBarcode}
                    >
                      {t("useBarcodeAnyway", {
                        defaultValue: "Use Barcode Anyway",
                      })}
                    </AppButton>
                  </>
                ) : (
                  <>
                    <p className="tw:text-xs tw:leading-relaxed tw:text-gray-500">
                      {linkedDeals.length > 0
                        ? t("createNewProductForBarcodeDesc", {
                            defaultValue:
                              "None of these match what you're selling? Create your own product with this barcode.",
                          })
                        : t("createNewProductNoMatchDesc", {
                            defaultValue:
                              "Create your own product with this barcode in your store.",
                          })}
                    </p>
                    <AppButton
                      fill="outline"
                      color="medium"
                      expand="full"
                      className="tw:bg-white"
                      onClick={handleCreateProduct}
                    >
                      <Plus className="tw:h-4 tw:w-4 tw:mr-1" />
                      {t("createNewProduct", {
                        defaultValue: "Create New Product",
                      })}
                    </AppButton>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer className="tw:flex-col tw:gap-2 tw:sm:flex-row tw:sm:justify-end!">
        {subscribed ? (
          <>
            <AppButton
              fill="outline"
              color="light"
              className="tw:w-full tw:sm:w-auto"
              onClick={onClose}
            >
              {t("stayHere")}
            </AppButton>
            <AppButton
              className="tw:w-full tw:sm:w-auto"
              onClick={handleGoToCart}
            >
              {t("goToSubscribeCart")}{" "}
              <ArrowRight className="tw:h-4 tw:w-4 tw:ml-1" />
            </AppButton>
          </>
        ) : (
          <AppButton
            fill="outline"
            color="light"
            className="tw:w-full tw:sm:w-auto"
            onClick={onClose}
          >
            {t("cancel")}
          </AppButton>
        )}
      </AppModal.Footer>
    </AppModal>
  );
};

export default BarcodeLinkedProductsModal;
