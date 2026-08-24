import { useEffect, useState, type ReactNode } from "react";
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

interface StatTileProps {
  label: string;
  value: ReactNode;
  /** Colour treatment — a zero count always falls back to the neutral tile. */
  tone: "total" | "picked" | "blocked";
  isEmpty?: boolean;
  onView?: () => void;
  viewLabel?: string;
}

const toneClasses: Record<StatTileProps["tone"], string> = {
  total: "tw:bg-emerald-50 tw:border-emerald-100 tw:text-emerald-800",
  picked: "tw:bg-amber-50 tw:border-amber-100 tw:text-amber-700",
  blocked: "tw:bg-red-50 tw:border-red-100 tw:text-red-600",
};

const emptyToneClass = "tw:bg-gray-50 tw:border-gray-200 tw:text-gray-500";

/** One of the three counters that head an item card: total / picked / blocked. */
const StatTile = ({
  label,
  value,
  tone,
  isEmpty,
  onView,
  viewLabel,
}: StatTileProps) => (
  <div
    className={`tw:rounded-xl tw:border tw:px-2 tw:py-2.5 tw:text-center ${
      isEmpty ? emptyToneClass : toneClasses[tone]
    }`}
  >
    <div className="tw:text-2xl tw:font-bold tw:leading-none">{value}</div>
    <div className="tw:text-[10px] tw:tracking-wide tw:uppercase tw:text-gray-500 tw:mt-1">
      {label}
    </div>
    {onView && (
      <div
        className="tw:text-[11px] tw:text-blue-600 tw:cursor-pointer tw:mt-0.5"
        onClick={(e) => {
          e.stopPropagation();
          onView();
        }}
      >
        {viewLabel}
      </div>
    )}
  </div>
);

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
      {/* The card is rendered without padding of its own (`noPadding` in
          Products) and the gutter lives here instead, so the section rules can
          bleed edge to edge with `tw:-mx-4`. */}
      <div className="tw:p-4">
        {/* locationId is available as a prop: {locationId} */}
        {/* Identity row: thumbnail, name, id · brand, activity log. */}
        <div className="tw:flex tw:gap-3">
          <ImgRender
            assetId={
              Array.isArray(item?.images) && item.images.length > 0
                ? item.images[0]
                : ""
            }
            alt={item.dealName}
            className="tw:w-14 tw:h-14 tw:shrink-0 tw:object-cover tw:rounded-lg tw:bg-gray-100"
          />
          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:text-base tw:font-semibold tw:text-gray-900 tw:leading-snug">
              <AppLink
                asLink
                href={`/dashboard/inventory/products/view/${item.dealId}`}
              >
                {item.dealName}
              </AppLink>
            </div>
            <div className="tw:flex tw:gap-2 tw:mt-0.5 tw:items-center tw:flex-wrap tw:text-xs tw:text-gray-500">
              <span className="tw:font-mono">
                {t("id")} {item.dealRefId}
              </span>
              <span aria-hidden>·</span>
              <span>{item.brandName || "N/A"}</span>
            </div>
            <div
              className="tw:text-xs tw:text-blue-600 tw:cursor-pointer tw:mt-1"
              onClick={(e) => {
                e.stopPropagation();
                setShowActivityModal(true);
              }}
            >
              {t("viewActivityLog")} →
            </div>
          </div>
        </div>

        <Divider className="tw:my-3 tw:-mx-4" />

        {/* Counters — total / picked / blocked, in one scannable band. */}
        <div className="tw:grid tw:grid-cols-3 tw:gap-2">
          <StatTile
            tone="total"
            label={t("totalUnits")}
            isEmpty={!item.totalQty}
            value={
              <DisplayQty
                qty={item.totalQty}
                isLooseQty={false}
                uom={item.selectedStockUom}
                hideDefaultUom
              />
            }
          />
          <StatTile
            tone="picked"
            label={t("pickedQty")}
            isEmpty={!item.totalPickedQty}
            value={
              <DisplayQty
                qty={item.totalPickedQty}
                isLooseQty={false}
                uom={item.selectedStockUom}
                hideDefaultUom
              />
            }
            viewLabel={t("view")}
            onView={() => callback({ action: "picking-log", data: item })}
          />
          <StatTile
            tone="blocked"
            label={t("blockedQty")}
            isEmpty={!item.blockedQuantity}
            value={
              <DisplayQty
                qty={item.blockedQuantity ?? 0}
                isLooseQty={false}
                uom={item.selectedStockUom}
                hideDefaultUom
              />
            }
            viewLabel={t("view")}
            onView={() => setShowBlockedQtyModal(true)}
          />
        </div>

        <Divider className="tw:my-3 tw:-mx-4" />

        <ShelfLifeOverview
          data={shelfOverview}
          selectedStockUom={item.selectedStockUom}
          totalQty={item.totalQty}
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

        <Divider className="tw:my-3 tw:-mx-4" />

        <Barcodes barcodes={barcodes} />

        {/* Mrps renders nothing without prices — keep its rule out of the flow
          too, so the card never shows two hairlines back to back. */}
        {mrps.length > 0 && (
          <>
            <Divider className="tw:my-3 tw:-mx-4" />
            <Mrps mrps={mrps} />
          </>
        )}

        <Divider className="tw:my-3 tw:-mx-4" />

        <div>
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
        <Divider className="tw:my-3 tw:-mx-4" />
        <ActionButtons
          callback={(a) => callback({ ...a, data: item })}
          item={item}
        />
      </div>
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
