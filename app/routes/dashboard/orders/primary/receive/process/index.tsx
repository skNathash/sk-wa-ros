import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Package } from "lucide-react";
import AppHeader from "~/components/core/header/AppHeader";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import Boxes from "./components/Boxes";
import { AuthService } from "~/services/AuthService";
import LogisticsService from "~/services/LogisticsService";
import useAppToast from "~/hooks/useAppToast";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import BoxReceiveModal from "./modals/receive/BoxReceiveModal";
import ScanModal from "./modals/ScanModal";
import {
  attachInvoiceDetails,
  getInvoices,
  prepareProducts,
  bulkReceiveBoxes,
} from "./helper";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import useScreenView from "~/hooks/useScreenView";
import AppCard from "~/components/core/card/AppCard";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import type { ViewToggleType } from "~/types/CommonTypes";
import DesktopView from "./components/products/DesktopView";
import MobileView from "./components/products/MobileView";
import Summary from "./components/Summary";
import OmsService from "~/services/OmsService";
import AppBadge from "~/components/core/badge/AppBadge";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import Amount from "~/components/core/amount/Amount";
import { useTranslation } from "react-i18next";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: { path: "/dashboard" },
    langKey: "dashboard",
  },
  {
    label: "Orders",
    redirect: { path: "/dashboard/orders/list" },
    langKey: "orders",
  },
  { label: "Receive", langKey: "receive" },
];

const PrimaryReceiveProcess = () => {
  const { t } = useTranslation();

  const { id } = useParams();
  const appToast = useAppToast();
  const { isMobile } = useScreenView();

  const [view, setView] = useState<ViewToggleType>("list");

  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [order, setOrder] = useState<any>(null);

  const [canReceive, setCanReceive] = useState(false);

  const [busyLoader, setBusyLoader] = useState<{
    show: boolean;
    msg?: string;
  }>({ show: false, msg: "" });

  const [receiveModal, setReceiveModal] = useState<{
    show: boolean;
    selectedBox?: any;
  }>({ show: false });

  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title?: string;
    description?: string;
    onConfirm: () => void;
    onCancel: () => void;
    okText?: string;
    cancelText?: string;
  }>({ show: false, onConfirm: () => {}, onCancel: () => {} });

  const [scanModal, setScanModal] = useState<{
    show: boolean;
  }>({ show: false });

  const fetchDetails = async () => {
    if (!id) return;

    setLoading(true);
    setCanReceive(false);

    try {
      const response = await LogisticsService.getBoxes(
        AuthService.getLoggedInUserId(),
        {
          filter: {
            "order.id": id,
          },
        }
      );

      const data = response?.data?.data?.[0];

      const invoices = data?.packages
        ?.map((p: any) => p?.invoice?.id)
        .filter(Boolean);

      let invoiceDetails: any[] = [];
      let products: any[] = prepareProducts(data?.packages);
      let orderDetails: any = {};

      if (data?.orderId) {
        const orderResp = await OmsService.getSellerOrderDetail(data?.orderId);
        if (orderResp?.data?.data?._id) {
          orderDetails = OmsService.formatOrderResponse([
            orderResp?.data?.data || {},
          ])[0];
        }
      }

      if (invoices.length > 0) {
        const invResp = await getInvoices(invoices);
        invoiceDetails = invResp;
        products = attachInvoiceDetails(products, invoiceDetails);
      }

      const packages = data?.packages || [];
      setPackages(packages);
      setProducts(products);
      setOrder(orderDetails);
      setCanReceive(
        packages.filter((p: any) => p?.status === "Delivered").length > 0
      );
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleReceiveOrder = () => {
    setScanModal({ show: true });
  };

  const handleBoxReceive = (box: any) => {
    if (AuthService.isMasterLogin()) {
      appToast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }

    setReceiveModal({ show: true, selectedBox: box });
  };

  const handleReceiveAllClick = () => {
    if (AuthService.isMasterLogin()) {
      appToast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }

    setAppAlertDialog({
      show: true,
      title: "Receive all packages",
      description:
        "Are you sure you want to receive all delivered packages for this order?",
      okText: "Receive All",
      cancelText: "Cancel",
      onConfirm: async () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));

        await new Promise((resolve) => setTimeout(resolve, 800));

        if (packages.length === 0) return;

        const deliveredPackages = packages.filter(
          (p: any) => p?.status === "Delivered"
        );
        if (deliveredPackages.length === 0) {
          appToast.show({
            msg: "No delivered packages to receive",
            color: "warning",
          });
          return;
        }

        const franchiseId = AuthService.getLoggedInUserId();

        // show busy loader and update progress via its message
        setBusyLoader({
          show: true,
          msg: `Receiving 0/${deliveredPackages.length} packages...`,
        });

        try {
          await bulkReceiveBoxes(
            deliveredPackages,
            franchiseId,
            ({ index, total, packageId, success, error }) => {
              // update busy loader message for progress
              setBusyLoader({
                show: true,
                msg: `${
                  success ? "Received" : "Failed"
                } ${packageId} (${index}/${total})`,
              });

              // keep toasts minimal: show only failures as danger
              if (!success) {
                appToast.show({
                  msg: `Failed to receive package ${packageId} (${index}/${total})`,
                  color: "danger",
                });
              }
            }
          );

          appToast.show({ msg: `Bulk receive completed`, color: "success" });
        } catch (err) {
          console.error(err);
          appToast.show({
            msg: "Bulk receive encountered errors",
            color: "danger",
          });
        } finally {
          setBusyLoader({ show: false, msg: "" });
          fetchDetails();
        }
      },
      onCancel: () => setAppAlertDialog((prev) => ({ ...prev, show: false })),
    });
  };

  const handleReceiveModalClose = () => {
    setReceiveModal({ show: false, selectedBox: undefined });
  };

  const handleReceiveModalReceive = (data: any) => {
    const { type, boxes } = data;
    appToast.show({
      msg: `Successfully received ${boxes.length} ${
        type === "box-level" ? "box" : "items"
      }`,
      color: "success",
    });

    setReceiveModal({ show: false, selectedBox: undefined });

    fetchDetails();
  };

  const handleScanModalCallback = (data: { action: string; data?: any }) => {
    if (data.action === "close") {
      setScanModal({ show: false });
    } else if (data.action === "scan") {
      const { found, box, barcode } = data.data;
      if (found) {
        appToast.show({
          msg: `Package found: ${box.packageRefNo}`,
          color: "success",
        });
      } else {
        appToast.show({
          msg: `Package with barcode "${barcode}" not found in this order`,
          color: "warning",
        });
      }
    } else if (data.action === "submit") {
      const { box, barcode } = data.data;
      appToast.show({
        msg: `Successfully received package: ${box.packageRefNo}`,
        color: "success",
      });

      setScanModal({ show: false });
    } else if (data.action === "receive") {
      const { box } = data.data;
      setScanModal({ show: false });
      setReceiveModal({ show: true, selectedBox: box });
    }
  };

  return (
    <>
      <AppHeader title="Receive Order" />
      <div className="page-bg tw:p-4 app-page">
        <div className="app-container">
          {/* Breadcrumb and Receive Order Button Row */}
          <div className="tw:flex tw:items-center tw:justify-between tw:mb-6">
            <AppBreadcrumbs data={breadcrumbs} />
            {packages.length > 0 && canReceive && (
              <div className="tw-flex tw-items-center tw-gap-2">
                <AppButton
                  color="success"
                  onClick={handleReceiveAllClick}
                  className="tw:flex tw:items-center tw:gap-2 tw-mr-2"
                >
                  <Package />
                  {t("receiveAll")}
                </AppButton>
              </div>
            )}
          </div>

          {loading ? (
            <div className="tw:p-4 tw:text-center tw:flex tw:justify-center tw:items-center tw:h-full">
              <AppSpinner />
            </div>
          ) : (
            <>
              <Summary
                orderId={order?.orderRefNo}
                orderDate={order?.orderedDate}
                status={order?._statusLbl}
                statusColor={order?._statusColor}
                shippedBy={order?.sellerInfo?.franchiseName}
              />
              <Boxes boxes={packages} onReceive={handleBoxReceive} />
              <AppCard title={`${t("orderItems")} (${products.length})`}>
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-4">
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <AppBadge variant="light">
                      {t("totalItems")}: {products.length}
                    </AppBadge>

                    <AppBadge variant="light">
                      {t("totalOrderAmount")}:{" "}
                      <Amount value={order?._payableAmt} />
                    </AppBadge>
                  </div>

                  <ViewToggle viewType={view} callback={setView} />
                </div>

                {isMobile || view === "card" ? (
                  <MobileView
                    products={order?.items || []}
                    showReceived={order?.status === "Delivered"}
                  />
                ) : (
                  <DesktopView
                    products={order?.items || []}
                    showReceived={order?.status === "Delivered"}
                  />
                )}
              </AppCard>
            </>
          )}
        </div>
      </div>

      {/* Receive Modal */}
      <BoxReceiveModal
        show={receiveModal.show}
        onClose={handleReceiveModalClose}
        selectedBox={receiveModal.selectedBox}
        onReceive={handleReceiveModalReceive}
      />

      {/* Scan Modal */}
      <ScanModal
        show={scanModal.show}
        callback={handleScanModalCallback}
        orderId={id}
        boxes={packages}
      />

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        okText={appAlertDialog.okText}
        cancelText={appAlertDialog.cancelText}
        onConfirm={appAlertDialog.onConfirm}
        onCancel={appAlertDialog.onCancel}
      />

      <BusyLoader show={busyLoader.show} message={busyLoader.msg} />
    </>
  );
};

export default PrimaryReceiveProcess;
