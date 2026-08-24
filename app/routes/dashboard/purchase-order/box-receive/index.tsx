import { debounce } from "lodash";
import { BarcodeIcon, Package, ScanLine } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import BarcodeScan from "~/components/core/barcode-scan/BarcodeScan";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import { ALERT_DISMISS_TIME } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";
import MiscService from "~/services/MiscService";
import PageAccessService from "~/services/PageAccessService";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import PoSectionTabs from "~/shared/purchase-order/components/PoSectionTabs";
import CreatePoFab from "~/shared/purchase-order/components/CreatePoFab";
import PurchaseOrderSidePane from "~/shared/purchase-order/components/purchase-order-side-pane/PurchaseOrderSidePane";
import BoxItem from "~/shared/orders/order-boxes/components/BoxItem";
import BulkBoxReceiveModal from "~/shared/orders/receive-box/modals/bulk-box/BulkBoxReceiveModal";
import ReceiveBoxModal from "~/shared/orders/receive-box/modals/receive-box/ReceiveBoxModal";
import ViewBoxItemsModal from "~/shared/orders/receive-box/modals/view-box-items/ViewBoxItems";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import { getDetails } from "./helper";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: { path: "/dashboard" },
    langKey: "dashboard",
  },
  {
    label: "Purchase Orders",
    redirect: { path: "/dashboard/purchase-order/summary" },
    langKey: "purchaseOrders",
  },
  {
    label: "Receive Box",
    langKey: "receiveBox",
  },
];

const BoxReceive = () => {
  const { t } = useTranslation();
  const appNav = useAppNav();

  const { register, handleSubmit, getValues, setValue } = useForm();

  const scannerDetector = MiscService.createScannerDetector();

  const [scanning, setScanning] = useState(false);

  // Camera scanning only exists inside the Cordova app. Resolved after mount so
  // the server and first client render agree.
  const [canScan, setCanScan] = useState(false);
  useEffect(() => setCanScan(MiscService.hasCordova()), []);

  const [appAlert, setAppAlert] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
    okText: "",
  });

  const [boxes, setBoxes] = useState<any[]>([]);
  const [selectedBoxIds, setSelectedBoxIds] = useState<Record<string, boolean>>(
    {}
  );

  const allSelectableBoxIds = boxes
    .filter((b) => !b.isReceived)
    .map((b) => b._id);
  const selectedIdsArray = Object.keys(selectedBoxIds).filter(
    (id) => selectedBoxIds[id]
  );
  const isAllSelected =
    allSelectableBoxIds.length > 0 &&
    allSelectableBoxIds.every((id) => selectedBoxIds[id]);

  const doScan = async (barcode: string) => {
    if (!barcode) return;
    setScanning(true);
    try {
      const res = await getDetails(barcode);

      const payload: Record<string, any> = res || {};

      const packageId = payload?.refNo;
      const boxNo = packageId;

      if (!packageId) {
        // Prefer any backend message if available and include scanned barcode
        const scanned = barcode || "";
        const msg =
          payload?.message || `Box ${scanned || boxNo || ""} data not found`;
        setAppAlert({
          show: true,
          title: "Box Not Found",
          description: msg,
          onConfirm: () => setAppAlert((prev) => ({ ...prev, show: false })),
          onCancel: () => setAppAlert((prev) => ({ ...prev, show: false })),
          okText: "OK",
        });
        return;
      }

      if (res.isNonSkVendor) {
        setAppAlert({
          show: true,
          title: "Non-SK Vendor Box",
          description: `The scanned box (${boxNo}) belongs to a Non-SK vendor. Please use the Non-SK Vendor Box Receive process to receive this box.`,
          onConfirm: async () => {
            setAppAlert((prev) => ({ ...prev, show: false }));
            await new Promise((r) => setTimeout(r, ALERT_DISMISS_TIME));
            appNav.to(
              "/dashboard/purchase-order/process/" + payload.orderData?.id
            );
          },
          onCancel: () => {
            setAppAlert((prev) => ({ ...prev, show: false }));
          },
          okText: t("receiveNow"),
        });
        return;
      }

      const orderId = payload?.orderId || "";
      const items = payload?.items || [];

      const boxed = {
        _id: packageId,
        refNo: packageId,
        invoiceNo: packageId || boxNo,
        boxNo,
        items,
        orderId,
        raw: res,
        isReceived: (payload?.status || "").toLowerCase() === "delivered",
        orderData: payload?.orderData || {},
        invoiceData: payload?.invoiceData || {},
        from: payload?.from || {},
        totalItems: payload?.totalItems,
        totalQuantity: payload?.totalQuantity,
        totalValue: payload?.totalValue,
        createdAt: payload?.createdAt,
      };

      if (boxed.isReceived) {
        setAppAlert({
          show: true,
          title: "Box Already Received",
          description: `Box ${boxed._id || boxNo} is already received`,
          onConfirm: () => setAppAlert((prev) => ({ ...prev, show: false })),
          onCancel: () => setAppAlert((prev) => ({ ...prev, show: false })),
          okText: "OK",
        });
        return;
      }

      // prevent duplicates
      const exists = boxes.find((b) => b._id === boxed._id);

      if (exists) {
        setAppAlert({
          show: true,
          title: "Box Already Added",
          description: `Box ${boxed._id || boxNo} already added`,
          onConfirm: () => setAppAlert((prev) => ({ ...prev, show: false })),
          onCancel: () => setAppAlert((prev) => ({ ...prev, show: false })),
          okText: "OK",
        });
        return;
      }

      if (boxes.length >= 5) {
        setAppAlert({
          show: true,
          title: "Maximum Boxes Reached",
          description: "Maximum 5 boxes are allowed",
          onConfirm: () => setAppAlert((prev) => ({ ...prev, show: false })),
          onCancel: () => setAppAlert((prev) => ({ ...prev, show: false })),
          okText: "OK",
        });
        return;
      }

      // add newest scanned box to the front
      setBoxes((prev) => [boxed, ...prev]);

      // clear the scan input after successful scan
      try {
        setValue("barcode", "");
      } catch (err) {
        // ignore
      }
    } catch (e) {
      setAppAlert({
        show: true,
        title: "Scan Failed",
        description: `Failed to fetch package details for ${barcode}`,
        onConfirm: () => setAppAlert((prev) => ({ ...prev, show: false })),
        onCancel: () => setAppAlert((prev) => ({ ...prev, show: false })),
        okText: "OK",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleBarcodeScan = (data: { action: string; data: any }) => {
    if (data.action === "scan") {
      doScan(data.data);
    }
  };

  // debounced scan handler using lodash debounce (500ms)
  const debouncedScan = useCallback(
    debounce((val: string) => {
      if (val && val.trim()) doScan(val.trim());
    }, 500),
    [doScan]
  );

  useEffect(() => {
    return () => {
      debouncedScan.cancel();
    };
  }, [debouncedScan]);

  // Handler for AppInput change - no params required by caller, it will
  // read the current value from react-hook-form and invoke the debounced scan.
  const handleInputChange = (e?: React.ChangeEvent<HTMLInputElement>) => {
    const val = getValues("barcode");
    if (!val) {
      scannerDetector.reset();
      return;
    }
    const isFromScanner = scannerDetector.trackKeystroke();
    if (isFromScanner) {
      debouncedScan(val);
      setTimeout(() => {
        e?.target?.select();
      }, 300);
    } else {
      debouncedScan(val);
    }
  };

  const [skReceivePackageModal, setSkReceivePackageModal] = useState({
    show: false,
    data: { orderId: "", boxNo: "" },
  });

  const [viewBoxItemsModal, setViewBoxItemsModal] = useState<{
    show: boolean;
    boxId?: string | null;
  }>({
    show: false,
    boxId: null,
  });

  const [bulkProcessModal, setBulkProcessModal] = useState<{
    show: boolean;
    boxIds: string[];
  }>({
    show: false,
    boxIds: [],
  });

  const handleReceiveAll = () => {
    // Validate that at least one box is selected before proceeding
    const selectedIds = Object.keys(selectedBoxIds).filter(
      (id) => selectedBoxIds[id]
    );
    if (!selectedIds.length) {
      setAppAlert({
        show: true,
        title: "No Selection",
        description: "Please select at least one box",
        onConfirm: () => setAppAlert((prev) => ({ ...prev, show: false })),
        onCancel: () => setAppAlert((prev) => ({ ...prev, show: false })),
        okText: "OK",
      });
      return;
    }

    const boxesToProcess = boxes.filter((b) => selectedIds.includes(b._id));
    if (!boxesToProcess.length) {
      setAppAlert({
        show: true,
        title: "No Selectable Boxes",
        description: "No selectable boxes found",
        onConfirm: () => setAppAlert((prev) => ({ ...prev, show: false })),
        onCancel: () => setAppAlert((prev) => ({ ...prev, show: false })),
        okText: "OK",
      });
      return;
    }

    setBulkProcessModal({
      show: true,
      boxIds: boxesToProcess.map((b) => b._id),
    });
  };

  const handleBulkProcessModalCallback = (a: {
    action: string;
    data?: any;
  }) => {
    setBulkProcessModal({ show: false, boxIds: [] });

    const boxIds =
      a?.data?.results
        ?.filter((r: any) => r?.status === "success")
        ?.map((r: any) => r?.box?.boxNo) || [];

    if (boxIds.length > 0) {
      // remove successfully received boxes from scanned list
      setBoxes((prev) => prev.filter((b) => !boxIds.includes(b.boxNo)));

      // also update selected map
      setSelectedBoxIds((sel) => {
        const copy = { ...sel };
        boxIds.forEach((id: string) => delete copy[id]);
        return copy;
      });
    }
  };

  const handleSkReceivePackageModalCallback = (data: any) => {
    const boxNo = skReceivePackageModal.data?.boxNo;

    setSkReceivePackageModal({ show: false, data });

    // If a single box was received, remove it from the scanned list
    if (data?.action === "success") {
      setBoxes((prev) => prev.filter((b) => b.boxNo !== boxNo));

      // also remove from selected map if present
      setSelectedBoxIds((sel) => {
        const copy = { ...sel };
        delete copy[boxNo];
        return copy;
      });
    }
  };

  const handleViewModalCb = (a: { action: string; data?: any }) => {
    setViewBoxItemsModal({ show: false, boxId: null });
  };

  // Single shared callback for BoxItem (matches Boxes.tsx style)
  const boxCallback = (a: { action: string; data: any }) => {
    if (a.action === "receive") {
      setSkReceivePackageModal({
        show: true,
        data: { orderId: a.data.orderData?.refId2, boxNo: a.data.boxNo },
      });
    } else if (a.action === "remove") {
      // remove the scanned box from the local list
      setBoxes((prev) => {
        const next = prev.filter(
          (b) => b._id !== a.data._id && b.boxNo !== a.data.boxNo
        );
        // also remove from selected map
        setSelectedBoxIds((sel) => {
          const copy = { ...sel };
          delete copy[a.data._id];
          return copy;
        });
        return next;
      });
    } else if (a.action === "view-items") {
      setViewBoxItemsModal({ show: true, boxId: a.data?.boxNo || a.data?._id });
    }
  };

  const toggleSelectBox = (id: string, checked: boolean, box?: any) => {
    setSelectedBoxIds((prev) => ({ ...prev, [id]: checked }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedBoxIds({});
      return;
    }
    const map: Record<string, boolean> = {};
    allSelectableBoxIds.forEach((id) => (map[id] = true));
    setSelectedBoxIds(map);
  };

  return (
    <>
      <AppHeader title={t("receiveBox")} />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          {/* PO tab bar — theme-2 mobile only (see theme-2.css). */}
          <PoSectionTabs activeTab="scan-box" outerClassName="tw:mb-3" />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="receive-stock"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                <AppPaneMain className="tw:lg:col-span-12">
                  <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:mb-4 tw:gap-2">
                    <AppBreadcrumbs data={breadcrumbs} className="tw:mb-0!" />
                    {/* <div>
                      <AppButton
                        onClick={() =>
                          appNav.to("/dashboard/purchase-order/recently-received")
                        }
                        size="small"
                        fill="outline"
                      >
                        <Clock className="tw:mr-2" />
                        {t("recentlyReceived")}
                      </AppButton>
                    </div> */}
                  </div>

                  {/* Scan block — cleaner card-based search UI. */}
                  <AppCard
                    title={
                      <span className="tw:flex tw:items-center tw:gap-2">
                        <ScanLine className="tw:w-5 tw:h-5" />
                        {t("scanBox")}
                      </span>
                    }
                    noPadding
                    noContentPadding
                    className="tw:mb-4"
                    /* `noPadding` zeroes the card's own padding, so header and
                       body each supply the same 1rem gutter — otherwise the
                       header keeps its 1.5rem inset and the title hangs 8px
                       right of the input below it, with nothing above it. */
                    headerClassName="tw:px-4 tw:pt-4"
                    bodyClassName="tw:px-4 tw:pb-4"
                  >
                    <>
                      <AppInput
                        name="barcode"
                        register={register}
                        leftIcon={<BarcodeIcon className="tw:text-primary" />}
                        placeholder={t("scanOrTypeBoxBarcode", {
                          defaultValue: "Scan or type box barcode",
                        })}
                        className="tw:w-full"
                        size="lg"
                        inputClassName="tw:text-base"
                        onChange={handleInputChange}
                        onClick={(e) =>
                          (e.currentTarget as HTMLInputElement).select()
                        }
                        autoFocus={true}
                        /* Only claim the right slot when something will show in
                           it — `BarcodeScan` renders nothing outside the Cordova
                           app, and an always-passed icon would leave the input
                           with 2.5rem of dead padding in the browser. */
                        rightIcon={
                          scanning ? (
                            <AppSpinner />
                          ) : canScan ? (
                            <BarcodeScan callback={handleBarcodeScan}>
                              <span className="tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-md tw:bg-primary/10 tw:text-primary">
                                <ScanLine className="tw:w-4 tw:h-4" />
                              </span>
                            </BarcodeScan>
                          ) : undefined
                        }
                      />
                      <p className="tw:mt-2 tw:text-xs tw:text-gray-500">
                        {t("upToFiveBoxesCanBeScannedAndReceivedTogether", {
                          defaultValue:
                            "Up to 5 boxes can be scanned and received together",
                        })}
                      </p>
                    </>
                  </AppCard>

                  {!boxes.length ? (
                    /* Empty state stands on the page background — the scan card
                       above is already the only thing to act on, so a second
                       titled card would just repeat its own heading. */
                    <NoData
                      className="tw:rounded-xl tw:border tw:border-dashed tw:border-slate-200 tw:bg-white/60"
                      icon={
                        <div className="tw:p-5 tw:rounded-full tw:bg-primary/10">
                          <Package className="tw:w-9 tw:h-9 tw:text-primary/70" />
                        </div>
                      }
                      title={t("noBoxesScannedYet", {
                        defaultValue: "No boxes scanned yet",
                      })}
                      description={t("pleaseScanBoxBarcodeToGetStarted")}
                    />
                  ) : (
                    <>
                      {/* Count + select-all on one row — they're the same
                          "what's in the list" line. */}
                      <div className="tw:flex tw:items-center tw:justify-between tw:mb-3 tw:gap-3">
                        <div className="tw:flex tw:items-center tw:gap-2">
                          <input
                            type="checkbox"
                            aria-label="Select all boxes"
                            checked={isAllSelected}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="tw:w-4 tw:h-4 tw:text-primary-600 tw:border-gray-300 tw:rounded"
                          />
                          <span className="tw:text-sm tw:text-gray-700">
                            {t("selectAllBoxes")}
                          </span>
                        </div>
                        <div className="tw:text-sm tw:text-gray-500 tw:whitespace-nowrap">
                          {selectedIdsArray.length}/{boxes.length}{" "}
                          {t("selected")}
                        </div>
                      </div>
                      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
                        {boxes.map((box) => (
                          <BoxItem
                            key={box._id}
                            box={box}
                            callback={boxCallback}
                            showCheckbox={true}
                            showReceive={true}
                            isSelected={!!selectedBoxIds[box._id]}
                            onSelect={toggleSelectBox}
                            checkboxDisabled={!!box.isReceived}
                            showRemove={true}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </AppPaneMain>

                <AppPaneSide className="app-pane-only">
                  <PurchaseOrderSidePane />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreatePoFab showScan />

      {boxes.length > 0 && (
        <div className="app-footer">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-center tw:justify-between tw:gap-2">
            <div className="tw:flex tw:items-center tw:justify-end tw:gap-2 tw:w-full tw:md:w-auto">
              <AppButton
                color="success"
                onClick={handleReceiveAll}
                className="tw:font-semibold tw:w-full tw:md:w-auto"
              >
                <Package />
                {t("receiveAll")} ({selectedIdsArray.length})
              </AppButton>
            </div>
          </div>
        </div>
      )}

      <ReceiveBoxModal
        show={skReceivePackageModal.show}
        callback={handleSkReceivePackageModalCallback}
        orderId={skReceivePackageModal.data?.orderId}
        boxNo={skReceivePackageModal.data?.boxNo}
      />

      <ViewBoxItemsModal
        show={viewBoxItemsModal.show}
        callback={handleViewModalCb}
        boxId={viewBoxItemsModal.boxId}
      />

      <BulkBoxReceiveModal
        show={bulkProcessModal.show}
        callback={handleBulkProcessModalCallback}
        boxIds={bulkProcessModal.boxIds}
      />

      <AppAlertDialog
        title={appAlert.title}
        description={appAlert.description}
        show={appAlert.show}
        okText={appAlert.okText}
        onConfirm={appAlert.onConfirm}
        onCancel={appAlert.onCancel}
      />
    </>
  );
};

export default BoxReceive;

export async function clientLoader() {
  return PageAccessService.canAccessPage([]);
}

export function meta() {
  return [{ title: CommonService.prepareAppDocumentTitle("Receive Box") }];
}
