import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Package,
  CheckCircle,
  AlertTriangle,
  CircleX,
  CreditCard,
} from "lucide-react";
import type { SwiperOptions } from "swiper/types";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import RackBinService from "~/services/RackBinService";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import { getShortQty } from "./productQtyUtils";

interface POProduct {
  _scanned?: boolean;
  quantity?: number;
  formData?: {
    receivedQty?: number;
    damageQty?: number;
    invoiceQty?: number;
    purchasePrice?: number;
    variations?: any[];
    location?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

type AutoAllocateProp = boolean | { enabled: boolean; silent?: boolean };

type Props = {
  products: POProduct[];
  callback: (a: { action: string; data?: any }) => void;
  autoAllocate?: AutoAllocateProp;
};

const POScanSummary = ({ products, callback, autoAllocate }: Props) => {
  const appToast = useAppToast();
  const { t } = useTranslation();
  const { isMobile } = useScreenView();

  const [summary, setSummary] = useState({
    ordered: 0,
    invoiceUnits: 0,
    received: 0,
    damaged: 0,
    short: 0,
    payable: 0,
    credit: 0,
  });

  const [busyLoader, setBusyLoader] = useState(false);

  useEffect(() => {
    let ordered = 0;
    let invoiceUnits = 0;
    let received = 0;
    let damaged = 0;
    let short = 0;
    let payable = 0;
    let invoiceValue = 0;

    products.forEach((product) => {
      const qtyOrdered = Number(product?.quantity) || 0;
      const invoiceQty =
        Number(product.formData?.invoiceQty) || qtyOrdered;
      const receivedQty = Number(product.formData?.receivedQty) || 0;
      const damageQty = Number(product.formData?.damageQty) || 0;
      const purchasePrice = Number(product.formData?.purchasePrice) || 0;

      ordered += qtyOrdered;
      invoiceUnits += invoiceQty;
      received += receivedQty;
      damaged += damageQty;
      short += getShortQty(product);

      let productPayable = purchasePrice * receivedQty;
      let productInvoiceValue = purchasePrice * invoiceQty;

      const variations = product.formData?.variations || [];
      variations.forEach((variation: any) => {
        const variationPurchasePrice =
          Number(variation.formData?.purchasePrice) || purchasePrice;
        const variationQty = Number(variation.formData?.qty) || 0;
        productPayable += variationPurchasePrice * variationQty;
      });

      payable += productPayable;
      invoiceValue += productInvoiceValue;
    });

    setSummary({
      ordered,
      invoiceUnits,
      received,
      damaged,
      short,
      payable: CommonService.roundedByDecimalPlace(payable),
      credit: CommonService.roundedByDecimalPlace(
        Math.max(0, invoiceValue - payable),
      ),
    });
  }, [products]);

  const handleAutoFillAll = async (options?: { silent?: boolean }) => {
    const items = products.map((product) => {
      return {
        dealId: product.dealId,
        quantity: product.quantity,
      };
    });

    setBusyLoader(true);

    const response = await RackBinService.getRecommendedBinsBulk({
      franchiseId: AuthService.getLoggedInUserId() || "",
      deals: [...items],
    });

    setBusyLoader(false);

    if (response.statusCode === 200) {
      const deals = response.data?.data?.deals || [];

      let temp: Record<string, any> = {};
      deals.forEach((deal: any) => {
        const recommended = deal.recommendations?.[0] || {};
        if (recommended.locationId) {
          temp[deal.dealId] = {
            location: recommended.locationId,
            locationDetail: {
              id: recommended.locationId,
              name: recommended.location,
            },
            rack: recommended.rackId,
            rackDetails: {
              rackId: recommended.rackId,
              rackName: recommended.rackName,
            },
            bin: recommended.binId,
            binDetails: {
              binId: recommended.binId,
              binName: recommended.binName,
            },
          };
        }
      });

      const autoFilledCount = Object.keys(temp).length;
      if (!options?.silent) {
        appToast.show({
          msg: autoFilledCount
            ? t("autoFilledProductsWithLocations", {
                count: autoFilledCount,
                plural: autoFilledCount > 1 ? "s" : "",
              })
            : t("recommendedLocationsApplied"),
          color: "success",
        });
      }

      callback({
        action: "autoFillAll",
        data: temp,
      });
    } else {
      appToast.show({
        msg: response.data?.message || t("failedToAutoFillAllProducts"),
        color: "danger",
      });
    }
  };

  useEffect(() => {
    if (!autoAllocate) return;

    const enabled =
      typeof autoAllocate === "boolean" ? autoAllocate : autoAllocate.enabled;
    const silent =
      typeof autoAllocate === "boolean" ? false : autoAllocate.silent;

    if (enabled) {
      handleAutoFillAll({ silent });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAllocate]);

  const receivedPct =
    summary.invoiceUnits > 0
      ? Math.round((summary.received / summary.invoiceUnits) * 100)
      : 0;

  const cards = [
    {
      key: "ordered",
      label: t("ordered"),
      value: summary.ordered,
      sub: t("unitsOnInvoice", { defaultValue: "units on invoice" }),
      icon: Package,
      iconWrap: "tw:bg-blue-50",
      iconClass: "tw:text-blue-600",
      labelClass: "tw:text-blue-600",
      valueClass: "tw:text-slate-900",
    },
    {
      key: "received",
      label: t("received"),
      value: summary.received,
      sub: t("pctOfInvoice", {
        defaultValue: "{{pct}}% of invoice",
        pct: receivedPct,
      }),
      icon: CheckCircle,
      iconWrap: "tw:bg-emerald-50",
      iconClass: "tw:text-emerald-600",
      labelClass: "tw:text-emerald-600",
      valueClass: "tw:text-emerald-700",
    },
    {
      key: "damaged",
      label: t("damaged"),
      value: summary.damaged,
      sub: t("needsDecision", { defaultValue: "needs decision" }),
      icon: AlertTriangle,
      iconWrap: "tw:bg-red-50",
      iconClass: "tw:text-red-500",
      labelClass: "tw:text-red-500",
      valueClass: "tw:text-red-600",
    },
    {
      key: "short",
      label: t("short", { defaultValue: "Short" }),
      value: summary.short,
      sub: t("notInBox", { defaultValue: "not in box" }),
      icon: CircleX,
      iconWrap: "tw:bg-amber-50",
      iconClass: "tw:text-amber-500",
      labelClass: "tw:text-amber-600",
      valueClass: "tw:text-amber-700",
    },
    {
      key: "payable",
      label: t("payable", { defaultValue: "Payable" }),
      value: <Amount value={summary.payable} decimalPlaces={0} />,
      sub:
        summary.credit > 0 ? (
          <>
            <Amount value={summary.credit} decimalPlaces={0} />{" "}
            {t("credit", { defaultValue: "credit" })}
          </>
        ) : (
          t("noCredit", { defaultValue: "no credit" })
        ),
      icon: CreditCard,
      iconWrap: "tw:bg-violet-50",
      iconClass: "tw:text-violet-600",
      labelClass: "tw:text-violet-600",
      valueClass: "tw:text-violet-800",
    },
  ];

  const renderCard = (card: (typeof cards)[number]) => {
    const Icon = card.icon;
    return (
      <AppCard className="tw:px-3.5 tw:py-3" noPadding noContentPadding>
        <div className="tw:flex tw:items-start tw:gap-2.5">
          <div
            className={`tw:w-9 tw:h-9 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:shrink-0 ${card.iconWrap}`}
          >
            <Icon className={card.iconClass} size={18} />
          </div>
          <div className="tw:min-w-0">
            <div
              className={`tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide ${card.labelClass}`}
            >
              {card.label}
            </div>
            <div
              className={`tw:text-xl tw:font-bold tw:leading-tight tw:mt-0.5 ${card.valueClass}`}
            >
              {card.value}
            </div>
            <div className="tw:text-[11px] tw:text-slate-500 tw:mt-0.5 tw:truncate">
              {card.sub}
            </div>
          </div>
        </div>
      </AppCard>
    );
  };

  return (
    <>
      {/* Desktop only — on mobile the per-product cards already carry these
          counters, so the strip is redundant. The component still mounts on
          mobile because it owns the auto-allocate run and its busy loader. */}
      {!isMobile && (
        <div className="tw:mb-4">
          <AppSwiper config={desktopSwiperConfig}>
            {cards.map((card) => (
              <AppSwiper.Slide key={card.key}>
                {renderCard(card)}
              </AppSwiper.Slide>
            ))}
          </AppSwiper>
        </div>
      )}
      <BusyLoader show={busyLoader} message={t("autoFillingAllProducts")} />
    </>
  );
};

const baseSwiperConfig: SwiperOptions = {
  spaceBetween: 12,
  pagination: false,
  navigation: false,
  slidesOffsetAfter: 1,
  slidesOffsetBefore: 1,
};

// Desktop lays the five cards out in one row.
const desktopSwiperConfig: SwiperOptions = {
  ...baseSwiperConfig,
  slidesPerView: 5,
};

export default POScanSummary;
