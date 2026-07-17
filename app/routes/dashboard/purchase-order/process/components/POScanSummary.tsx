import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import { Package, CheckCircle, Layers, AlertTriangle } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import RackBinService from "~/services/RackBinService";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";

interface POProduct {
  _scanned?: boolean;
  _qty?: number; // received quantity
  _damageQty?: number;
  _raw?: { requestedQuantity?: number };
  _variations?: any[];
  formData?: {
    receivedQty?: number;
    damageQty?: number;
    variations?: any[];
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

  const [summary, setSummary] = useState({
    totalProducts: 0,
    processed: 0,
    ordered: 0,
    received: 0,
    damaged: 0,
    variations: 0,
  });

  const [busyLoader, setBusyLoader] = useState(false);
  const [showAutoFillAll, setShowAutoFillAll] = useState(false);

  useEffect(() => {
    let totalProducts = products.length;
    let processed = 0;
    let ordered = 0;
    let received = 0;
    let damaged = 0;
    let variations = 0;

    let noLocation = 0;

    products.forEach((product) => {
      ordered += Number(product?.quantity) || 0;
      // Use correct keys from ProductItemForm
      received += Number(product.formData?.receivedQty) || 0;
      damaged += Number(product.formData?.damageQty) || 0;
      // Prefer _variations, fallback to formData.variations
      const vArr = product._variations || product.formData?.variations || [];
      variations += Array.isArray(vArr) ? vArr.length : 0;
      if (product._scanned) processed += 1;

      if (!product.formData?.location) {
        noLocation += 1;
      }
    });

    setShowAutoFillAll(noLocation > 0);

    setSummary({
      totalProducts,
      processed,
      ordered,
      received,
      damaged,
      variations,
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

      if (deals.length === items.length) {
        setShowAutoFillAll(false);
      }

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
      // trigger auto-fill when parent requests auto allocation
      handleAutoFillAll({ silent });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAllocate]);

  return (
    <>
      <div className="tw:mb-4">
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-start tw:mb-3">
          <div className="tw:flex-1">
            <div className="tw:flex tw:items-center tw:gap-2 tw:text-base tw:font-semibold">
              <Package className="tw:text-gray-700" size={18} />
              {t("receivingMode", { count: summary.totalProducts })}
            </div>
            <div className="tw:text-xs tw:opacity-80">
              {t("scanProductsAndManageVariations")}
            </div>
          </div>
          {/* <div className="tw:flex tw:gap-2 tw:items-center tw:mt-3 tw:md:mt-0">
            <AppBadge variant="white" className="tw:font-semibold">
              {summary.processed} / {summary.totalProducts} Processed
            </AppBadge>
            {showAutoFillAll && (
              <AppButton
                color="light"
                fill="outline"
                className="tw:font-semibold tw:h-6 tw:bg-white"
                size="small"
                onClick={handleAutoFillAll}
              >
                {t("autoFillAll")}
              </AppButton>
            )}
          </div> */}
        </div>

        <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-x-4 tw:mt-2 tw:items-start">
          <AppCard className="tw:px-4 tw:py-3" noPadding noContentPadding>
            <div className="tw:flex tw:flex-row tw:items-center">
              <div className="tw:w-10 tw:h-10 tw:flex tw:items-center tw:justify-center tw:rounded tw:bg-blue-100">
                <Package className="tw:text-blue-700" size={24} />
              </div>
              <div className="tw:ml-3">
                <div className="tw:text-xs tw:text-blue-500 tw:uppercase te:font-medium">
                  {t("ordered")}
                </div>
                <div className="tw:text-base tw:font-bold tw:text-blue-900">
                  {summary.ordered}
                </div>
              </div>
            </div>
          </AppCard>

          <AppCard className="tw:px-4 tw:py-3" noPadding noContentPadding>
            <div className="tw:flex tw:flex-row tw:items-center">
              <div className="tw:w-10 tw:h-10 tw:flex tw:items-center tw:justify-center tw:rounded tw:bg-green-100">
                <CheckCircle className="tw:text-green-700" size={24} />
              </div>
              <div className="tw:ml-3">
                <div className="tw:text-xs tw:text-green-700 tw:uppercase tw:font-medium">
                  {t("received")}
                </div>
                <div className="tw:text-base tw:font-bold tw:text-green-700">
                  {summary.received}
                </div>
              </div>
            </div>
          </AppCard>

          <AppCard className="tw:px-4 tw:py-3" noPadding noContentPadding>
            <div className="tw:flex tw:flex-row tw:items-center">
              <div className="tw:w-10 tw:h-10 tw:flex tw:items-center tw:justify-center tw:rounded tw:bg-blue-100">
                <Layers className="tw:text-blue-700" size={24} />
              </div>
              <div className="tw:ml-3">
                <div className="tw:text-xs tw:text-blue-700 tw:uppercase tw:font-medium">
                  {t("variations")}
                </div>
                <div className="tw:text-base tw:font-bold tw:text-blue-700">
                  {summary.variations}
                </div>
              </div>
            </div>
          </AppCard>

          <AppCard className="tw:px-4 tw:py-3" noPadding noContentPadding>
            <div className="tw:flex tw:flex-row tw:items-center">
              <div className="tw:w-10 tw:h-10 tw:flex tw:items-center tw:justify-center tw:rounded tw:bg-red-100">
                <AlertTriangle className="tw:text-red-600" size={24} />
              </div>
              <div className="tw:ml-3">
                <div className="tw:text-xs tw:text-red-600 tw:uppercase tw:font-medium">
                  {t("damaged")}
                </div>
                <div className="tw:text-base tw:font-bold tw:text-red-600">
                  {summary.damaged}
                </div>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
      <BusyLoader show={busyLoader} message={t("autoFillingAllProducts")} />
    </>
  );
};

export default POScanSummary;
