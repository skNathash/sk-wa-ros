import React, { useState } from "react";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";
import SellerCatalogService from "~/services/SellerCatalogService";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
// import PickAllItems from "./pick-all/PickAllItems";

const ManualEntry: React.FC<{
  products: any[];
  orderId?: string;
  callback: (a: { action: string; data?: any }) => void;
}> = ({ products, orderId, callback }) => {
  const { isMobile } = useScreenView();
  const [loading, setLoading] = useState(false);
  const toast = useAppToast();

  const handleCallback = async (result: { action: string; data?: any }) => {
    if (result.action === "fetch-master-data" && result.data) {
      await fetchMasterData(result.data.dealId, result.data.product);
    } else if (result.action === "pick-all-complete") {
      // Handle pick all completion - refresh the products list
      callback({
        action: "refresh-products",
        data: result.data,
      });
    } else {
      // Pass through other actions to the parent callback
      callback(result);
    }
  };

  const fetchMasterData = async (dealId: string, product: any) => {
    setLoading(true);
    try {
      // First, fetch the deal details using the dealId
      const dealResponse = await SellerCatalogService.getProducts({
        filter: {
          _id: dealId,
        },
      });

      if (!dealResponse || dealResponse.statusCode !== 200) {
        toast.show({
          msg: "Failed to fetch product details.",
          color: "error",
        });
        return;
      }

      const dealData = dealResponse.data.data?.[0] || {};

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

      if (
        response &&
        response.data &&
        Array.isArray(response.data.data) &&
        response.data.data.length > 0
      ) {
        // Pass the master data back to the parent component
        callback({
          action: "selected",
          data: {
            masterData: response.data.data,
            deal: dealData,
            product: product,
          },
        });
      } else {
        toast.show({
          msg: "No master data found for this product.",
          color: "error",
        });
      }
    } catch (error) {
      console.error("Failed to load product or master data:", error);
      toast.show({
        msg: "Failed to load product data. Please try again.",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* {orderId && (
        <PickAllItems
          products={products}
          orderId={orderId}
          onPickAllComplete={(result) => {
            handleCallback({
              action: "pick-all-complete",
              data: result,
            });
          }}
          onPickAllError={(error) => {
            toast.show({
              msg: `Pick all failed: ${error.message}`,
              color: "error",
            });
          }}
        />
      )} */}
      {isMobile ? (
        <MobileView
          products={products}
          callback={handleCallback}
          loading={loading}
        />
      ) : (
        <DesktopView
          products={products}
          callback={handleCallback}
          loading={loading}
        />
      )}
    </>
  );
};

export default ManualEntry;
