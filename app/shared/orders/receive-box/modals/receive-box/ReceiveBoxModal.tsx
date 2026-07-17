import { produce } from "immer";
import { Package, PackageCheck } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import PageLoader from "~/components/core/page-loader/PageLoader";
import AppTab from "~/components/core/tab/AppTab";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import SellerCatalogService from "~/services/SellerCatalogService";
import RackBinService from "~/services/RackBinService";
import {
  prepareSkReceivePayload,
  submitSkReceiveBox,
  prepareSellerReceivePayload,
  submitSellerReceiveBox,
} from "./helper";
import type { TabItem } from "~/types/CommonTypes";
import BoxOverview from "./components/BoxOverview";
import DesktopView from "./components/products/DesktopView";
import MobileView from "./components/products/MobileView";
import ReceiveSummary from "./components/ReceiveSummary";
import AuthService from "~/services/AuthService";
import { useTranslation } from "react-i18next";

interface SkReceivePackageModalProps {
  show: boolean;
  callback?: (a: { action: string; data?: any }) => void;
  boxNo: string;
  orderId: string;
}

interface FormData {
  notes: string;
}

const tabs: TabItem[] = [
  {
    key: "box-level",
    name: "Box Level Receiving",
    icon: <Package />,
  },
  {
    key: "item-level",
    name: "Item Level Receiving",
    icon: <PackageCheck />,
  },
];

const ReceiveBoxModal: React.FC<SkReceivePackageModalProps> = ({
  show,
  boxNo,
  callback,
  orderId,
}) => {
  const { t } = useTranslation("common");

  const { isMobile } = useScreenView();

  const appToast = useAppToast();

  const {
    register,
    formState: { errors },
    getValues,
  } = useForm<FormData>({
    defaultValues: {
      notes: "",
    },
  });

  const [activeTab, setActiveTab] = useState("box-level");

  const [products, setProducts] = useState<any[]>([]);

  const [receiving, setReceiving] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [showPartialAlert, setShowPartialAlert] = useState(false);

  const [boxDetails, setBoxDetails] = useState<any>(null);

  const noData = !boxNo;

  useEffect(() => {
    if (show) {
      setActiveTab("box-level");
      setProducts([]);
      setBoxDetails(null);
    }
  }, [show]);

  useEffect(() => {
    if (!show) return;

    const fetchPackageDetails = async () => {
      try {
        setIsLoading(true);
        const packageId = boxNo || "";

        // Use PurchaseOrderService.getPoPackages which returns array with `items`
        const res = await PurchaseOrderService.getPoPackages(
          AuthService.getLoggedInUserId(),
          {
            filter: {
              refNo: packageId,
            },
          }
        );
        const data = res?.data?.data;

        // normalize: response may be array of package summaries; pick first matching box
        const pkg = Array.isArray(data) ? data[0] || {} : data || {};
        const items = Array.isArray(pkg.items) ? pkg.items : [];

        if (pkg) {
          pkg._totalUnits = items?.reduce(
            (acc: number, curr: any) => acc + Number(curr.quantity || 0),
            0
          );
          pkg._totalItems = items?.length || 0;
        }

        setBoxDetails(pkg);

        // Collect dealIds to fetch catalog details
        const dealIds: string[] = items
          .map((e: any) => e.dealId)
          .filter(Boolean);

        let idToLocations: Record<string, any[]> = {};
        if (dealIds.length > 0) {
          try {
            const catalogResp = await SellerCatalogService.getProducts({
              filter: { dealRefId: { $in: dealIds } },
              count: dealIds.length,
            });
            const deals = catalogResp?.data?.data || [];
            deals.forEach((d: any) => {
              const key = d.dealRefId;
              if (key) {
                idToLocations[key] = d.locations || [];
              }
            });
          } catch (_) {
            // Silently ignore catalog fetch errors; proceed with base items
          }

          // For deals with no locations from catalog, try to fetch recommended locations
          const missingDealIds = dealIds.filter(
            (id) => !idToLocations[id] || idToLocations[id].length === 0
          );

          if (missingDealIds.length > 0) {
            try {
              const itemsForRecommend = missingDealIds.map((dId) => ({
                dealId: dId,
                quantity: 1,
              }));

              const recResp = await RackBinService.getRecommendedBinsBulk({
                franchiseId: AuthService.getLoggedInUserId() || "",
                deals: itemsForRecommend,
              });

              if (recResp && recResp.statusCode === 200) {
                const recDeals = recResp.data?.data?.deals || [];
                recDeals.forEach((rd: any) => {
                  const recommended = rd.recommendations?.[0] || {};
                  if (recommended.locationId || recommended.binId) {
                    const binId = recommended.binId;
                    idToLocations[rd.dealId] = [
                      {
                        binId: binId,
                        location: {
                          binId: binId,
                          binName: recommended.binName || "",
                          name: recommended.location || "",
                          rackId: recommended.rackId || "",
                          rackName: recommended.rackName || "",
                        },
                      },
                    ];
                  }
                });
              }
            } catch (e) {
              // ignore recommendation errors
            }
          }
        }

        setProducts(
          items.map((e: any) => {
            const orderedQty = Number(e.quantity) || 0;
            return {
              ...e,
              dealId: e.dealId,
              dealRefId: e.dealRefId,
              dealName: e.name,
              packageQuantity: e.quantity || 0,
              mrp: e.mrp || 0,
              price: e.price || 0,
              snapshots: e.snapshots || [],
              barcode: e.snapshots?.[0]?.barcode || "",
              locations: idToLocations[e.dealId] || [],
              receivedQty: orderedQty,
              damagedQty: 0,
              notes: e.notes || "",
            };
          })
        );
      } catch (error: any) {
        appToast.show({
          msg: error?.data?.message || "Failed to load package details",
          color: "danger",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackageDetails();
  }, [show, boxNo]);

  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
  };

  const handleModalCallback = ({ action }: { action: string; data: any }) => {
    if (action === "close") {
      callback?.({ action: "close" });
    }
  };

  const productCallback = (a: { action: string; data?: any }) => {
    if (a.action === "update") {
      setProducts(
        produce((draft) => {
          if (a.data.field === "notes") {
            draft[a.data.index].notes = a.data.value;
            return;
          }

          const product = draft[a.data.index];

          let value = Number(a.data.value);
          if (a.data.value === "") {
            value = "" as any;
          }

          const receivedQty = product.receivedQty || 0;
          const damagedQty = product.damagedQty || 0;
          const orderedQty = Number(product.quantity) || 0;

          if (receivedQty + damagedQty > orderedQty || value > orderedQty) {
            return;
          }

          if (a.data.field === "received") {
            product.receivedQty = value;
            product.damagedQty = orderedQty - value;
          }

          if (a.data.field === "damaged") {
            product.receivedQty = orderedQty - value;
            product.damagedQty = value;
          }
        })
      );
    }
  };

  const isPartialItemReceive = () => {
    if (activeTab !== "item-level") return false;
    return (products || []).some((p: any) => {
      const orderedQty = Number(p.quantity) || 0;
      const receivedQty = Number(p.receivedQty) || 0;
      return receivedQty < orderedQty; // partial if not fully received
    });
  };

  const submitReceive = async () => {
    if (noData) {
      appToast.show({ msg: "No data found", color: "warning" });
      return;
    }

    const formData = { notes: getValues("notes") || "" };

    // If package is from SELLER, use seller payload and API
    if (boxDetails?.from?.type === "SELLER") {
      const payload = prepareSellerReceivePayload(
        boxDetails || {},
        products || [],
        formData
      );

      setReceiving(true);
      const res = await submitSellerReceiveBox(
        boxDetails?.refId || "",
        payload
      );
      setReceiving(false);

      if (res.status === "success") {
        appToast.show({
          msg: res.msg || "Box received successfully",
          color: "success",
        });
        callback?.({
          action: "success",
          data: {
            type: activeTab,
            boxes: boxDetails ? [boxDetails] : [],
            notes: (formData.notes || "").trim(),
          },
        });
      } else {
        appToast.show({
          msg: res.msg || "Box receiving failed",
          color: "danger",
        });
      }

      return;
    }

    // prepare payload using helper for SK flow
    const payload = prepareSkReceivePayload(
      boxDetails || {},
      products || [],
      formData
    );

    setReceiving(true);
    const res = await submitSkReceiveBox(orderId, payload);
    setReceiving(false);

    if (res.status === "success") {
      appToast.show({
        msg: res.msg || "Box received successfully",
        color: "success",
      });

      callback?.({
        action: "success",
        data: {
          type: activeTab,
          boxes: boxDetails ? [boxDetails] : [],
          notes: (formData.notes || "").trim(),
        },
      });
    } else {
      appToast.show({
        msg: res.msg || "Box receiving failed",
        color: "danger",
      });
    }
  };

  const receiveBox = async () => {
    if (activeTab === "item-level" && isPartialItemReceive()) {
      setShowPartialAlert(true);
      return;
    }
    await submitReceive();
  };

  const handleClose = () => {
    callback?.({ action: "close" });
  };

  return (
    <>
      <AppModal
        show={show}
        callback={handleModalCallback}
        className="tw:md:!max-w-4xl tw:h-[90vh]"
      >
        <AppModal.Title onClose={handleClose}>
          <div className="tw:flex tw:items-center tw:gap-2">
            <Package className="tw:w-5 tw:h-5 tw:text-primary" />
            <h2 className="tw:text-lg tw:font-semibold tw:text-gray-900">
              {t("receiveBox")}
            </h2>
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
            {t("youCanReceiveAtBoxLevelOrItemLevel")}
          </div>
        </AppModal.Title>

        <AppModal.Content>
          {isLoading && (
            <PageLoader message="Loading package details..." size="md" />
          )}

          {/* Tabs */}
          {/* <AppTab
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            variant="tabs"
            className="tw:mb-4"
          /> */}

          {/* Tab Content */}
          <div className="tw:flex-1 tw:overflow-hidden">
            {noData && !isLoading ? (
              <div className="tw:text-center tw:py-12 tw:text-gray-500">
                <Package className="tw:w-12 tw:h-12 tw:mx-auto tw:mb-4 tw:text-gray-300" />
                <p>No data found</p>
              </div>
            ) : (
              <>
                {activeTab === "box-level" && (
                  <div className="tw:h-full tw:flex tw:flex-col">
                    <BoxOverview box={boxDetails} items={products} />
                  </div>
                )}

                {activeTab === "item-level" && (
                  <>
                    {isMobile ? (
                      <MobileView
                        products={products}
                        callback={productCallback}
                      />
                    ) : (
                      <DesktopView
                        products={products}
                        callback={productCallback}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Notes Section */}
          <div className="tw:border-t tw:border-gray-200 tw:pt-4">
            <AppTextarea
              name="notes"
              register={register}
              label="Notes (Optional)"
              placeholder="Enter any additional notes for this receive operation..."
              rows={3}
              maxLength={500}
              error={errors.notes?.message}
            />
          </div>

          {/* Summary Component - Moved after textarea */}
          <ReceiveSummary
            mode={activeTab as "box-level" | "item-level"}
            selectedBoxes={boxDetails ? 1 : 0}
            status="Ready to Receive"
          />
        </AppModal.Content>

        <AppModal.Footer>
          <div className="tw:flex tw:justify-end tw:gap-3">
            <AppButton
              onClick={handleClose}
              fill="outline"
              color="secondary"
              size="default"
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              color="primary"
              size="default"
              onClick={receiveBox}
              isLoading={receiving}
              disabled={noData}
            >
              Receive {activeTab === "box-level" ? "Box" : "Items"}
            </AppButton>
          </div>
        </AppModal.Footer>
      </AppModal>

      <AppAlertDialog
        show={showPartialAlert}
        title="Partial items detected"
        description="Some items have not been fully received. Do you want to continue and submit as partial receive?"
        type="confirm"
        cancelText="Review"
        okText="Continue"
        onCancel={() => setShowPartialAlert(false)}
        onConfirm={async () => {
          setShowPartialAlert(false);
          await submitReceive();
        }}
      />
    </>
  );
};

export default ReceiveBoxModal;
