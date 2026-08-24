import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Barcode, Check, XCircle } from "lucide-react";
import { AppInput } from "~/components/core/form/AppInput";
import useDebounce from "~/hooks/useDebounce";
import SellerCatalogService from "~/services/SellerCatalogService";
import RackBinService from "~/services/RackBinService";
import AuthService from "~/services/AuthService";
import AppLink from "~/components/core/link/AppLink";
import useAppToast from "~/hooks/useAppToast";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import { debounce } from "lodash";
import AppButton from "~/components/core/button/AppButton";
import PickedSanpshotsInfo from "../snapshots-info/PickedSanpshotsInfo";
import BarcodeScan from "~/components/core/barcode-scan/BarcodeScan";
import Amount from "~/components/core/amount/Amount";
import { useTranslation } from "react-i18next";
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";
import PriceLockedNote from "../PriceLockedNote";

interface BarcodeFormData {
  barcode: string;
}

interface Product {
  dealId: string;
  dealName: string;
  name?: string;
  quantity: number;
  barcodes?: string[];
}

const BarcodeScanner: React.FC<{
  products: any[];
  callback: (a: { action: string; data?: any }) => void;
}> = ({ products, callback }) => {
  const toast = useAppToast();
  const { t } = useTranslation();

  const { register, setValue, getValues } = useForm<BarcodeFormData>({
    defaultValues: {
      barcode: "",
    },
  });

  const [busyloading, setBusyloading] = useState({
    show: false,
    message: "",
  });

  // Fetch master data for a deal
  const fetchMasterData = async (
    dealId: string,
    product: any,
    scannedQty?: number,
  ) => {
    setBusyloading({
      show: true,
      message: "Fetching master data...",
    });

    const dealResponse = await SellerCatalogService.getProducts({
      filter: {
        dealId: dealId,
      },
    });

    const deal = dealResponse.data.data?.[0] || {};

    if (deal?._id) {
      // Then fetch the master data using the deal details
      const response = await RackBinService.getSnapshotsMastersData(
        AuthService.getLoggedInUserId() || "",
        {
          filter: {
            quantity: { $gt: 0 },
            dealId: dealId,
            isUsable: true,
          },
        },
      );

      setBusyloading({
        show: false,
        message: "",
      });

      const snapshots = response.data.data || [];

      if (snapshots.length > 0) {
        callback({
          action: "selected",
          data: {
            masterData: snapshots,
            deal: deal,
            product: product,
            scannedQty: scannedQty,
          },
        });
      } else {
        toast.show({
          msg: "No master data found for this product.",
          color: "error",
        });
      }
    } else {
      setBusyloading({
        show: false,
        message: "",
      });
      toast.show({
        msg: "No deal found for this product.",
        color: "error",
      });
    }
  };

  // Search products by barcode. Supports "<barcode>#<qty>" pattern (e.g. "838383#001000")
  const searchProductsByBarcode = async (barcode: string) => {
    if (!barcode || barcode.trim().length < 3) {
      return;
    }

    let scannedQty: number | undefined;
    const rawSearch = barcode.trim();
    if (rawSearch.includes("#")) {
      const [bc, qtyStr] = rawSearch.split("#");
      const parsedQty = parseInt(qtyStr, 10);
      if (bc && Number.isFinite(parsedQty) && parsedQty > 0) {
        scannedQty = parsedQty;
        barcode = bc;
      }
    }

    // Extract dealIds from the products prop (filter out cancelled items)
    const dealIds = products
      .filter(
        (product: any) =>
          product.status !== "Cancelled" && product._pendingQty > 0,
      )
      .map((product: any) => product.dealId)
      .filter(Boolean);

    // Only proceed if we have dealIds
    if (dealIds.length === 0) {
      toast.show({
        msg: "All products are picked",
        color: "error",
      });
      return;
    }

    setBusyloading({
      show: true,
      message: "Searching products...",
    });

    const response = await SellerCatalogService.getProducts({
      filter: {
        barcodes: barcode.trim(),
        dealId: { $in: dealIds },
      },
    });

    const data =
      SellerCatalogService.formatProductResponse(response.data.data) || [];

    if (data.length > 0) {
      const matchedProduct = products.find((product: any) =>
        data.some((item: any) => item._id === product.dealId),
      );

      const orderedQty = matchedProduct?._pendingQty || 0;
      const pickedQty = matchedProduct?.pickedQty || 0;

      if (!orderedQty) {
        setValue("barcode", "");
        setBusyloading({
          show: false,
          message: "",
        });
        toast.show({
          msg: "All products for this barcode have been picked",
          color: "error",
        });
        return;
      }

      if (matchedProduct) {
        // Clear the barcode input after a successful match so the field is ready for the next scan
        setValue("barcode", "");
        await fetchMasterData(
          matchedProduct.dealId,
          matchedProduct,
          scannedQty,
        );
      } else {
        setValue("barcode", "");
        toast.show({
          msg: "No products found for this barcode " + barcode,
          color: "error",
        });
      }
    } else {
      setValue("barcode", "");
      toast.show({
        msg: "No products found for this barcode " + barcode,
        color: "error",
      });
    }

    setBusyloading({
      show: false,
      message: "",
    });
  };

  const handleScan = useCallback(
    debounce(() => {
      const barcode = getValues("barcode");
      searchProductsByBarcode(barcode);
    }, 500),
    [getValues, products],
  );

  const handleScanClick = (data: { action: string; data: any }) => {
    if (data.action === "scan") {
      setValue("barcode", "");
      searchProductsByBarcode(data.data);
    }
  };

  return (
    <>
      <div className="tw:space-y-6">
        {/* Barcode Scanner Input */}

        <div className="tw:relative tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:p-4">
          <div>
            <AppInput
              name="barcode"
              placeholder="Scan barcode or enter SKU..."
              register={register}
              autoFocus
              className="tw:bg-white"
              leftIcon={<Barcode className="tw:w-5 tw:h-5 tw:text-blue-600" />}
              onChange={handleScan}
              rightIcon={<BarcodeScan callback={handleScanClick} />}
            />
          </div>
        </div>

        {products.length > 0 && (
          <div className="op-pick-rows">
            {products.map((product, idx) => {
              const key = product.dealId || `idx-${idx}`;
              const fullyPicked =
                (product.orderedQty || 0) > 0 &&
                (product.pickedQty || 0) >= (product.orderedQty || 0);
              const partiallyPicked =
                !fullyPicked && (product.pickedQty || 0) > 0;
              return (
                <div
                  key={key}
                  className={`op-row op-pick-row ${fullyPicked ? "is-picked" : ""} ${
                    partiallyPicked ? "is-partial" : ""
                  }`}
                >
                  {/* Identity line — check, monogram tile, name + bin/qty
                      meta, price on the right. */}
                  <div className="tw:flex tw:items-center tw:gap-2.5">
                    <div className="op-check">
                      {fullyPicked && <Check size={14} />}
                    </div>
                    <div
                      className="op-tile"
                      style={{ backgroundColor: product._tile?.color }}
                    >
                      {product._tile?.code}
                    </div>
                    <div className="tw:flex-1 tw:min-w-0">
                      <div className="op-row-title tw:font-medium tw:text-sm tw:truncate">
                        <AppLink
                          asLink
                          href={`/dashboard/inventory/products/view/${product.dealId}`}
                          className="tw:text-gray-900 hover:tw:text-blue-600"
                        >
                          {product.dealName || "--"}
                        </AppLink>
                      </div>
                      <div className="tw:flex tw:items-center tw:gap-1.5 tw:mt-0.5 tw:text-xs tw:text-gray-500 tw:flex-wrap">
                        <LocationsBlock
                          locations={product.locations}
                          small
                          hideIcon
                        />
                        <span>
                          · {t("ordered").toLowerCase()}{" "}
                          <span className="tw:font-semibold tw:text-gray-800">
                            {product.orderedQty || 0}
                          </span>
                        </span>
                        <span>
                          · {t("picked").toLowerCase()}{" "}
                          <span className="tw:font-semibold tw:text-gray-800">
                            {product.pickedQty || 0}/{product.orderedQty || 0}
                          </span>
                        </span>
                      </div>
                    </div>
                    {(product.overridePrice ?? product.mrp) != null && (
                      <div className="op-pick-price">
                        <Amount
                          value={product.overridePrice ?? product.mrp}
                          decimalPlaces={2}
                        />
                      </div>
                    )}
                  </div>

                  {/* Reference code + price-lock note. */}
                  {product.dealRefId && (
                    <div className="tw:flex tw:gap-2 tw:items-center tw:flex-wrap tw:mt-1.5 tw:text-[11px] tw:text-gray-400">
                      <span>ID: {product.dealRefId}</span>
                      <PriceLockedNote product={product} />
                    </div>
                  )}

                  <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mt-1.5">
                    {product._pendingQty > 0 ? (
                      <div className="tw:flex tw:gap-5 tw:text-xs">
                        <div
                          className={`tw:flex tw:gap-1 ${
                            (product._pendingQty || 0) > 0
                              ? "tw:text-red-500"
                              : "tw:text-gray-600"
                          }`}
                        >
                          <span>{t("pendingToPick")}: </span>
                          <span className="tw-font-semibold ">
                            {product._pendingQty || 0}
                          </span>
                        </div>

                        {/* picked */}
                        <div className="tw:flex tw:gap-1 tw:text-green-600">
                          <span>{t("picked")}: </span>
                          <span className="tw-font-semibold">
                            {product.pickedQty || 0}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span />
                    )}

                    <div className="tw:flex tw:items-center tw:gap-2">
                      {product.snapshots?.length > 0 && (
                        <PickedSanpshotsInfo
                          pickedSanpshots={product.snapshots}
                        />
                      )}

                      {(product.pickedQty || 0) > 0 && (
                        <AppButton
                          onClick={() =>
                            callback({
                              action: "remove",
                              data: { dealId: product.dealId },
                            })
                          }
                          size="small"
                          fill="clear"
                          className="tw:text-red-500 tw:px-0!"
                        >
                          {t("cancelPick")}
                          <XCircle size={14} />
                        </AppButton>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BusyLoader show={busyloading.show} message={busyloading.message} />
    </>
  );
};

export default BarcodeScanner;
