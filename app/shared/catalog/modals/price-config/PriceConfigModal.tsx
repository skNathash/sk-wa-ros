import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import ImgRender from "~/components/core/img/ImgRender";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import SellerCatalogService from "~/services/SellerCatalogService";
import UomPriceService from "~/services/UomPriceService";
import {
  clampDiscount,
  getFinalPrice,
  MAX_DISCOUNT_PERCENT,
} from "~/shared/catalog/helpers/price-calc";
import {
  getDetails,
  getPruchasePrice,
  updateDiscount,
  updateGroupPrice,
  validationSchema,
} from "./helper";
import RecentPriceChanges from "./RecentPriceChanges";
import CompetitorPrice from "~/shared/catalog/components/competitor-price/CompetitorPrice";
import clsx from "clsx";

// Categories where retailers price to a fixed amount rather than an MRP
// discount (phones, appliances, etc.), so the modal defaults to fixed price.
const ELECTRONICS_KEYWORDS = [
  "electronic",
  "mobile",
  "appliance",
  "laptop",
  "computer",
  "gadget",
];

const isElectronicsCategory = (deal: any) => {
  const name = (deal?.category?.name).toLowerCase();
  return ELECTRONICS_KEYWORDS.some((kw) => name.includes(kw));
};

type FormData = {
  price: number | null;
  discount: number | null;
  // additional scheme removed
};

const priceModeOptions = [
  {
    value: "fixed",
    label: "Fixed Price",
    langKey: "fixed",
  },
  {
    value: "on_mrp",
    label: "On MRP",
    langKey: "onMrp",
  },
];

const defaultFormData: FormData = {
  price: null,
  discount: null,
  // additional scheme removed
};

/**
 * Buyer group the price is being set for. When passed, the modal edits that
 * group's B2B price instead of the deal-level one — the update goes to the
 * same RSP config API with `groupId` attached.
 */
export type PriceConfigGroup = {
  id: string;
  name: string;
  /** Price the group currently carries; falls back to the deal's B2B price. */
  price?: number;
  /** "Fixed" / "Normal" — seeds the price mode. */
  discountType?: string;
  discount?: number;
};

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  dealId?: string;
  type?: "network" | "customer";
  group?: PriceConfigGroup;
};

const getCurrentPrice = (
  deal: any,
  type: "network" | "customer" = "customer",
  group?: PriceConfigGroup,
) => {
  if (group) return group.price || deal?.b2bPrice || 0;
  return type === "network" ? deal?.b2bPrice || 0 : deal?.b2cPrice || 0;
};

const PriceConfigModal = ({ show, callback, dealId, type, group }: Props) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();
  const formMethods = useForm<FormData>({
    resolver: yupResolver(validationSchema as any),
    defaultValues: defaultFormData,
  });

  const {
    handleSubmit,
    setValue,
    register,
    reset,
    control,
    formState: { errors },
    getValues,
  } = formMethods;

  const [loading, setLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [deal, setDeal] = useState<any>(null);

  const [newMargin, setNewMargin] = useState(0);

  const [priceMode, setPriceMode] = useState<
    "fixed" | "on_mrp" | "on_purchase"
  >("fixed");

  const [profitData, setProfitData] = useState<{
    profit: number;
    isProfitable: boolean;
    percentage: number;
  }>({ profit: 0, isProfitable: false, percentage: 0 });

  const [price] = useWatch({
    control: control,
    name: ["price"],
  });

  const uom = deal?.selectedStockUom;
  const displayUom = UomPriceService.getDisplayUom(uom);

  const currentPrice = UomPriceService.toDisplayPrice(
    getCurrentPrice(deal, type, group),
    uom,
  );
  const displayMrp = UomPriceService.toDisplayPrice(deal?.mrp, uom);
  const displayPurchasePrice = UomPriceService.toDisplayPrice(
    getPruchasePrice(deal, type),
    uom,
  );

  const profitOnPurchasePrice =
    (price || currentPrice) - (displayPurchasePrice || 0);

  // Compare the live (being-typed) price against competitors on the API scale,
  // so the verdict updates as the retailer edits.
  const livePriceForCompare =
    price != null && !isNaN(Number(price))
      ? Number(UomPriceService.toApiPrice(Number(price), uom))
      : getCurrentPrice(deal, type, group);

  const handleClose = () => {
    callback({ action: "close" });
  };

  useEffect(() => {
    if (show) {
      reset(defaultFormData);
      setProfitData({ profit: 0, isProfitable: false, percentage: 0 });
      const fetchData = async () => {
        setLoading(true);
        const deal: any = await getDetails(dealId || "");
        setDeal(deal);
        setLoading(false);
        // set price from deal (converted to display UOM if applicable)
        setValue(
          "price",
          UomPriceService.toDisplayPrice(
            getCurrentPrice(deal, type, group),
            deal?.selectedStockUom,
          ),
        );

        // determine price mode from deal's discount type (b2bDiscountType or b2cDiscountType)
        const resolvePriceModeFromDeal = (d: any) => {
          // A group carries its own discount type; otherwise prefer
          // b2bDiscountType for network type and b2cDiscountType for customer.
          const discountType = group
            ? group.discountType
            : type === "network"
              ? d?.b2bDiscountType
              : d?.b2cDiscountType;

          // Normalize and check for 'Fixed'
          if (
            typeof discountType === "string" &&
            discountType.toLowerCase() === "fixed"
          ) {
            return "fixed";
          }

          // Electronics-style categories are priced to a fixed amount by
          // default rather than an MRP discount.
          if (isElectronicsCategory(d)) {
            return "fixed";
          }

          // Otherwise decide based on prop `type`
          return "on_mrp";
        };

        try {
          const initialMode = resolvePriceModeFromDeal(deal || {});
          setPriceMode(initialMode);
        } catch (e) {
          // fallback to existing default
        }

        setValue(
          "discount",
          group
            ? group.discount || 0
            : type === "network"
              ? deal?.b2bDiscount
              : deal?.b2cDiscount,
        );

        // additional scheme removed

        handlePriceChange(deal);
      };
      if (dealId) {
        fetchData();
      }
    }
  }, [show, dealId, group?.id]);

  const handleDiscountChange = (dealInfo: any) => {
    const { value: finalVal, capped } = clampDiscount(getValues("discount"));

    if (capped) {
      appToast.show({
        msg: `Maximum discount is ${MAX_DISCOUNT_PERCENT}%`,
        color: "warning",
      });
    }

    setValue("discount", finalVal);

    // Same rule the bulk price setter previews with.
    setValue(
      "price",
      getFinalPrice({
        mrp: dealInfo?.mrp,
        uom: dealInfo?.selectedStockUom,
        mode: "on_mrp",
        value: finalVal,
      }),
    );
    // handlePriceChange(dealInfo);
  };

  const handlePriceChange = (dealInfo: any) => {
    const dealUom = dealInfo?.selectedStockUom;
    const v = Number(getValues("price"));
    setValue("price", v < 0 ? null : v);
    const dealMrp = UomPriceService.toDisplayPrice(dealInfo?.mrp, dealUom);
    if (v > dealMrp) {
      setValue("price", dealMrp);
    }

    let calcMrp = dealMrp;
    if (type == "network") {
      calcMrp = UomPriceService.toDisplayPrice(
        getPruchasePrice(dealInfo, type),
        dealUom,
      );
    }

    const newMargin = ((calcMrp - v) / calcMrp) * 100;
    setNewMargin(newMargin < 0 ? 0 : newMargin);

    // Calculate profit using SellerCatalogService
    const pnlData = SellerCatalogService.calculatePnL(
      type || "customer",
      getValues("price") || 0,
      type === "network"
        ? UomPriceService.toDisplayPrice(
            getPruchasePrice(dealInfo, type),
            dealUom,
          )
        : UomPriceService.toDisplayPrice(dealInfo?.mrp, dealUom),
    );
    setProfitData(pnlData);
  };

  const onSubmit = async (data: any) => {
    setSubmitting(true);

    try {
      // Build payload based on selected price mode
      const payload: any = {
        franchiseId: AuthService.getLoggedInUserId(),
        discount: 0,
        id: dealId,
        sellerDealObjId: deal?.sellerDealObjId,
        applicableFor: type === "network" ? "Network" : "Customer",
        configOnType: "Deal",
      };

      const apiPrice = Number(
        UomPriceService.toApiPrice(data.price, deal?.selectedStockUom),
      );

      if (priceMode === "fixed") {
        payload.isFixedPrice = true;
        payload.fixedPrice = apiPrice || 0;
        payload.discount = 0;
      } else {
        payload.isFixedPrice = false;
        payload.fixedPrice = 0;
        payload.discount = data.discount;
      }

      // additional scheme removed from payload

      // A group price is written on the seller-deal document; everything else
      // goes through the RSP config API.
      const response = group?.id
        ? await updateGroupPrice(deal?.sellerDealObjId || "", group.id, {
            price: apiPrice || 0,
            discount: priceMode === "fixed" ? 0 : data.discount || 0,
            discountType: priceMode === "fixed" ? "Fixed" : "Normal",
          })
        : await updateDiscount({ ...payload });

      if (response.status === "success") {
        appToast.show({
          msg: response.msg,
          color: "success",
        });
        callback({
          action: "update",
          data: {
            price: apiPrice,
            discount: priceMode === "fixed" ? 0 : data.discount,
            isFixedPrice: priceMode === "fixed",
            fixedPrice: priceMode === "fixed" ? apiPrice || 0 : 0,
            dealId,
            type,
            groupId: group?.id,
            // additional scheme removed from callback data
          },
        });
      } else {
        appToast.show({
          msg: response.msg || t("failedToSubmitConfiguration"),
          color: "danger",
        });
      }
    } catch (error) {
      appToast.show({
        msg: t("failedToSubmitConfiguration"),
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AppModal show={show} callback={callback} className="tw:max-h-[80vh]">
        <AppModal.Title onClose={handleClose} noShadow>
          <div className="tw:font-semibold">
            {group
              ? `Update B2B Pricing · ${group.name}`
              : type === "network"
                ? "Update B2B Pricing"
                : "Update B2C Pricing"}
          </div>
          {group ? (
            <div className="tw:text-xs tw:text-gray-500">
              This price applies only to retailers in this group.
            </div>
          ) : null}
        </AppModal.Title>
        <AppModal.Content className="tw:max-h-[80vh]">
          {loading ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
              <AppSpinner />
            </div>
          ) : null}

          {!loading ? (
            <FormProvider {...formMethods}>
              <div className="tw:px-0.5">
                {deal?._id ? (
                  <>
                    {/* Deal Info Section */}
                    <div className="tw:flex tw:items-start tw:gap-3 tw:mb-4 tw:pb-4 tw:border-b tw:border-gray-200">
                      {/* Product Image */}
                      <div className="tw:flex-shrink-0">
                        {deal.images?.[0] ? (
                          <ImgRender
                            assetId={deal.images[0]}
                            alt={deal.name}
                            className="tw:w-16 tw:h-16 tw:object-contain tw:rounded"
                          />
                        ) : (
                          <div className="tw:w-16 tw:h-16 tw:flex tw:items-center tw:justify-center tw:bg-gray-100 tw:rounded">
                            <span className="tw:text-gray-400 tw:text-2xl">
                              📦
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Name, ID, and Movement Type */}
                      <div className="tw:flex-1 tw:min-w-0">
                        <div className="tw:text-base tw:font-semibold tw:leading-tight tw:mb-2">
                          {deal.name}
                        </div>
                        <div className="tw:flex tw:items-center tw:flex-wrap tw:gap-1">
                          <span className="tw:bg-gray-100 tw:text-gray-600 tw:px-1.5 tw:py-1 tw:rounded tw:text-xs tw:font-medium">
                            {deal.id}
                          </span>
                          {deal.movementType && (
                            <AppBadge
                              variant={deal._movementTypeColor || "default"}
                            >
                              {deal.movementType}
                            </AppBadge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="tw:mt-4">
                      <div className="tw:text-base tw:font-medium tw:mb-2">
                        {t("setNewDiscount")}
                      </div>
                      <div className="tw:flex tw:gap-6 tw:items-end">
                        <div className="tw:w-40">
                          <AppSelect
                            label={t("priceMode")}
                            options={priceModeOptions}
                            value={priceMode}
                            onChange={(v: any) => {
                              setPriceMode(v);
                              setValue("price", null);
                              setValue("discount", null);
                            }}
                            inputClassName="tw:w-full"
                          />
                        </div>
                        <div
                          className={clsx("tw:w-36", {
                            "tw:hidden": priceMode !== "fixed",
                          })}
                        >
                          <AppInput
                            type="number"
                            label={`${
                              type === "network"
                                ? `New ${t("b2bPrice")}`
                                : `New ${t("b2cPrice")}`
                            }${displayUom ? ` (per ${displayUom})` : ""}`}
                            name="price"
                            register={register}
                            placeholder={t("enterPrice")}
                            className="tw:w-full"
                            onChange={() => handlePriceChange(deal)}
                            error={errors.price?.message}
                          />
                        </div>

                        <div
                          className={clsx("tw:w-36", {
                            "tw:hidden": priceMode !== "on_mrp",
                          })}
                        >
                          <AppInput
                            type="number"
                            label={
                              type === "network"
                                ? `${t("margin")} (%)`
                                : `${t("discount")} (%)`
                            }
                            name="discount"
                            register={register}
                            placeholder={
                              type === "network" ? t("margin") : t("discount")
                            }
                            className="tw:w-full"
                            onChange={() => handleDiscountChange(deal)}
                            error={errors.discount?.message}
                            isRequired
                          />
                        </div>

                        <div className="tw:self-center">
                          <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                            {type === "network"
                              ? `Current ${t("b2bPrice")}`
                              : `Current ${t("b2cPrice")}`}
                          </div>
                          <div className="tw:flex tw:items-baseline tw:gap-1">
                            <Amount value={currentPrice} decimalPlaces={2} />
                            {deal?.selectedStockUom && (
                              <span className="tw:text-xs tw:text-gray-500">
                                /{displayUom}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="tw:text-xs tw:text-slate-700 tw:mt-2">
                        {type === "network"
                          ? "The margin is applied on purchase price to calculate the price."
                          : "The discount is applied on MRP to calculate the price."}
                      </div>
                    </div>

                    {/* Competitor price reference — only shown for electronics
                        franchises, and when there's actually competitor data to
                        price against */}
                    {(deal.partnerPriceData?.amazon ||
                      deal.partnerPriceData?.flipkart ||
                      deal.partnerPriceData?.others?.length > 0) && (
                      <div className="tw:mt-4">
                        <div className="tw:text-base tw:font-medium tw:mb-2">
                          Online Prices
                        </div>
                        <CompetitorPrice
                          partnerPriceData={deal.partnerPriceData}
                          price={livePriceForCompare}
                          dealId={deal?._id || deal?.id}
                          onRefreshed={(partnerPriceData) =>
                            setDeal((prev: any) =>
                              prev ? { ...prev, partnerPriceData } : prev,
                            )
                          }
                        />
                      </div>
                    )}

                    <div className="tw:bg-slate-50 tw:p-2 tw:rounded-md tw:mb-4 tw:mt-4">
                      <div className="tw:grid tw:grid-cols-2 tw:gap-2">
                        <KeyValue label={t("mrp")} size="sm">
                          <div className="tw:flex tw:items-baseline tw:gap-1">
                            <Amount value={displayMrp} decimalPlaces={2} />
                            {deal?.selectedStockUom && (
                              <span className="tw:text-xs tw:text-gray-500">
                                /{displayUom}
                              </span>
                            )}
                          </div>
                        </KeyValue>

                        <KeyValue
                          label={
                            type === "network"
                              ? t("newB2bPrice")
                              : t("newB2cPrice")
                          }
                          size="sm"
                        >
                          <div className="tw:flex tw:items-baseline tw:gap-1">
                            <Amount value={price || 0} decimalPlaces={2} />
                            {deal?.selectedStockUom && (
                              <span className="tw:text-xs tw:text-gray-500">
                                /{displayUom}
                              </span>
                            )}
                          </div>
                        </KeyValue>

                        <KeyValue label={t("purchasePrice")} size="sm">
                          <div className="tw:flex tw:items-baseline tw:gap-1">
                            <Amount
                              value={displayPurchasePrice}
                              decimalPlaces={2}
                              className="tw:text-primary tw:font-bold"
                            />
                            {deal?.selectedStockUom && (
                              <span className="tw:text-xs tw:text-gray-500">
                                /{displayUom}
                              </span>
                            )}
                          </div>
                        </KeyValue>

                        <KeyValue label={t("profitOnPurchasePrice")} size="sm">
                          <Amount
                            value={profitOnPurchasePrice}
                            decimalPlaces={2}
                            className={`tw:font-bold ${
                              profitOnPurchasePrice > 0
                                ? "tw:text-green-500"
                                : "tw:text-red-500"
                            }`}
                          />
                        </KeyValue>
                      </div>
                    </div>

                    {/* Recent Price Changes UI - Moved to last */}
                    <div className="tw:mt-6">
                      <RecentPriceChanges
                        priceChangeHistory={deal.priceChangeHistory}
                        type={type}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </FormProvider>
          ) : null}
        </AppModal.Content>
        {/* Footer with action buttons, shown only if deal has _id */}
        {deal?._id ? (
          <AppModal.Footer>
            <div className="tw:flex tw:justify-end tw:gap-2 tw:mt-0">
              <AppButton
                fill="outline"
                onClick={handleClose}
                disabled={submitting}
                color="dark"
              >
                {t("cancel")}
              </AppButton>
              <AppButton
                onClick={handleSubmit(onSubmit)}
                isLoading={submitting}
                color="success"
              >
                {t("updatePrice")}
              </AppButton>
            </div>
          </AppModal.Footer>
        ) : null}
      </AppModal>
    </>
  );
};

export default PriceConfigModal;
