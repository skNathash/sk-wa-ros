import {
  CheckCircle,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  Gift,
  ImagePlus,
  Info,
  Layers,
  Pencil,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import UomPriceService from "~/services/UomPriceService";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppPopover from "~/components/core/popover/AppPopover";
import DealSummaryPopover from "~/components/feature/inventory/popover/deal-sales-summary/DealSummaryPopover";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import AuthService from "~/services/AuthService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";
import AddMoreImagesModal from "~/shared/catalog/modals/add-more-images/AddMoreImagesModal";
import PriceConfigModal from "~/shared/catalog/modals/price-config/PriceConfigModal";
import PriceSchemeModal from "~/shared/catalog/modals/price-scheme/PriceSchemeModal";
import PriceSlabConfigModal from "~/shared/catalog/modals/price-slab-config/PriceSlabConfigModal";
import UnitConfigurationModal from "~/shared/catalog/modals/unit-configuration/UnitConfigurationModal";
import Images from "./Images";
import PriceBlock from "./PriceBlock";
import CompetitorPrice from "~/shared/catalog/components/competitor-price/CompetitorPrice";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface ProductBasicInfoProps {
  basic: any;
  onPriceUpdate?: (updatedData: Partial<any>) => void;
}

const ProductBasicInfo = ({ basic, onPriceUpdate }: ProductBasicInfoProps) => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const [_, setSearchParams] = useSearchParams();
  const toast = useAppToast();

  const baseUom = UomPriceService.getBaseUom(basic?.selectedStockUom);

  const isB2cFixed =
    (basic?.b2cDiscountType || "").toString().toLowerCase() === "fixed";
  const isB2bFixed =
    (basic?.b2bDiscountType || "").toString().toLowerCase() === "fixed";

  const [priceConfigModal, setPriceConfigModal] = useState<{
    show: boolean;
    type: "network" | "customer";
    dealId: string;
  }>({
    show: false,
    type: "customer",
    dealId: "",
  });

  const [priceSlabModal, setPriceSlabModal] = useState<{
    show: boolean;
    editId?: string;
    targetDetails?: {
      label: string;
      value: { id: string; name?: string; objId?: string };
    }[];
    slabs?: Array<{
      fromQty: number;
      toQty: number;
      discount: number;
    }>;
    channel?: "b2b" | "b2c";
    disableChannel?: boolean;
    hideTabs?: boolean;
  }>({
    show: false,
    editId: undefined,
    targetDetails: undefined,
    slabs: undefined,
    channel: undefined,
    disableChannel: undefined,
    hideTabs: undefined,
  });

  const [imgPreviewModal, setImgPreviewModal] = useState({
    show: false,
    images: [] as { id: string }[],
  });

  const [addMoreImagesModal, setAddMoreImagesModal] = useState({
    show: false,
  });

  const [busyloader, setBusyloader] = useState({
    show: false,
    message: "",
  });

  const [b2bSchemeModal, setB2bSchemeModal] = useState({
    show: false,
    dealId: "",
  });

  const [unitConfigModal, setUnitConfigModal] = useState({
    show: false,
  });

  // appNav removed

  const [requestStatus, setRequestStatus] = useState<{
    status: string;
    message: string;
    show: boolean;
    requestedDate?: string;
    uploadedImages?: string[];
  }>({
    status: "",
    message: "",
    show: false,
    requestedDate: "",
    uploadedImages: [],
  });

  const handleViewImages = (images: string[]) => {
    if (images && images.length > 0) {
      const formattedImages = images.map((assetId) => ({ id: assetId }));
      setImgPreviewModal({ show: true, images: formattedImages });
    }
  };

  const handleViewUploadedImages = () => {
    if (
      requestStatus.uploadedImages &&
      requestStatus.uploadedImages.length > 0
    ) {
      handleViewImages(requestStatus.uploadedImages);
    }
  };

  const handleAddMoreImages = () => {
    setAddMoreImagesModal({ show: true });
  };

  const handleAddMoreImagesModalCallback = (action: {
    action: string;
    data?: any;
  }) => {
    if (action.action === "close") {
      setAddMoreImagesModal({ show: false });
    }
    if (action.action === "submit") {
      setAddMoreImagesModal({ show: false });

      // Show request status
      setRequestStatus({
        status: "success",
        message: "Images uploaded successfully. Request is being processed.",
        show: true,
      });

      // Fetch the request details
      fetchRequestStatus();
    }
  };

  const fetchRequestStatus = async () => {
    const resp = await InventorySubscribeService.getSellerDealRequests({
      filter: {
        status: "PENDING",
        dealId: basic._id,
        type: "IMAGE_UPDATE",
      },
      sort: {
        createdAt: -1,
      },
    });
    if (
      resp?.statusCode === 200 &&
      resp.data?.data &&
      resp.data.data.length > 0
    ) {
      const data = resp.data.data || [];
      const requestData = resp.data.data[0];
      let pendingImages: string[] = [];
      data
        .filter((x: any) => x.status === "PENDING")
        .forEach((x: any) => {
          pendingImages = pendingImages.concat(x.newImages);
        });
      setRequestStatus({
        status: requestData.status,
        message: `Request ${requestData.status}`,
        show: true,
        requestedDate: requestData.createdAt,
        uploadedImages: pendingImages,
      });
    }
  };

  // Fetch request status on component mount
  useEffect(() => {
    if (basic._id) {
      fetchRequestStatus();
    }
  }, [basic._id]);

  const imgPreviewModalCallback = (event: { action: string; data?: any }) => {
    if (event.action === "close") {
      setImgPreviewModal({ show: false, images: [] });
    }
  };

  const handlePriceEdit = (type: "network" | "customer") => {
    setPriceConfigModal({
      show: true,
      type,
      dealId: basic._id,
    });
  };

  const handlePriceSlabEdit = async () => {
    setBusyloader({ show: true, message: "Loading price slab data..." });
    let editId = null;

    let dealData = { ...basic };

    const dealResp = await SellerCatalogService.getProducts({
      filter: { dealId: basic._id },
    });
    setBusyloader({ show: false, message: "" });

    if (dealResp.statusCode !== 200) {
      return;
    }

    dealData = dealResp.data?.data?.[0] || null;
    if (dealData) {
      const formatted = SellerCatalogService.formatProductResponse([
        dealData,
      ])[0];
      dealData = formatted;
    }

    if (dealData?.networkPriceSlab?.isAvailable) {
      editId = dealData?.networkPriceSlab?.configId;
    }

    setPriceSlabModal({
      show: true,
      editId: editId,
      targetDetails: [
        {
          label: dealData.name,
          value: { id: dealData._id, name: dealData.name, objId: dealData._id },
        },
      ],
      slabs: dealData?.networkPriceSlab?.slab,
      channel: "b2b",
      disableChannel: true,
      hideTabs: false,
    });
  };

  const handleB2bSchemeEdit = () => {
    if (!basic?.isB2bMarginConfigured) {
      toast.show({ msg: "Please configure B2B margin first", color: "error" });
      return;
    }

    setB2bSchemeModal({
      show: true,
      dealId: basic._id,
    });
  };

  const handlePriceSlabModalCallback = async (action: {
    action: string;
    data?: any;
  }) => {
    setPriceSlabModal({ show: false });
  };

  const handleB2bSchemeModalCallback = async (action: {
    action: string;
    data?: any;
  }) => {
    setB2bSchemeModal({ show: false, dealId: "" });
    if (action.action === "save" || action.action === "remove") {
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set("t", new Date().getTime().toString());
          return params;
        },
        { replace: true },
      );
    }
  };

  const handleModalCallback = (action: { action: string; data?: any }) => {
    if (action.action === "close") {
      setPriceConfigModal({
        show: false,
        type: "customer",
        dealId: "",
      });
    }
    if (action.action === "update" && action.data) {
      // Update the displayed values based on the response
      setPriceConfigModal({
        show: false,
        type: "customer",
        dealId: "",
      });

      // Notify parent component of the price update
      if (onPriceUpdate) {
        setSearchParams(
          (prev) => {
            const params = new URLSearchParams(prev);
            params.set("t", new Date().getTime().toString());
            return params;
          },
          { replace: true },
        );
        // const updatedData: Partial<any> = {};
        // if (action.data.type === "network") {
        //   updatedData.b2bPrice = action.data.price;
        //   updatedData.b2bDiscount = action.data.discount;
        //   // Ensure discount type reflects fixed pricing so badge can render
        //   if (typeof action.data.isFixedPrice !== "undefined") {
        //     updatedData.b2bDiscountType = action.data.isFixedPrice
        //       ? "Fixed"
        //       : "Normal";
        //   }
        // } else {
        //   updatedData.b2cPrice = action.data.price;
        //   updatedData.discount = action.data.discount;
        //   if (typeof action.data.isFixedPrice !== "undefined") {
        //     updatedData.b2cDiscountType = action.data.isFixedPrice
        //       ? "Fixed"
        //       : "Normal";
        //   }
        // }
        // onPriceUpdate(updatedData);
      }
    }
  };

  const handleUnitConifgModalCb = async ({ action, data }: any) => {
    setUnitConfigModal({ show: false });
    await new Promise((res) => {
      setTimeout(() => {
        res(true);
      }, 500);
    });
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("t", new Date().getTime().toString());
      return params;
    });
  };

  const renderManagePriceConfigs = () => {
    const isRunning = basic.b2bScheme?.status === "Running";
    const ppd = basic.partnerPriceData;
    // Show the online-price link whenever the deal carries competitor data.
    const hasCompetitorPrice = Boolean(
      ppd?.flipkart || ppd?.amazon || ppd?.other || ppd?.others?.length,
    );
    return (
      <>
        <div className="tw:my-2 tw:rounded tw:border tw:border-slate-200 tw:bg-slate-50/80 tw:px-2.5 tw:py-1.5 tw:text-xs tw:text-slate-800">
          {isRunning && (
            <div className="tw:flex tw:items-center tw:gap-2 tw:shrink-0 tw:mb-2">
              <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:shrink-0 tw:text-emerald-700 tw:font-medium">
                <CheckCircle size={12} />
                <span className="tw:truncate">B2B scheme active</span>
              </span>

              <div className="tw:flex tw:items-baseline tw:gap-2">
                <span className="tw:text-sm tw:font-medium tw:text-slate-800">
                  <Amount
                    value={basic?.b2bScheme?.offerPrice ?? 0}
                    decimalPlaces={2}
                  />
                </span>
                <span className="tw:text-xs tw:text-gray-500 tw:capitalize">
                  (
                  {basic?.b2bScheme?.offerDiscount
                    ? `${basic?.b2bScheme?.offerDiscount}% off`
                    : ""}
                  )
                </span>
              </div>
            </div>
          )}
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:shrink-0 tw:justify-between">
            <button
              type="button"
              className="tw:inline-flex tw:items-center tw:gap-1 tw:py-0.5 tw:rounded tw:text-slate-800 tw:font-medium hover:tw:bg-slate-200/80 tw:transition-colors tw:cursor-pointer"
              onClick={handleB2bSchemeEdit}
            >
              <Gift size={12} />
              <span className="tw:truncate">B2B Scheme</span>
              <ChevronRight size={12} />
            </button>
            <button
              type="button"
              className="tw:inline-flex tw:items-center tw:gap-1 tw:py-0.5 tw:rounded tw:text-orange-700 tw:font-medium hover:tw:bg-orange-100 tw:transition-colors tw:cursor-pointer"
              onClick={handlePriceSlabEdit}
            >
              <Layers size={12} />
              <span className="tw:truncate">B2B Price slabs</span>
              <ChevronRight size={12} />
            </button>
          </div>

          {hasCompetitorPrice && (
            <div className="tw:mt-1.5 tw:pt-1.5 tw:border-t tw:border-slate-200">
              <AppPopover
                side="bottom"
                align="start"
                triggerContent={
                  <button
                    type="button"
                    className="tw:inline-flex tw:items-center tw:gap-1 tw:py-0.5 tw:rounded tw:text-blue-600 tw:font-medium hover:tw:bg-blue-50 tw:transition-colors tw:cursor-pointer"
                  >
                    <TrendingUp size={12} />
                    <span className="tw:truncate">Online prices</span>
                    <ChevronRight size={12} />
                  </button>
                }
                contentClassName="tw:w-72"
              >
                <CompetitorPrice
                  partnerPriceData={basic.partnerPriceData}
                  price={basic.b2cPrice || 0}
                  dealId={basic._id || basic.id}
                  className="tw:bg-transparent tw:p-0"
                />
              </AppPopover>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <AppCard noPadding>
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-4 tw:items-stretch">
          <div className="tw:md:w-1/2 tw:pt-4 tw:md:pb-4">
            <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-1 tw:gap-2 tw:px-4">
              <div>
                <div>
                  <Images images={basic.images || []} />
                </div>

                <div className="tw:text-center tw:my-2">
                  <AppButton
                    onClick={handleAddMoreImages}
                    color="light"
                    fill="outline"
                    size="small"
                  >
                    <ImagePlus size={14} />
                    Add More
                  </AppButton>
                </div>

                {/* <div className="tw:mt-4">
                  <PromotionalDealConfig
                    dealId={basic._id}
                    isPromotionalDeal={basic.isPromotionalDeal || false}
                    isB2bConfigured={basic.isB2bMarginConfigured}
                  />
                </div> */}
              </div>
              <div className="tw:md:hidden tw:block">
                <PriceBlock
                  basic={basic}
                  isB2cFixed={isB2cFixed}
                  isB2bFixed={isB2bFixed}
                  handlePriceEdit={handlePriceEdit}
                  handlePriceSlabEdit={handlePriceSlabEdit}
                />
              </div>
            </div>

            {isMobile && (
              <div className="tw:px-2">{renderManagePriceConfigs()}</div>
            )}

            {requestStatus.show && (
              <div className="tw:p-2 tw:md:rounded tw:border-t tw:border-b tw:border-amber-200 tw:md:border-l tw:md:border-r tw:bg-amber-50 tw:md:ms-4">
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:flex tw:items-center tw:gap-1.5">
                      <div className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-amber-500 tw:flex-shrink-0" />
                      <span className="tw:text-xs tw:font-medium tw:text-amber-800 tw:truncate">
                        Image Upload Request
                      </span>
                      <span className="tw:text-xs tw:px-1.5 tw:py-0.5 tw:bg-amber-200 tw:text-amber-800 tw:rounded-full tw:capitalize tw:flex-shrink-0">
                        {requestStatus.status}
                      </span>
                    </div>
                    {requestStatus.requestedDate && (
                      <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-amber-600 tw:mt-0.5">
                        <Clock size={10} />
                        <span className="tw:truncate">
                          <DateFormat value={requestStatus.requestedDate} />
                        </span>
                      </div>
                    )}
                  </div>
                  {requestStatus.uploadedImages &&
                    requestStatus.uploadedImages.length > 0 && (
                      <AppButton
                        onClick={handleViewUploadedImages}
                        size="small"
                        color="light"
                        fill="outline"
                        className="tw:shrink-0 tw:inline-flex tw:items-center tw:gap-0.5 tw:text-xs tw:px-1.5 tw:py-0.5 tw:h-6 tw:bg-white"
                      >
                        <ExternalLink size={8} />
                        View ({requestStatus.uploadedImages.length})
                      </AppButton>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Info Blocks */}
          <div className="tw:flex tw:flex-col tw:justify-between tw:h-full tw:md:w-1/2 tw:w-full tw:px-4 tw:pb-4 tw:md:pt-4">
            {/* Price Block */}
            <div className="tw:hidden tw:md:block">
              <PriceBlock
                basic={basic}
                isB2cFixed={isB2cFixed}
                isB2bFixed={isB2bFixed}
                handlePriceEdit={handlePriceEdit}
                handlePriceSlabEdit={handlePriceSlabEdit}
              />
              {!isMobile && renderManagePriceConfigs()}
            </div>
            {/* debug removed */}
            {/* Variant button (if group deals exist) */}
            {/* Variant UI removed */}

            {/* Pack Info */}
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:bg-slate-50 tw:border tw:border-slate-100 tw:px-3 tw:py-2 tw:rounded-md tw:mb-4">
              <div className="tw:flex tw:items-center tw:gap-3 tw:overflow-hidden">
                <div className="tw:flex tw:flex-col tw:gap-0.5">
                  <span className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-slate-400 tw:font-medium">
                    {t("sellingType")}
                  </span>
                  <span className="tw:text-sm tw:font-semibold tw:text-slate-800 tw:capitalize">
                    <SellingTypeDisplay sellingType={basic.sellingType} />
                    {!basic.sellingType && "-"}
                  </span>
                </div>

                <div className="tw:w-px tw:h-8 tw:bg-slate-200"></div>

                <div className="tw:flex tw:flex-col tw:gap-0.5">
                  <span className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-slate-400 tw:font-medium">
                    Pack Qty
                  </span>
                  <span className="tw:text-sm tw:font-semibold tw:text-slate-800">
                    {basic.packageQty ?? "-"}
                    {basic.selectedStockUom && (
                      <span className="tw:text-xs tw:font-normal tw:text-slate-500 tw:ml-1">
                        {basic.selectedStockUom}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {!basic?.hideUnitConfigEdit && (
                <button
                  onClick={() => setUnitConfigModal({ show: true })}
                  className="tw:shrink-0 tw:text-primary tw:text-xs tw:underline tw:flex tw:items-center tw:gap-1"
                >
                  <Pencil size={12} />
                  Edit
                </button>
              )}
            </div>

            {/* KeyValue Block */}
            <div className="tw:grid tw:grid-cols-3 tw:md:grid-cols-3 tw:gap-2">
              {/* mrp */}
              <KeyValue label={t("mrp")} size="sm">
                <div className="tw:flex tw:flex-col">
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <DisplayPrice
                      price={basic.mrp || 0}
                      uom={basic.selectedStockUom}
                      className="tw:font-medium"
                      uomClassName="tw:text-[10px] tw:text-gray-500"
                    />
                    <AppPopover
                      triggerContent={
                        <span className="tw:cursor-pointer tw:flex tw:items-center">
                          <Info
                            size={16}
                            className="tw:text-gray-400 hover:tw:text-blue-500"
                          />
                        </span>
                      }
                      side="top"
                      align="center"
                    >
                      <span className="tw:text-xs tw:p-2 tw:block">
                        {t("mrpInfo")}
                      </span>
                    </AppPopover>
                  </div>
                  {baseUom && (
                    <span className="tw:text-[10px] tw:text-gray-500 tw:leading-tight">
                      <Amount value={basic.mrp || 0} decimalPlaces={3} /> /{" "}
                      {baseUom}
                    </span>
                  )}
                </div>
              </KeyValue>
              <KeyValue label={t("purchasePrice")} size="sm">
                {basic.purchasePrice !== undefined ? (
                  <div className="tw:flex tw:flex-col">
                    <div className="tw:flex tw:items-center tw:gap-1">
                      <DisplayPrice
                        price={basic.purchasePrice}
                        uom={basic.selectedStockUom}
                        className="tw:font-medium"
                        uomClassName="tw:text-[10px] tw:text-gray-500"
                      />
                      <AppPopover
                        triggerContent={
                          <span className="tw:cursor-pointer tw:flex tw:items-center">
                            <Info
                              size={16}
                              className="tw:text-gray-400 hover:tw:text-blue-500"
                            />
                          </span>
                        }
                        side="top"
                        align="center"
                      >
                        <span className="tw:text-xs tw:p-2 tw:block">
                          {t("purchasePriceInfo")}
                        </span>
                      </AppPopover>
                    </div>
                    {baseUom && (
                      <span className="tw:text-[10px] tw:text-gray-500 tw:leading-tight">
                        <Amount value={basic.purchasePrice} decimalPlaces={3} />{" "}
                        / {baseUom}
                      </span>
                    )}
                  </div>
                ) : (
                  "-"
                )}
              </KeyValue>
              <KeyValue label={t("stockValue")} size="sm">
                <span className="tw:font-medium">
                  <Amount value={basic.inventoryValue} decimalPlaces={2} />
                </span>
              </KeyValue>
              <KeyValue label={t("totalSold")} size="sm">
                <div className="tw:flex tw:gap-1 tw:items-center">
                  <span className="tw:font-medium">
                    <DisplayQty
                      qty={basic.totalSales?.quantity || 0}
                      isLooseQty={false}
                      uom={basic.selectedStockUom}
                    />
                  </span>
                  <AppPopover
                    triggerContent={
                      <button className="tw:cursor-pointer tw:text-slate-500 tw:mt-1">
                        <Eye size={14} />
                      </button>
                    }
                  >
                    <DealSummaryPopover salesAnalytics={basic.salesAnalytics} />
                  </AppPopover>
                </div>
              </KeyValue>

              <KeyValue label={t("revenue")} size="sm">
                <Amount value={0} decimalPlaces={2} />
              </KeyValue>

              {/* Discount removed as not present in getBasicInfo */}
              <KeyValue label={t("profit")} size="sm">
                {basic.displayPrice !== undefined ? (
                  <Amount
                    value={basic.displayPrice}
                    className="tw:font-medium"
                    decimalPlaces={2}
                  />
                ) : (
                  "-"
                )}
              </KeyValue>
            </div>
          </div>
        </div>
      </AppCard>

      <PriceConfigModal
        show={priceConfigModal.show}
        type={priceConfigModal.type}
        callback={handleModalCallback}
        dealId={priceConfigModal.dealId}
      />

      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={imgPreviewModalCallback}
        images={imgPreviewModal.images}
      />

      <AddMoreImagesModal
        show={addMoreImagesModal.show}
        callback={handleAddMoreImagesModalCallback}
        dealName={basic.name}
        dealId={basic._id}
        dealRefId={basic.id}
        oldImages={basic.images || []}
      />

      <PriceSlabConfigModal
        show={priceSlabModal.show}
        editId={priceSlabModal.editId || undefined}
        type="product"
        targetDetails={priceSlabModal.targetDetails}
        slabs={priceSlabModal.slabs}
        callback={handlePriceSlabModalCallback}
        channel={"b2b"}
        disableChannel={true}
        hideTabs={false}
      />

      <PriceSchemeModal
        show={b2bSchemeModal.show}
        callback={handleB2bSchemeModalCallback}
        dealId={b2bSchemeModal.dealId}
      />

      <BusyLoader show={busyloader.show} message={busyloader.message} />

      <UnitConfigurationModal
        show={unitConfigModal.show}
        callback={handleUnitConifgModalCb}
        dealId={basic._id}
      />

      {/* VariantModal removed */}
    </>
  );
};

export default ProductBasicInfo;
