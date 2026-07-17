import { Package } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import Boxes from "./components/Boxes";
import PODetails from "./components/PODetails";
import DesktopView from "./components/products/DesktopView";
import MobileView from "./components/products/MobileView";
import { getData, prepareProducts } from "./helper";
import BoxReceiveModal from "./modals/receive/BoxReceiveModal";
import ScanModal from "./modals/ScanModal";
import { produce } from "immer";

const SKPrimaryReceiveProcess = () => {
  const { id } = useParams();
  const appToast = useAppToast();
  const { isMobile } = useScreenView();

  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [poDetails, setPODetails] = useState<any>(null);

  const [receiveModal, setReceiveModal] = useState<{
    show: boolean;
    selectedBox?: any;
  }>({ show: false });

  const [scanModal, setScanModal] = useState<{
    show: boolean;
  }>({ show: false });

  const [breadcrumbs] = useState<BreadcrumbItem[]>([
    { label: "Dashboard", redirect: { path: "/dashboard" } },
    {
      label: "Purchase Orders",
      redirect: { path: "/dashboard/purchase-order/list" },
    },
    { label: "Receive SK Order" },
  ]);

  const fetchDetails = useCallback(async () => {
    if (!id) return;

    setLoading(true);

    try {
      const { packages, products, poDetails } = await getData(id);

      setPackages(packages.map((box: any) => ({ ...box, _selected: false })));

      setPODetails(poDetails);
      if (products && products.length > 0) {
        setProducts(products);
      } else {
        setProducts(prepareProducts(packages));
      }
    } catch (error) {
      console.error("Error fetching details:", error);
      appToast.show({
        msg:
          error instanceof Error
            ? error.message
            : "Failed to fetch order details",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleReceiveOrder = () => {
    setScanModal({ show: true });
  };

  const handleReceiveModalClose = () => {
    setReceiveModal({ show: false, selectedBox: undefined });
  };

  const handleReceiveModalReceive = (_data: any) => {
    // Refetch details to reflect the latest state after successful receive
    fetchDetails();
    setReceiveModal({ show: false, selectedBox: undefined });
  };

  const handleScanModalCallback = (data: { action: string; data?: any }) => {
    if (data.action === "close") {
      setScanModal({ show: false });
    } else if (data.action === "scan") {
      const { found, box, barcode } = data.data;
      if (found) {
        appToast.show({
          msg: `Package found: ${box.boxNo}`,
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
        msg: `Successfully received package: ${box.boxNo}`,
        color: "success",
      });

      setScanModal({ show: false });
    } else if (data.action === "receive") {
      const { box } = data.data;
      setScanModal({ show: false });
      setReceiveModal({ show: true, selectedBox: box });
    }
  };

  const handleBoxCallback = (a: { action: string; data?: any }) => {
    if (a.action === "select") {
      setPackages(
        produce((draft) => {
          const index = draft.findIndex((box) => box._id === a.data._id);
          if (index !== -1) {
            draft[index]._selected = !draft[index]._selected;
          }
        })
      );
    }
  };

  return (
    <>
      <AppHeader title="Receive SK Order" />
      <div className="page-bg tw:p-4 app-page">
        <div className="app-container">
          {/* Breadcrumb and Receive Order Button Row */}
          <div className="tw:flex tw:items-center tw:justify-between tw:mb-6">
            <AppBreadcrumbs data={breadcrumbs} />
            {poDetails && packages.length > 0 && (
              <AppButton
                color="success"
                onClick={handleReceiveOrder}
                className="tw:flex tw:items-center tw:gap-2"
              >
                <Package className="tw:w-4 tw:h-4" />
                Receive Order
              </AppButton>
            )}
          </div>

          {loading ? (
            <div className="tw:p-4 tw:text-center tw:flex tw:justify-center tw:items-center tw:h-full">
              <AppSpinner />
            </div>
          ) : !poDetails ? (
            <NoData />
          ) : (
            <>
              <PODetails
                poDetails={poDetails}
                packages={packages}
                products={products}
              />
              <Boxes boxes={packages} callback={handleBoxCallback} />
              <AppCard title={`Order Items (${products.length})`}>
                {isMobile ? (
                  <MobileView products={products} />
                ) : (
                  <DesktopView products={products} />
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
        orderId={poDetails?.skOrderId}
      />

      {/* Scan Modal */}
      <ScanModal
        show={scanModal.show}
        callback={handleScanModalCallback}
        orderId={id}
        boxes={packages}
      />
    </>
  );
};

export default SKPrimaryReceiveProcess;
