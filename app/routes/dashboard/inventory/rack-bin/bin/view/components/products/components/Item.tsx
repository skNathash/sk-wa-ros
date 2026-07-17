import { useEffect, useState } from "react";
import Divider from "~/components/core/divider/Divider";
import ImgRender from "~/components/core/img/ImgRender";
import BlockedQtyListModal from "~/modals/feature/inventory/blocked-qty-list/BlockedQtyListModal";
import ProductActivityModal from "~/modals/feature/inventory/product-activity/ProductActivityModal";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";
import ActionButtons from "./ActionButtons";
import Barcodes from "./Barcodes";
import ShelfLifeOverview from "./ShelfLifeOverview";
import StockDetails from "./StockDetails";
import AppLink from "~/components/core/link/AppLink";
import { useTranslation } from "react-i18next";
import { orderBy } from "lodash";
import Mrps from "./Mrps";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface ItemProps {
  callback: (a: { action: string; data?: any }) => void;
  item: any;
  binId: string;
  refresh?: number;
}

const Item = ({ callback, item, binId, refresh }: ItemProps) => {
  const { t } = useTranslation(["common"]);

  const [shelfOverview, setShelfOverview] = useState<any[]>([]);
  const [barcodes, setBarcodes] = useState<Array<{ barcode: string }>>([]);
  const [mrps, setMrps] = useState<Array<{ mrp: number }>>([]);
  const [masterData, setMasterData] = useState<any[]>([]);
  const [nearExpiryItems, setNearExpiryItems] = useState<any[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showBlockedQtyModal, setShowBlockedQtyModal] = useState(false);

  const fetchMasterData = async () => {
    const fid = AuthService.getLoggedInUserId();
    if (fid) {
      try {
        const res = await RackBinService.getMasterData(fid, {
          filter: {
            locationId: binId,
            dealId: item.dealId,
          },
          sort: {
            createdAt: -1,
          },
        });
        const dataArr = orderBy(res.data?.data || [], "createdAt", "desc");

        // Prepare shelf overview using RackBinService
        // pass ignoreNoStock=true to filter out zero-quantity groups
        const overview = RackBinService.prepareShelfOverview(dataArr, true);
        setShelfOverview(overview);
        setMasterData(dataArr);

        let mrpsList: Array<{ mrp: number }> = [];
        dataArr.forEach((item) => {
          if (
            item.mrp &&
            item.quantity > 0 &&
            !mrpsList.some((mrp) => mrp.mrp === item.mrp)
          ) {
            mrpsList.push({ mrp: item.mrp });
          }
        });
        setMrps(orderBy(mrpsList, "mrp", "asc"));

        // Prepare barcodes using RackBinService
        const barcodesList = RackBinService.prepareBarcodes(dataArr);
        setBarcodes(barcodesList);
        // Save near expiry shelf life items
        const nearExpiry = RackBinService.nearExpiryShelfLife(dataArr);
        setNearExpiryItems(nearExpiry);
      } catch (e) {
        console.error("Failed to fetch master data", e);
      }
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, [binId, item.dealId, refresh]);

  const handleStockDetailsCallback = (args: {
    action: string;
    data?: any;
    index?: number;
  }) => {
    // Forward relevant actions from StockDetails up to the parent
    if (
      args.action === "barcode-added" ||
      args.action === "batch-created" ||
      args.action === "batch-updated"
    ) {
      callback({ action: args.action, data: args.data });
    }
  };

  return (
    <>
      {/* locationId is available as a prop: {locationId} */}
      <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between">
        {/* product details */}
        <div className="tw:flex tw:gap-4">
          <div className="tw:w-20 tw:h-20">
            <ImgRender
              assetId={
                Array.isArray(item?.images) && item.images.length > 0
                  ? item.images[0]
                  : ""
              }
              alt={item.dealName}
              className="tw:w-20 tw:h-20 tw:object-cover tw:rounded-lg tw:bg-gray-200"
            />
          </div>
          <div>
            <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
              <AppLink
                asLink
                href={`/dashboard/inventory/products/view/${item.dealId}`}
              >
                {item.dealName}
              </AppLink>
            </div>
            <div className="tw:flex tw:gap-2 tw:mt-1 tw:items-center tw:flex-wrap">
              <div className="tw:text-xs tw:text-gray-500">
                {t("id")}: {item.dealRefId}
              </div>
              <div className="tw:text-xs tw:text-gray-500">
                {t("brand")}: {item.brandName || "N/A"}
              </div>
              {/* <AppBadge variant="danger">Expired</AppBadge> */}
            </div>
            <div
              className="tw:text-xs tw:text-blue-600 tw:cursor-pointer tw:mt-1"
              onClick={(e) => {
                e.stopPropagation();
                setShowActivityModal(true);
              }}
            >
              {t("viewActivityLog")}
            </div>
          </div>
        </div>

        {/* total units */}
        <div className="tw:flex tw:flex-col tw:items-end tw:justify-center tw:gap-2">
          <div className="tw:bg-blue-50 tw:rounded-lg tw:px-4 tw:py-2 tw:flex tw:gap-4 tw:items-center">
            <span className="tw:text-2xl tw:font-bold tw:text-gray-800">
              <DisplayQty
                qty={item.totalQty}
                isLooseQty={false}
                uom={item.selectedStockUom}
                hideDefaultUom
              />
            </span>
            <span className="tw:text-xs tw:text-gray-500 tw:text-center">
              {t("totalUnits")}
              <br />
              {t("inThisBin")}
            </span>
          </div>

          <div className="tw:flex tw:gap-6 tw:mt-2 tw:text-center">
            {/* <div>
              <div className="tw:text-xs tw:text-gray-500">Unit Price</div>
              <div className="tw:text-lg tw:font-medium tw:text-green-600">
                <Amount value={item.unitPrice} decimalPlaces={2} />
              </div>
            </div>
            <div>
              <div className="tw:text-xs tw:text-gray-500">Total Value</div>
              <div className="tw:text-lg tw:font-medium tw:text-gray-900">
                <Amount value={item.totalValue} decimalPlaces={2} />
              </div>
            </div> */}

            <div>
              <div className="tw:text-xs tw:text-gray-500">
                {t("pickedQty")}
              </div>
              <div className="tw:flex tw:items-end tw:gap-2">
                <div className="tw:text-lg tw:font-medium tw:text-gray-900">
                  <DisplayQty
                    qty={item.totalPickedQty}
                    isLooseQty={false}
                    uom={item.selectedStockUom}
                    hideDefaultUom
                  />
                </div>
                <div
                  className="tw:text-xs tw:text-blue-600 tw:cursor-pointer tw:mb-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    callback({ action: "picking-log", data: item });
                  }}
                >
                  {t("view")}
                </div>
              </div>
            </div>
            <div>
              <div className="tw:text-xs tw:text-gray-500">
                {t("blockedQty")}
              </div>
              <div className="tw:flex tw:items-end tw:gap-2">
                <div className="tw:text-lg tw:font-medium tw:text-red-600">
                  <DisplayQty
                    qty={item.blockedQuantity ?? 0}
                    isLooseQty={false}
                    uom={item.selectedStockUom}
                    hideDefaultUom
                  />
                </div>
                <div
                  className="tw:text-xs tw:text-blue-600 tw:cursor-pointer tw:mb-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBlockedQtyModal(true);
                  }}
                >
                  {t("view")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ShelfLifeOverview
        data={shelfOverview}
        selectedStockUom={item.selectedStockUom}
        callback={(a) => {
          // When user requests manage-expiry, pass the prepared nearExpiryItems array
          if (a.action === "manage-expiry") {
            callback({ action: a.action, data: nearExpiryItems });
          } else {
            callback({ ...a, data: item });
          }
        }}
        showManageExpiry={nearExpiryItems.length > 0}
      />

      <Barcodes barcodes={barcodes} />

      <Mrps mrps={mrps} />

      <div className="tw:mt-3 tw:space-y-3">
        <StockDetails
          data={masterData}
          productName={item.dealName}
          binId={binId}
          dealId={item.dealId}
          dealRefId={item.dealRefId}
          selectedStockUom={item.selectedStockUom}
          callback={handleStockDetailsCallback}
        />
      </div>
      <Divider />
      <ActionButtons
        callback={(a) => callback({ ...a, data: item })}
        item={item}
      />
      <ProductActivityModal
        show={showActivityModal}
        callback={(d) => {
          setShowActivityModal(false);
          // propagate close or other actions up if needed
          if (d.action && d.action !== "close") {
            callback(d);
          }
        }}
        dealId={item.dealId}
        dealName={item.dealName}
      />
      <BlockedQtyListModal
        show={showBlockedQtyModal}
        callback={() => {
          setShowBlockedQtyModal(false);
        }}
        dealId={item.dealId}
      />
    </>
  );
};

export default Item;
