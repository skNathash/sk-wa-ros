import { Barcode, Layers, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouteLoaderData } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import PageLoader from "~/components/core/page-loader/PageLoader";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import VariantModal from "~/routes/dashboard/inventory/subscribe/modals/variant-modal/VariantModal";
import CommonService from "~/services/CommonService";
import SellerCatalogService from "~/services/SellerCatalogService";
import AddDealBarcodeModal from "~/shared/catalog/modals/add-deal-barcode/AddDealBarcodeModal";
import ProductSocialLinksModal from "~/shared/catalog/modals/product-social-links/ProductSocialLinksModal";
import PrintBarcodeModal from "~/shared/products/modals/print-barcode/PrintBarcodeModal";
import InventoryAddStockModal from "~/shared/catalog/modals/add-stock/InventoryAddStockModal";
import ProductBin from "./components/bin/ProductBin";
import ProductBarcode from "./components/ProductBarcode";
import ProductBasicInfo from "./components/ProductBasicInfo";
import ProductOtherInfo from "./components/ProductOtherInfo";
import ProductSocialLinks from "./components/ProductSocialLinks";
import RecentActivity from "./components/recent-activity/RecentActivity";
import StockStatus from "./components/StockStatus";

const rbacRoles = {
  addStock: ["INVENTORY.ADD-STOCK"],
};

const DealOverview = () => {
  const { t } = useTranslation(["common"]);

  const { isMobile } = useScreenView();

  const loadedData = useRouteLoaderData(
    "routes/dashboard/inventory/products/view/layout",
  ) as any;

  const [productData, setProductData] = useState<any>(null);
  const [addStockModal, setAddStockModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: null });

  const [addDealBarcodeModal, setAddDealBarcodeModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: null });

  const [printBarcodeModal, setPrintBarcodeModal] = useState<{
    show: boolean;
    dealId?: string;
  }>({ show: false, dealId: "" });

  const [variantModal, setVariantModal] = useState<{
    show: boolean;
    dealId?: string;
  }>({ show: false, dealId: "" });

  const [socialLinksModal, setSocialLinksModal] = useState(false);

  const appNav = useAppNav();

  useEffect(() => {
    if (loadedData) {
      setProductData(loadedData);
    }
  }, [loadedData]);

  const handlePriceUpdate = (updatedData: Partial<any>) => {
    if (productData) {
      setProductData({
        ...productData,
        ...updatedData,
      });
    }
  };

  const handleAddStockModal = ({ action, data }: any) => {
    if (action === "close") {
      setAddStockModal({ show: false, data: null });
    } else if (action === "submit") {
      // Update the product stock (quantity) in the product data
      if (addStockModal.data && typeof data?.quantity === "number") {
        setProductData((prev: any) => ({
          ...prev,
          actualMaxQty: prev.actualMaxQty + data.quantity,
        }));
      }
      setAddStockModal({ show: false, data: null });

      // Refresh the page to get updated data
      window.location.reload();
    }
  };

  const handleStockStatusCb = ({ action, data }: any) => {
    setAddStockModal({ show: true, data: productData });
  };

  const renderStockStatus = () => {
    return (
      <StockStatus
        totalStock={productData.totalStock}
        stockValue={productData.inventoryValue}
        daysOfStock={productData.daysOfStock}
        stock={productData.actualMaxQty}
        blockedQty={productData.blockedQty}
        pickedQty={productData.pickedQty}
        dealId={productData?._id}
        productName={productData?.name}
        callback={handleStockStatusCb}
        hideAddStock={productData?.isKCStoreEnabled}
        caseQty={productData.caseQty}
        innerCaseQty={productData.innerCaseQty}
        sellingType={productData.sellingType}
        isReserve={productData.isReserve}
        packageQty={productData.packageQty}
        selectedStockUom={productData.selectedStockUom}
        hideUnitConfigEdit={productData.hideUnitConfigEdit}
      />
    );
  };

  const handleManageBarcodesModal = ({ action, data }: any) => {
    if (action === "close") {
      setAddDealBarcodeModal({ show: false, data: null });
      return;
    }

    if (action === "submit") {
      const added: string[] = Array.isArray(data?.addedBarcodes)
        ? data.addedBarcodes
        : data?.barcode
          ? [data.barcode]
          : [];
      if (added.length && productData) {
        setProductData((prev: any) => {
          const existing: string[] = Array.isArray(prev?.barcodes)
            ? prev.barcodes
            : [];
          const merged = [...existing];
          for (const c of added) {
            if (!merged.includes(c)) merged.push(c);
          }
          return { ...prev, barcodes: merged };
        });
      }
    }

    setAddDealBarcodeModal({ show: false, data: null });
  };

  const handleAddBarcode = () => {
    setAddDealBarcodeModal({ show: true, data: null });
  };

  if (!loadedData || !productData) {
    return <PageLoader />;
  }

  // Seller's own links populate the inputs; deal-level links are shown as
  // placeholders only (defaults, not auto-filled).
  const sellerLinks = SellerCatalogService.prepareSocialMediaLinks({
    sellerSocialMediaLinks: productData?.sellerSocialMediaLinks,
  });
  const dealLinks = SellerCatalogService.prepareSocialMediaLinks({
    dealSocialMediaLinks: productData?.dealSocialMediaLinks,
  });

  return (
    <>
      <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-4">
        <div className="tw:md:w-2/3">
          <ProductBasicInfo
            basic={productData}
            onPriceUpdate={handlePriceUpdate}
          />

          {productData?.groupDeals &&
            Array.isArray(productData.groupDeals) &&
            productData.groupDeals.length > 0 && (
              <div
                className="tw:flex tw:items-center tw:justify-between tw:p-3 tw:bg-orange-50 tw:border tw:border-orange-100 tw:rounded-md tw:mb-4 tw:cursor-pointer hover:tw:bg-orange-100 tw:transition-colors"
                onClick={() =>
                  setVariantModal({ show: true, dealId: productData._id })
                }
              >
                <div className="tw:flex tw:items-center tw:gap-2">
                  <div className="tw:p-1.5 tw:bg-orange-100 tw:rounded-full tw:text-orange-600">
                    <Layers size={16} />
                  </div>
                  <div>
                    <div className="tw:text-sm tw:font-medium tw:text-gray-900">
                      Multiple Variants Available
                    </div>
                    <div className="tw:text-xs tw:text-gray-500">
                      {productData.groupDeals.length} variants found for this
                      product
                    </div>
                  </div>
                </div>
                <AppButton
                  size="small"
                  color="primary"
                  fill="clear"
                  className="tw:text-orange-600 hover:tw:bg-orange-200 hover:tw:text-orange-700"
                >
                  View All
                </AppButton>
              </div>
            )}

          {isMobile && renderStockStatus()}

          <ProductOtherInfo basic={productData} />

          <ProductSocialLinks
            basic={productData}
            onEditLinks={
              productData?.isKCStoreEnabled
                ? undefined
                : () => setSocialLinksModal(true)
            }
          />

          <AppCard
            title={
              <div className="tw:flex tw:justify-between tw:items-center tw:gap-2 tw:w-full">
                {t("barcodes")} ({productData.barcodes.length})
                {!productData?.isKCStoreEnabled && (
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <AppButton
                      size="small"
                      fill="outline"
                      color="primary"
                      onClick={handleAddBarcode}
                    >
                      <Barcode size={16} />
                      Add Barcode
                    </AppButton>

                    <AppButton
                      size="small"
                      fill="outline"
                      color="primary"
                      onClick={() =>
                        setPrintBarcodeModal({
                          show: true,
                          dealId: productData._id,
                        })
                      }
                    >
                      <Printer size={16} />
                      Print
                    </AppButton>
                  </div>
                )}
              </div>
            }
          >
            <ProductBarcode barcodes={productData.barcodes} />
          </AppCard>
          <ProductBin dealId={productData._id} />
        </div>
        <div className="tw:md:w-1/3 tw:md:sticky tw:md:top-20 tw:self-start">
          {!isMobile && renderStockStatus()}
          <RecentActivity dealId={productData?._raw?._id} />
        </div>
      </div>

      <InventoryAddStockModal
        show={addStockModal.show}
        productId={addStockModal.data?._id}
        productName={addStockModal.data?.name}
        dealRefId={addStockModal.data?.id}
        mrp={addStockModal.data?.mrp}
        selectedStockUom={addStockModal.data?.selectedStockUom}
        callback={handleAddStockModal}
      />

      <AddDealBarcodeModal
        show={addDealBarcodeModal.show}
        callback={handleManageBarcodesModal}
        dealId={productData?._id}
      />

      <ProductSocialLinksModal
        show={socialLinksModal}
        dealId={productData?._id}
        youtubeLink={sellerLinks.youtubeLink?.[0]?.link || ""}
        instagramLink={sellerLinks.instaLink?.[0]?.link || ""}
        youtubeDefault={dealLinks.youtubeLink?.[0]?.link || ""}
        instagramDefault={dealLinks.instaLink?.[0]?.link || ""}
        callback={({ action, data }) => {
          setSocialLinksModal(false);
          if (action === "submit") {
            const { youtubeLink, instaLink } =
              SellerCatalogService.prepareSocialMediaLinks({
                sellerSocialMediaLinks: data || [],
              });
            setProductData((prev: any) => ({
              ...prev,
              sellerSocialMediaLinks: data || [],
              youtubeLink,
              instaLink,
            }));
          }
        }}
      />

      <PrintBarcodeModal
        show={printBarcodeModal.show}
        dealId={printBarcodeModal.dealId || productData?._id}
        callback={(e: any) => {
          if (e?.action === "close") {
            setPrintBarcodeModal({ show: false, dealId: "" });
          }
          if (e?.action === "printed") {
            setPrintBarcodeModal({ show: false, dealId: "" });
          }
        }}
      />

      {variantModal.show && (
        <VariantModal
          show={variantModal.show}
          callback={(e) => {
            if (e.action === "close") {
              setVariantModal({ show: false, dealId: "" });
            }
            if (e.action === "open_cart") {
              setVariantModal({ show: false, dealId: "" });
              appNav.to("/dashboard/inventory/subscribe/cart");
            }
          }}
          dealId={variantModal.dealId || ""}
          showAllDeals={true}
        />
      )}
    </>
  );
};
export default DealOverview;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Products Overview"),
    },
  ];
}
