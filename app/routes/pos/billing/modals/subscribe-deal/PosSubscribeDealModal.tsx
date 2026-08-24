import { BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import PosService from "~/services/PosService";
import SellerCatalogService from "~/services/SellerCatalogService";
import UomPriceService from "~/services/UomPriceService";
import ProductInfo from "./components/ProductInfo";
import StockForm from "./components/StockForm";
import {
  DEFAULT_UOM,
  EMPTY_FORM,
  validateSubscribeForm,
  type SubscribeFormData,
} from "./helper";

// The price config lands a moment after the stock does; hold the busy state so
// the grid only re-fetches once the backend has both.
const PRICE_SETTLE_DELAY_MS = 5000;

type PosSubscribeDealModalProps = {
  show: boolean;
  /** Catalog deal id (`_id` on the formatted global deal). */
  dealId?: string;
  /** The grid row that was tapped — shown until the fresh deal arrives. */
  deal?: any;
  /** Which price the entered selling price configures. */
  type?: "b2b" | "b2c";
  /** Emits `subscribed` with the catalog deal id once the POST succeeds. */
  callback: (params: { action: string; data?: any }) => void;
};

/**
 * Subscribe-from-billing modal: the POS product grid also lists deals the
 * seller has not subscribed to yet (the "global" page of results), and those
 * can't be billed. This shows just enough of the deal to confirm it is the
 * right one, then subscribes it, adds opening stock, and sets the selling
 * price in one flow. On success the grid row flips to a billable product.
 */
const PosSubscribeDealModal = ({
  show,
  dealId,
  deal,
  type = "b2c",
  callback,
}: PosSubscribeDealModalProps) => {
  const appToast = useAppToast();

  const [info, setInfo] = useState<any>(deal || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Named so the operator knows which of the three calls is in flight — the
  // whole sequence takes several seconds.
  const [step, setStep] = useState("");

  const formMethods = useForm<SubscribeFormData>({
    defaultValues: EMPTY_FORM,
  });
  const { reset, setValue, getValues } = formMethods;

  useEffect(() => {
    if (!show) return;
    reset({
      ...EMPTY_FORM,
      uom: deal?.selectedStockUom || deal?.unitType || DEFAULT_UOM,
      mrp: typeof deal?.mrp === "number" && deal.mrp > 0 ? deal.mrp : "",
    });
    setStep("");
  }, [show, deal, reset]);

  useEffect(() => {
    if (!show) return;
    setInfo(deal || null);
    if (!dealId) return;

    let cancelled = false;
    const fetchDeal = async () => {
      setLoading(true);
      try {
        const response = await InventorySubscribeService.getDeals({
          filter: { _id: dealId },
        });
        if (cancelled) return;
        const formatted = InventorySubscribeService.formatDealResponse(
          response?.data?.data || [],
        )[0];
        if (formatted) {
          setInfo(formatted);
          // Only seed MRP — never clobber a value the operator already typed
          // while the fetch was in flight.
          if (formatted.mrp > 0 && !getValues("mrp")) {
            setValue("mrp", formatted.mrp);
          }
        }
      } catch (e) {
        console.error("Failed to load deal details", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDeal();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, dealId]);

  const handleSubscribe = async (data: SubscribeFormData) => {
    const sellerId = AuthService.getLoggedInUserId();
    if (!sellerId || !dealId) {
      appToast.show({
        msg: "Unable to subscribe — seller or product is missing",
        color: "danger",
      });
      return;
    }

    const validationError = validateSubscribeForm(data);
    if (validationError) {
      appToast.show({ msg: validationError.msg, color: "danger" });
      return;
    }

    const apiMrp = Number(UomPriceService.toApiPrice(data.mrp, data.uom));
    const apiPurchasePrice = Number(
      UomPriceService.toApiPrice(data.purchasePrice, data.uom),
    );
    const apiSellingPrice = Number(
      UomPriceService.toApiPrice(data.sellingPrice, data.uom),
    );
    const apiQty = Number(UomPriceService.toApiQuantity(data.stock, data.uom));

    setSaving(true);
    try {
      setStep("Subscribing the product…");
      const response = await InventorySubscribeService.subscribeDeal({
        sellerId,
        dealId,
      });
      if (response.statusCode !== 200 && response.statusCode !== 201) {
        appToast.show({
          msg: response.data?.message || "Failed to subscribe the product",
          color: "danger",
        });
        return;
      }

      setStep("Adding stock…");
      const stockResponse = await SellerCatalogService.addStocksInventory({
        productList: [
          {
            dealId,
            dealName: info?.name,
            dealRefId: info?.dealRefId || info?.dealId,
            qty: apiQty,
            mrp: apiMrp,
            purchasePrice: apiPurchasePrice,
          },
        ],
      });
      if (stockResponse?.statusCode && stockResponse.statusCode !== 200) {
        appToast.show({
          msg: stockResponse?.data?.message || "Failed to add stock",
          color: "danger",
        });
        return;
      }

      setStep("Updating price…");
      const priceResponse = await PosService.createRspConfig({
        franchiseId: sellerId,
        id: dealId,
        applicableFor: type === "b2b" ? "Network" : "Customer",
        configOnType: "Deal",
        isFixedPrice: true,
        fixedPrice: apiSellingPrice,
        discount: 0,
      });
      if (priceResponse?.statusCode && priceResponse.statusCode !== 200) {
        appToast.show({
          msg: priceResponse?.data?.message || "Failed to update the price",
          color: "danger",
        });
        return;
      }

      // The stock and price land asynchronously on the backend — wait before
      // handing back, so the grid re-fetches a fully billable product.
      setStep("Adding to cart…");
      await new Promise((resolve) =>
        setTimeout(resolve, PRICE_SETTLE_DELAY_MS),
      );

      appToast.show({
        msg: "Product subscribed and ready to bill",
        color: "success",
      });
      callback({
        action: "subscribed",
        data: {
          dealId,
          deal: info,
          response: response.data?.data,
          uom: data.uom,
          qty: apiQty,
          mrp: apiMrp,
          purchasePrice: apiPurchasePrice,
          sellingPrice: apiSellingPrice,
          type,
        },
      });
    } catch (e: any) {
      appToast.show({
        msg:
          e?.response?.data?.message ||
          e?.data?.message ||
          "Failed to subscribe the product",
        color: "danger",
      });
    } finally {
      setStep("");
      setSaving(false);
    }
  };

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:md:max-w-md"
      backdropDismiss={false}
    >
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:w-8 tw:h-8 tw:rounded-lg tw:bg-primary/10 tw:flex tw:items-center tw:justify-center tw:shrink-0">
            <BadgeCheck className="tw:w-4 tw:h-4 tw:text-primary" />
          </div>
          <div className="tw:min-w-0 tw:flex-1">
            <h2 className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-400">
              Subscribe product
            </h2>
            <p className="tw:text-sm tw:font-bold tw:text-gray-900 tw:leading-tight tw:truncate">
              {info?.name || "Product"}
            </p>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:gap-3">
          <ProductInfo info={info} />

          <FormProvider {...formMethods}>
            <StockForm
              type={type}
              saving={saving}
              disabled={saving || loading || !dealId}
              step={step}
              onSubmit={handleSubscribe}
            />
          </FormProvider>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default PosSubscribeDealModal;
