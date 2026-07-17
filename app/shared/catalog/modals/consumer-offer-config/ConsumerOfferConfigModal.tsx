import { Package, Settings, Trash } from "lucide-react";
import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";

interface ConsumerOfferConfigModalProps {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  feature: "subscribe" | "inventory";
  cartId?: string;
  dealData?: {
    dealName: string;
    dealId: string;
    mrp: number;
    b2cPrice: number;
    price?: number;
    unitType?: string;
    hsn?: string;
    gst?: number;
    description?: string;
    itemId?: string;
    index?: number;
    brand?: any;
    category?: any;
    isConsumerOffer?: boolean;
    consumerOfferData?: string;
    consumerOfferPrice?: number;
  };
}

interface ConsumerOfferFormData {
  offerTitle: string;
  offerPrice: number;
}

export default function ConsumerOfferConfigModal({
  show,
  callback,
  feature,
  dealData,
  cartId,
}: ConsumerOfferConfigModalProps) {
  const { register, handleSubmit, reset, getValues, control } =
    useForm<ConsumerOfferFormData>();

  const { t } = useTranslation(["common"]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const appToast = useAppToast();
  const [enabled, setEnabled] = React.useState(true);

  const [offerTitle] = useWatch({
    control,
    name: ["offerTitle"],
  });

  // Auto-populate only when consumer offer is enabled on the product
  React.useEffect(() => {
    if (!show) return;
    // default to enabled each time modal opens
    setEnabled(true);
    if (!dealData?.isConsumerOffer) return;
    reset({
      offerTitle:
        (dealData?.isConsumerOffer && dealData?.consumerOfferData) || "",
    });
  }, [show, dealData, reset]);

  const doSubmit = async (data: ConsumerOfferFormData, enabled?: boolean) => {
    // Update cart item with consumer offer details
    try {
      setIsSubmitting(true);
      const offerTitle = (data.offerTitle || "").trim();

      let payload: any;
      if (dealData?.isConsumerOffer && !enabled) {
        // when disabled, unset the offer details
        payload = {
          isConsumerOffer: false,
          consumerOfferData: null,
          consumerOfferPrice: null,
        };
      } else {
        if (!offerTitle) {
          appToast.show({
            msg: t("consumerOffer.offerTitleRequired"),
            color: "danger",
          });
          return;
        }
        payload = {
          isConsumerOffer: true,
          consumerOfferData: offerTitle,
          consumerOfferPrice: null,
        };
      }

      if (feature === "subscribe" && cartId && dealData?.itemId) {
        try {
          let targetItemId = dealData.itemId;
          let cloneResult: any = undefined;

          if (payload?.isConsumerOffer) {
            cloneResult = await InventorySubscribeService.createRequest({
              name: dealData.dealName + " - " + offerTitle,
              dealName: dealData.dealName + " - " + offerTitle,
              quantity: 0,
              isCloned: true,
              mrp: dealData.mrp,
              price: AuthService.isMasterLogin()
                ? dealData.mrp
                : dealData.price,
              unitType: dealData.unitType,
              hsnNumber: dealData.hsn,
              gst: dealData.gst,
              description: dealData.description,
              clonedFrom: dealData.dealId,
            });

            if (cloneResult.statusCode !== 200) {
              appToast.show({
                msg:
                  cloneResult.data?.message ||
                  t("consumerOffer.failedToCloneProduct"),
                color: "danger",
              });
              setIsSubmitting(false);
              return;
            }

            targetItemId = cloneResult.data?.data?.itemId || targetItemId;
          }

          const response = await InventorySubscribeService.updateCartItem(
            cartId,
            targetItemId,
            payload
          );

          if (response.statusCode === 200) {
            const wasPreviouslyEnabled = !!dealData?.isConsumerOffer;
            const isNowEnabled = !!payload?.isConsumerOffer;
            let successMsg = t("consumerOffer.updatedSuccessfully");
            if (wasPreviouslyEnabled && !isNowEnabled) {
              successMsg = t("consumerOffer.disabledForProduct");
            } else if (!wasPreviouslyEnabled && isNowEnabled) {
              successMsg = t("consumerOffer.enabledForProduct");
            }

            appToast.show({ msg: successMsg, color: "success" });

            // If a clone was created earlier, include its info so parent can
            // insert the new offer row into the cart list.
            const createdItem =
              cloneResult && cloneResult.data && cloneResult.data.data
                ? {
                    itemId: cloneResult.data.data.itemId,
                    name: dealData.dealName + " - " + offerTitle,
                    dealName: dealData.dealName,
                    clonedFrom: dealData.dealId,
                    mrp: dealData.mrp,
                    price: AuthService.isMasterLogin()
                      ? dealData.mrp
                      : dealData.price,
                    unitType: dealData.unitType,
                    hsn: dealData.hsn,
                    gst: dealData.gst,
                    description: dealData.description,
                    brand: dealData.brand,
                    category: dealData.category,
                  }
                : undefined;

            callback({
              action: "submit",
              data: { index: dealData?.index, ...payload, createdItem },
            });
          } else {
            appToast.show({
              msg: response?.data?.message || t("failedToUpdateProduct"),
              color: "danger",
            });
          }
        } catch (e: any) {
          appToast.show({
            msg: e?.message || t("failedToUpdateProduct"),
            color: "danger",
          });
        }
      } else if (feature !== "subscribe") {
        const mainDealResp = await SellerCatalogService.getProducts({
          filter: {
            dealId: dealData?.dealId,
          },
        });
        const d = mainDealResp.data?.data?.[0];

        if (!d._id) {
          appToast.show({
            msg: t("consumerOffer.mainDealNotFound"),
            color: "danger",
          });
          setIsSubmitting(false);
          return;
        }

        const formattedDeal = SellerCatalogService.formatProductResponse([
          d,
        ])[0];

        const response = await InventorySubscribeService.importStoreProduct({
          ...payload,
          productName: formattedDeal.name + " - " + offerTitle,
          dealId: dealData?.dealId,
          dealName: formattedDeal.name + " - " + offerTitle,
          dealRefId: formattedDeal.id,
          qty: 0,
          mrp: formattedDeal.mrp,
          price: 0,
          purchasePrice: 0,
          barcode: formattedDeal._raw?.barcodes?.[0] || "",
          uom: "PCS",
          hsnNumber: formattedDeal._raw?.hsn || "",
          brand: {
            id: formattedDeal.brand?._id,
            brandId: formattedDeal.brand?.id,
            name: formattedDeal.brand?.name,
          },
          category: {
            id: formattedDeal.category?._id,
            categoryId: formattedDeal.category?.id,
            name: formattedDeal.category?.name,
          },
          menu: {
            id: formattedDeal.menu?._id,
            menuId: formattedDeal.menu?.id,
            name: formattedDeal.menu?.name,
          },
          images: formattedDeal.images,
        });

        if (response.statusCode === 200) {
          appToast.show({
            msg: t("consumerOffer.submittedSuccessfully"),
            color: "success",
          });
          callback({
            action: "submit",
            data: {
              index: dealData?.index,
              ...payload,
            },
          });
        } else {
          appToast.show({
            msg: response?.data?.message || t("consumerOffer.failedToSubmit"),
            color: "danger",
          });
        }
      } else {
        appToast.show({
          msg: t("consumerOffer.missingCartOrItemInfo"),
          color: "danger",
        });
      }
    } catch (err: any) {
      appToast.show({
        msg: err?.message || t("consumerOffer.failedToSubmit"),
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
      reset();
    }
  };

  const handleFormSubmit = async (data: ConsumerOfferFormData) => {
    doSubmit(data);
  };

  const handleClose = () => {
    reset();
    setEnabled(true);
    callback({ action: "close" });
  };

  const handleRemoveOffer = () => {
    reset({
      offerTitle: "",
      offerPrice: 0,
    });
    doSubmit(getValues(), false);
  };

  return (
    <AppModal
      show={show}
      callback={() => handleClose()}
      className="tw:h-[80vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <h2 className="tw:text-lg tw:font-semibold">
          {t("consumerOffer.enterConsumerOfferDetails")}
        </h2>
      </AppModal.Title>

      <AppModal.Content className="modal-bg tw:max-h-[80vh]">
        {/* Consumer Offer Explanation */}
        <InfoBlock
          variant="info"
          className="tw:mb-2 tw:mt-4"
          size="sm"
          bordered
        >
          <div className="tw:text-sm tw:font-medium tw:mb-1">
            {t("consumerOffer.howItWorks")}
          </div>
          <div className="tw:text-xs tw:flex tw:flex-col tw:gap-1">
            <div className="tw:flex tw:items-start tw:gap-2">
              <span className="tw:font-medium">1.</span>
              {t("consumerOffer.enterOfferTitle")}
            </div>
            <div className="tw:flex tw:items-start tw:gap-2">
              <span className="tw:font-medium">2.</span>
              {t("consumerOffer.dealClonedForApproval")}
            </div>
            <div className="tw:flex tw:items-start tw:gap-2">
              <span className="tw:font-medium">3.</span>
              {t("consumerOffer.afterApprovalSell")}
            </div>
          </div>
        </InfoBlock>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="tw:space-y-6"
        >
          {/* Deal Information Display */}
          {dealData && (
            <AppCard
              title={t("consumerOffer.mainDealInformation")}
              icon={<Package className="tw:h-4 tw:w-4" />}
            >
              <div className="tw:space-y-4">
                {/* Deal Name - Full Width with ID */}
                <KeyValue label={t("dealName")} size="sm">
                  {dealData.dealName}
                </KeyValue>
              </div>
            </AppCard>
          )}

          {/* Offer Configuration Form */}
          <AppCard
            title={t("consumerOffer.configureConsumerOffer")}
            icon={<Settings className="tw:h-4 tw:w-4" />}
          >
            <div className="tw:space-y-4">
              {/* {dealData?.isConsumerOffer ? (
                <div className="tw:flex tw:items-center tw:space-x-2 tw:bg-gray-50 tw:px-4 tw:py-2 tw:rounded-lg tw:border tw:border-gray-600">
                  <Checkbox
                    id="enable-offer"
                    checked={enabled}
                    onCheckedChange={(checked) => setEnabled(!!checked)}
                    className="tw:border-gray-800"
                  />
                  <label
                    htmlFor="enable-offer"
                    className="tw:text-xs tw:text-gray-700 tw:cursor-pointer tw:font-medium"
                  >
                    Enable offer for this product
                  </label>
                </div>
              ) : null} */}

              {(!dealData?.isConsumerOffer || enabled) && (
                <>
                  <AppInput
                    name="offerTitle"
                    placeholder={t(
                      "consumerOffer.enterConsumerOfferTitlePlaceholder"
                    )}
                    register={register}
                    isRequired
                  />

                  {offerTitle && offerTitle.toString().trim() !== "" ? (
                    <div className="tw:text-sm tw:font-medium tw:mt-2 tw:flex tw:flex-col tw:gap-1">
                      <span className="tw:text-gray-500 tw:text-xs">
                        {t("consumerOffer.consumerOfferTitleLabel")}
                      </span>
                      {dealData?.dealName} - {offerTitle}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </AppCard>
        </form>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:gap-3 tw:justify-between tw:w-full">
          <div>
            {dealData?.isConsumerOffer ? (
              <AppButton
                fill="outline"
                color="danger"
                onClick={handleRemoveOffer}
                size="small"
              >
                <Trash />
                {t("consumerOffer.removeConsumerOffer")}
              </AppButton>
            ) : null}
          </div>
          <div className="tw:flex tw:gap-3">
            <AppButton fill="outline" color="dark" onClick={handleClose}>
              {t("cancel")}
            </AppButton>
            <AppButton
              type="submit"
              disabled={isSubmitting}
              onClick={handleSubmit(handleFormSubmit)}
              isLoading={isSubmitting}
            >
              {feature === "subscribe"
                ? t("submit")
                : t("consumerOffer.submitForApproval")}
            </AppButton>
          </div>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
}
