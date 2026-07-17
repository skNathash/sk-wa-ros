import { produce } from "immer";
import { Check, Printer } from "lucide-react";
import React, { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppTab from "~/components/core/tab/AppTab";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import RackBinService from "~/services/RackBinService";
import ChooseSanpshotModal from "~/shared/catalog/modals/sanpshots/ChooseSanpshotModal";
import type { TabItem } from "~/types/CommonTypes";
import BarcodeScanner from "./components/barcode/BarcodeScanner";
import ManualEntry from "./components/manual/ManualEntry";
import {
  getTotalOrderedItems,
  getTotalPickedItems,
  prepareItems,
  caluclatePercentage,
} from "./helper";
import useScreenView from "~/hooks/useScreenView";

interface ItemPickListProps {
  activeTab?: string;
  className?: string;
  onTabChange?: (key: string) => void;
  onPickingConfirmed?: () => Promise<void> | void;
  orderId?: string;
  activePickingId?: string;
  pickUpAtStore?: boolean;
  onPickupConfirm?: (pickingId: string) => void;
  orderItems?: any[];
}

const tabs: TabItem[] = [
  { name: "Manual Entry", key: "manual-entry" },
  { name: "Barcode Scan", key: "barcode-scan" },
];

const ItemPickList: React.FC<ItemPickListProps> = ({
  activeTab = "manual-entry",
  onTabChange,
  onPickingConfirmed,
  orderId,
  activePickingId,
  pickUpAtStore,
  onPickupConfirm,
  orderItems,
}) => {
  const { isMobile } = useScreenView();

  const toast = useAppToast();

  const [busyloading, setBusyloading] = useState({
    show: false,
    message: "",
  });

  const [appAlertDialog, setAppAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const [currentTab, setCurrentTab] = useState<string>(activeTab);

  const [snapshotModal, setSnapshotModal] = useState<{
    show: boolean;
    masterData: any[];
    product: any | null;
  }>({
    show: false,
    masterData: [],
    product: null,
  });

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasStartedPicking, setHasStartedPicking] = useState(false);
  const [pickslipDocumentId, setPickslipDocumentId] = useState<string | null>(
    null
  );
  const [pickingId, setPickingId] = useState<string | null>(null);

  // Local copy of activePickingId so we can update it immediately when
  // startPicking generates a new picking id without waiting for parent
  // to pass the prop back. This prevents the print action from missing
  // the newly created id due to a race condition.
  const [currentActivePickingId, setCurrentActivePickingId] = useState<
    string | null
  >(activePickingId || null);

  const [totalPickedItems, setTotalPickedItems] = useState<string>("0 units");
  const [totalOrderedItems, setTotalOrderedItems] = useState<string>("0 units");

  const fetchPickingDetails = async (targetPickingId?: string) => {
    const idToUse = targetPickingId || pickingId;

    if (!idToUse) {
      setLoading(false);
      setHasStartedPicking(false);
      return;
    }

    setLoading(true);
    try {
      const response = await RackBinService.getPickingDetail(idToUse);
      setLoading(false);

      if (response.statusCode === 200 && response.data.data?._id) {
        const data = response.data.data || {};
        setPickslipDocumentId(data.pickslipDocumentId || null);

        // prepareItems already calculates percentage, so we use it directly
        const preparedItems = prepareItems(data.items || [], orderItems);
        setProducts(preparedItems);
        setTotalPickedItems(getTotalPickedItems(data.items || []));
        setTotalOrderedItems(getTotalOrderedItems(data.items || []));
        setHasStartedPicking(true);
      } else {
        setHasStartedPicking(false);
      }
    } catch (error) {
      setLoading(false);
      setHasStartedPicking(false);
      console.error("Error fetching picking details:", error);
    }
  };

  // Initialize pickingId from activePickingId when component loads
  useEffect(() => {
    if (activePickingId) {
      setPickingId(activePickingId);
    } else if (pickUpAtStore) {
      // Parent auto-starts picking for pickUpAtStore; keep loading to avoid
      // flashing the Start Picking button.
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [activePickingId, pickUpAtStore]);

  // Fetch picking details when pickingId changes
  useEffect(() => {
    if (pickingId) {
      fetchPickingDetails();
    }
  }, [pickingId]);

  const handleMasterDataModalCallback = async (result: {
    action: string;
    data?: any;
  }) => {
    setSnapshotModal({
      show: false,
      masterData: [],
      product: null,
    });

    if (result.action === "select" && result.data) {
      await updatePicking(snapshotModal.product, result.data);
      setSnapshotModal({
        show: false,
        masterData: [],
        product: null,
      });
    }
  };

  const handleTabChange = (tab: TabItem) => {
    setCurrentTab(tab.key);
    if (onTabChange) onTabChange(tab.key);
  };

  const handleStartPicking = async () => {
    setBusyloading({
      show: true,
      message: "Starting Picking...",
    });
    const response = await RackBinService.startPicking(orderId || "");

    setBusyloading({
      show: false,
      message: "",
    });
    if (response.statusCode === 200) {
      // Store the picking ID for future use
      const newPickingId = response.data.data?._id;
      if (newPickingId) {
        setPickingId(newPickingId);
      }

      setHasStartedPicking(true);
      setProducts(prepareItems(response.data.data?.items || [], orderItems));
      setPickslipDocumentId(response.data.data?.pickslipDocumentId || null);
      // Immediately set the local active picking id so subsequent actions
      // (like printing) can access it without waiting for parent prop update.
      if (response.data.data?._id) {
        setCurrentActivePickingId(response.data.data._id);
      }
      setTotalPickedItems(getTotalPickedItems(response.data.data?.items || []));
      setTotalOrderedItems(
        getTotalOrderedItems(response.data.data?.items || [])
      );
    } else {
      toast.show({
        msg: response.data.message,
        color: "danger",
      });
    }
  };

  const handlePrintPickSlip = async () => {
    setBusyloading({
      show: true,
      message: "Fetching pick slip details...",
    });

    let retryCount = 0;
    const maxRetries = 3;
    let documentId = pickslipDocumentId;

    // If we don't have a document ID, try to fetch it with retry logic
    if (!documentId && pickingId) {
      while (retryCount < maxRetries && !documentId) {
        try {
          const response = await RackBinService.getPickingDetail(pickingId);

          if (response.statusCode === 200 && response.data.data?._id) {
            documentId = response.data.data.pickslipDocumentId || null;

            if (documentId) {
              // Update the state with the found document ID
              setPickslipDocumentId(documentId);
              break;
            }
          }

          // If document ID not found, wait 5 seconds before retrying
          if (!documentId && retryCount < maxRetries - 1) {
            retryCount++;
            setBusyloading({
              show: true,
              message: `Document ID not found. Retrying... (${retryCount}/${maxRetries})`,
            });
            await new Promise((resolve) => setTimeout(resolve, 5000));
          } else {
            retryCount++;
          }
        } catch (error) {
          console.error("Error fetching picking detail:", error);
          retryCount++;
          if (retryCount < maxRetries) {
            setBusyloading({
              show: true,
              message: `Error occurred. Retrying... (${retryCount}/${maxRetries})`,
            });
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        }
      }
    }

    setBusyloading({
      show: false,
      message: "",
    });

    if (!documentId) {
      toast.show({
        msg: "Pick slip document not available after multiple attempts",
        color: "error",
      });
      return;
    }

    // Use common service to download/open the asset
    CommonService.assetDownload(documentId);
    toast.show({ msg: "Downloading pick slip", color: "success" });
  };

  const handleCallback = async (result: { action: string; data?: any }) => {
    if (result.action === "selected") {
      const masterData = result.data.masterData;
      if (masterData.length > 0) {
        setSnapshotModal({
          show: true,
          masterData: masterData,
          product: result.data.product,
        });
      } else {
        toast.show({
          msg: "No master data found for this product.",
          color: "error",
        });
      }
    }

    if (result.action === "update-snapshots") {
      await updatePicking(result.data.product, result.data.snapshots);
      return;
    }

    if (result.action === "refresh-products") {
      // Refresh the products list after pick all completion
      await fetchPickingDetails();
      return;
    }

    if (result.action === "remove" && result.data?.dealId) {
      setBusyloading({ show: true, message: "Removing item..." });
      try {
        const response = await RackBinService.removePickingItem(
          orderId || "",
          result.data.dealId
        );

        await fetchPickingDetails();

        setBusyloading({ show: false, message: "" });
        if (response.statusCode === 200) {
          toast.show({
            msg: "Item removed from picking list",
            color: "success",
          });
        } else {
          toast.show({
            msg: response.data.message || "Failed to remove item",
            color: "danger",
          });
        }
      } catch (err) {
        setBusyloading({ show: false, message: "" });
        toast.show({ msg: "Error removing item", color: "danger" });
      }
    }
  };

  const updatePicking = async (
    product: Record<string, any>,
    snapshots: Record<string, any>[]
  ) => {
    let snapshotsPayload: Record<string, any>[] = [];

    snapshots.forEach((snapshot) => {
      snapshot.masters
        .filter((master: any) => master.usedQty > 0)
        .forEach((master: any) => {
          snapshotsPayload.push({
            snapshotId: master._id,
            quantity: master.usedQty,
            location: master.location || {},
            barcode: master.barcode || "",
            expiry: master.expiry || null,
            manufactureDate: master.manufactureDate || null,
            mrp: master.mrp || 0,
          });
        });
    });

    const payload: Record<string, any> = {
      items: [
        {
          dealId: product.dealId,
          snapshots: snapshotsPayload,
        },
      ],
    };

    setBusyloading({
      show: true,
      message: "Updating picking...",
    });

    const response = await RackBinService.updatePicking(orderId || "", payload);

    setBusyloading({
      show: false,
      message: "",
    });

    if (response.statusCode === 200) {
      const updatedProducts = produce(products, (draft) => {
        const index = draft.findIndex((pr) => pr.dealId === product.dealId);
        if (index !== -1) {
          // Sum quantity from the selected snapshots (ensure numeric)
          const addedQty = snapshotsPayload.reduce(
            (acc, curr) => acc + (Number(curr.quantity) || 0),
            0
          );

          draft[index].snapshots = snapshotsPayload;

          draft[index].pickedQty = addedQty;

          const pickedQty = draft[index].pickedQty;
          const orderedQty = draft[index].orderedQty;

          draft[index]._pendingQty = orderedQty - (pickedQty || 0);

          draft[index].percentage = caluclatePercentage(pickedQty, orderedQty);
        }
      });

      setProducts([...updatedProducts]);
      setTotalPickedItems(getTotalPickedItems(updatedProducts));
      setTotalOrderedItems(getTotalOrderedItems(updatedProducts));

      toast.show({
        msg: "Picking updated successfully",
        color: "success",
      });
    } else {
      toast.show({
        msg: response.data.message,
        color: "danger",
      });
    }
  };

  const closePicking = async () => {
    setBusyloading({
      show: true,
      message: "Closing picking...",
    });
    const response = await RackBinService.closePicking(orderId || "");
    setBusyloading({
      show: false,
      message: "",
    });
    if (response.statusCode === 200) {
      toast.show({
        msg: response.data.message || "Picking closed successfully",
        color: "success",
      });
      // Notify parent that picking has been confirmed/closed
      if (typeof onPickingConfirmed === "function") {
        try {
          await onPickingConfirmed();
        } catch (err) {
          // swallow errors from parent callback
          console.error("onPickingConfirmed callback failed:", err);
        }
      }
    } else {
      toast.show({
        msg: response.data.message || "Failed to close picking",
        color: "danger",
      });
    }
  };

  const handleConfirmPicking = () => {
    const notPickedItems = products.filter(
      (product) => product.percentage <= 0
    );

    const fullyPickedItems = products.filter(
      (product) => product.percentage >= 100
    );

    if (notPickedItems.length === products.length) {
      toast.show({
        msg: "Please pick atleast one item",
        color: "error",
      });
      return;
    }

    if (pickUpAtStore && onPickupConfirm) {
      const pId = pickingId || currentActivePickingId || "";
      onPickupConfirm(pId);
      return;
    }

    const isAllPicked = notPickedItems.length === 0;
    const description = isAllPicked
      ? "All items have been picked. Are you sure you want to confirm picking?"
      : "Some items have been partially picked. Are you sure you want to confirm picking?";

    setAppAlertDialog({
      show: true,
      title: "Confirm Picking",
      description: description,
      onConfirm: async () => {
        await closePicking();
        setAppAlertDialog({
          show: false,
          title: "",
          description: "",
          onConfirm: () => {},
          onCancel: () => {},
        });
      },
      onCancel: () => {
        setAppAlertDialog({
          show: false,
          title: "",
          description: "",
          onConfirm: () => {},
          onCancel: () => {},
        });
      },
    });
  };

  const titleSection = (
    <div className="tw:flex tw:md:justify-between tw:md:items-center tw:w-full tw:flex-col tw:md:flex-row tw:gap-2 tw:md:mb-4">
      <div>
        <div className="tw:mb-1 tw:font-medium">Pick Items for Order</div>
        <div className="tw:text-xs tw:text-gray-500 tw:font-normal">
          Scan barcodes or enter quantities manually
        </div>
      </div>
      {hasStartedPicking ? (
        <div className="tw:flex tw:gap-2">
          <AppButton
            color="light"
            fill="outline"
            size="small"
            onClick={handlePrintPickSlip}
          >
            <Printer />
            <span className="tw-ml-2">Print Pick Slip</span>
          </AppButton>
          <AppButton
            color="success"
            size="small"
            onClick={handleConfirmPicking}
          >
            <Check />
            {pickUpAtStore ? "Bill & Deliver" : "Confirm Picking"} ({totalPickedItems}/{totalOrderedItems})
          </AppButton>
        </div>
      ) : null}
    </div>
  );

  const mainContent = (
    <>
      {loading ? (
        <div className="tw:flex tw:justify-center tw:items-center">
          <AppSpinner />
        </div>
      ) : hasStartedPicking ? (
        <>
          <AppTab
            activeTab={currentTab}
            tabs={tabs}
            onTabChange={handleTabChange}
          />

          <div className="tw:mt-3">
            {currentTab === "barcode-scan" ? (
              <div>
                <BarcodeScanner products={products} callback={handleCallback} />
              </div>
            ) : (
              <ManualEntry
                products={products}
                orderId={orderId}
                callback={handleCallback}
              />
            )}
          </div>
        </>
      ) : (
        <div className="tw:text-center">
          <AppButton onClick={handleStartPicking}>Start Picking</AppButton>
        </div>
      )}

      {/* Master Data Modal */}
      {snapshotModal.show && (
        <ChooseSanpshotModal
          show={snapshotModal.show}
          masterData={snapshotModal.masterData}
          loading={loading}
          callback={handleMasterDataModalCallback}
          maxQty={snapshotModal.product?.orderedQty || 0}
          validateOnMaxQty={true}
          dealName={snapshotModal.product?.dealName || ""}
          overridePrice={snapshotModal.product?.overridePrice}
          billedMrp={snapshotModal.product?.mrp}
        />
      )}
    </>
  );

  return (
    <>
      {isMobile ? (
        <>
          <AppCard>{titleSection}</AppCard>
          {mainContent}
        </>
      ) : (
        <AppCard>
          {titleSection}
          {mainContent}
        </AppCard>
      )}

      <BusyLoader show={busyloading.show} message={busyloading.message} />

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        onConfirm={appAlertDialog.onConfirm}
        onCancel={appAlertDialog.onCancel}
      />
    </>
  );
};

export default ItemPickList;
