import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SwiperOptions } from "swiper/types";
import AppCard from "~/components/core/card/AppCard";
import AppSwiper from "~/components/core/swiper";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppBadge from "~/components/core/badge/AppBadge";
import SellerService from "~/services/SellerService";
import BoxItemSnapshots from "./BoxItemSnapshots";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface BoxesProps {
  orderId: string;
  className?: string;
}

interface Package {
  id: string;
  refId: string;
  status: string;
  products: Array<{
    name: string;
    id: string;
    refId: string;
    scannedQty: number;
    selectedStockUom?: string;
    snapshots?: any[];
  }>;
}

const swiperConfig: SwiperOptions = {
  slidesPerView: 1,
  spaceBetween: 10,
  breakpoints: {
    320: {
      slidesPerView: 0.7,
    },
    1024: {
      slidesPerView: 2.2,
    },
  },
};

// Helper function to get badge variant based on status
function getStatusVariant(
  status: string,
): "success" | "primary" | "warning" | "danger" | "secondary" {
  const statusLower = status.toLowerCase();

  if (statusLower.includes("delivered") || statusLower.includes("completed")) {
    return "success";
  } else if (
    statusLower.includes("shipped") ||
    statusLower.includes("in transit")
  ) {
    return "primary";
  } else if (
    statusLower.includes("pending") ||
    statusLower.includes("processing")
  ) {
    return "warning";
  } else if (
    statusLower.includes("cancelled") ||
    statusLower.includes("failed")
  ) {
    return "danger";
  } else {
    return "secondary";
  }
}

// Transform boxes API response to match the expected format
function transformBoxesResponse(boxes: any[]): Package[] {
  return boxes.map((box) => ({
    id: box._id,
    refId: box.packageRefNo,
    status: box.status || "Open",
    products: (box.items || []).map((item: any) => ({
      name: item.dealName,
      id: item.dealId,
      refId: item.dealRefId,
      scannedQty: item.scannedQty || item.qty,
      selectedStockUom: item.selectedStockUom,
      snapshots: item.snapshots || [],
    })),
  }));
}

const Boxes: React.FC<BoxesProps> = ({ orderId, className }) => {
  const { t } = useTranslation(["common"]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await SellerService.getOrderBoxes(orderId);

        if (response.statusCode === 200 && response.data) {
          const transformedPackages = transformBoxesResponse(
            response.data?.data || [],
          );

          setPackages(transformedPackages);
        } else {
          setError(t("failedToFetchPackageDetails"));
        }
      } catch (err: any) {
        console.error("Error fetching packages:", err);
        setError(err?.message || t("failedToFetchPackageDetails"));
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [orderId, t]);

  if (loading) {
    return (
      <AppCard>
        <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
          <AppSpinner />
        </div>
      </AppCard>
    );
  }

  if (error) {
    return (
      <AppCard>
        <div className="tw:text-red-500 tw:text-center tw:py-8">{error}</div>
      </AppCard>
    );
  }

  if (!packages.length) {
    return (
      <AppCard>
        <div className="tw:text-gray-500 tw:text-center tw:py-8">
          {t("noPackagesAvailable")}
        </div>
      </AppCard>
    );
  }

  return (
    <div className={className}>
      <div className="tw:border tw:rounded-lg tw:p-4 tw:bg-gray-50">
        <div className="tw:text-sm tw:text-gray-500 tw:mb-2">
          {t("packedInBoxes", { count: packages.length })}
        </div>

        <div className="tw:w-[90%]">
          <AppSwiper config={swiperConfig}>
            {packages.map((pkg, index) => (
              <AppSwiper.Slide key={pkg.id || index}>
                <div className="tw:bg-white tw:rounded-lg tw:p-4">
                  <div className="tw:flex tw:justify-between tw:items-center tw:gap-2 tw:mb-3">
                    <span className="tw:text-sm tw:font-medium tw:bg-gray-100 tw:rounded-lg tw:px-2 tw:py-1 tw:flex-1">
                      {t("box")} : {pkg.refId}
                    </span>
                    <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
                      <AppBadge variant={getStatusVariant(pkg.status)}>
                        {pkg.status}
                      </AppBadge>
                      <span className="tw:text-xs tw:text-gray-600">
                        {pkg.products.length} {t("items")}
                      </span>
                    </div>
                  </div>
                  {pkg.products.map((prod) => (
                    <div
                      key={prod.id}
                      className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:mb-1 tw:text-slate-600"
                    >
                      <span className="tw:inline-flex tw:items-center tw:justify-center tw:min-w-14 tw:px-2 tw:py-0.5 tw:rounded-md tw:bg-slate-100 tw:text-slate-700 tw:font-medium tw:tabular-nums tw:whitespace-nowrap">
                        <DisplayQty
                          qty={Number(prod.scannedQty) || 0}
                          isLooseQty={false}
                          uom={prod.selectedStockUom}
                        />
                      </span>
                      <div className="tw:flex-1 tw:min-w-0">{prod.name}</div>
                      <BoxItemSnapshots
                        snapshots={prod.snapshots ?? []}
                        uom={prod.selectedStockUom}
                      />
                    </div>
                  ))}
                </div>
              </AppSwiper.Slide>
            ))}
          </AppSwiper>
        </div>
      </div>
    </div>
  );
};

export default Boxes;
