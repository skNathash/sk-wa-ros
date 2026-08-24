import { Barcode, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouteLoaderData } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ContentLoader from "~/components/core/page-loader/ContentLoader";
import useScreenView from "~/hooks/useScreenView";
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

  const [socialLinksModal, setSocialLinksModal] = useState(false);

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
        sellerDealObjId={productData._id}
        // totalStock={productData.totalStock}
        stockValue={productData.inventoryValue}
        // daysOfStock={productData.daysOfStock}
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
    return <ContentLoader />;
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
      {/* Single column at every breakpoint — the detail page already splits
          into hero / content columns, so a second split here reads cramped. */}
      <div className="tw:flex tw:flex-col tw:gap-4">
        <div>
          {/* <ProductBasicInfo
            basic={productData}
            onPriceUpdate={handlePriceUpdate}
          /> */}

          {renderStockStatus()}

          {/* Variants now live in the page's left column as the
              "Available Variants" list (see ProductVariants). */}

          {/* <ProductOtherInfo basic={productData} /> */}

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
        <div>
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
