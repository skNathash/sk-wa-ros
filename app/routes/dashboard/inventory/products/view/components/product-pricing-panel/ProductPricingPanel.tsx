import clsx from "clsx";
import {
  ChevronRight,
  Gift,
  Layers,
  PenLine,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import Amount from "~/components/core/amount/Amount";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import Rbac from "~/components/core/rbac/Rbac";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import SellerCatalogService from "~/services/SellerCatalogService";
import PriceConfigModal from "~/shared/catalog/modals/price-config/PriceConfigModal";
import PriceSchemeModal from "~/shared/catalog/modals/price-scheme/PriceSchemeModal";
import PriceSlabConfigModal from "~/shared/catalog/modals/price-slab-config/PriceSlabConfigModal";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import type { SellerDeal } from "~/types/CommonTypes";

const rbacRoles = {
  editPrice: ["CONFIGS.PRICING"],
};

export interface ProductPricingPanelProps {
  /** Formatted seller deal (see SellerCatalogService.formatProductResponse). */
  deal: SellerDeal;
  /** Fired after a price / scheme / slab change so the page can refresh. */
  onUpdated?: () => void;
  className?: string;
}

/** One stat tile — label on top, the headline figure, then a context line. */
const Tile = ({
  label,
  onEdit,
  children,
  footer,
  className,
}: {
  label: string;
  onEdit?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={clsx(
      "tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3",
      className,
    )}
  >
    <div className="tw:flex tw:items-center tw:gap-1.5">
      <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
        {label}
      </span>
      {onEdit && (
        <Rbac roles={rbacRoles.editPrice}>
          <button
            type="button"
            onClick={onEdit}
            title={`Edit ${label}`}
            aria-label={`Edit ${label}`}
            className="tw:cursor-pointer tw:text-slate-400 tw:transition-colors tw:hover:text-primary"
          >
            <PenLine size={13} />
          </button>
        </Rbac>
      )}
    </div>

    <div className="tw:mt-1 tw:text-2xl tw:font-bold tw:leading-tight tw:text-slate-900">
      {children}
    </div>

    {footer && (
      <div className="tw:mt-1 tw:text-xs tw:text-slate-500">{footer}</div>
    )}
  </div>
);

/** Margin percentage with its direction arrow, or "Fixed" when price-locked. */
const Margin = ({ value, isFixed }: { value: number; isFixed: boolean }) => {
  if (isFixed) return <span className="tw:text-slate-500">Fixed price</span>;
  const negative = (value || 0) < 0;
  return (
    <span
      className={clsx(
        "tw:inline-flex tw:items-center tw:gap-1 tw:font-semibold",
        negative ? "tw:text-red-600" : "tw:text-emerald-600",
      )}
    >
      Margin {CommonService.roundedByDecimalPlace(value || 0, 2)}%
      {negative ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
    </span>
  );
};

/**
 * Pricing panel for the item-detail page — the deal's two selling prices with
 * their margins and the last-30-day sales pace, sitting above the tabs. The
 * price tiles open the same B2C / B2B price config the overview uses, and the
 * footer links open the B2B scheme and B2B price-slab configs.
 */
const ProductPricingPanel = ({
  deal,
  onUpdated,
  className,
}: ProductPricingPanelProps) => {
  const toast = useAppToast();

  const [priceConfigModal, setPriceConfigModal] = useState<{
    show: boolean;
    type: "network" | "customer";
  }>({ show: false, type: "customer" });

  const [schemeModal, setSchemeModal] = useState(false);

  const [slabModal, setSlabModal] = useState<{
    show: boolean;
    editId?: string;
    targetDetails?: {
      label: string;
      value: { id: string; name?: string; objId?: string };
    }[];
    slabs?: Array<{ fromQty: number; toQty: number; discount: number }>;
  }>({ show: false });

  const [busy, setBusy] = useState({ show: false, message: "" });

  if (!deal?._id) return null;

  const basic = deal as any;

  const isB2cFixed =
    (basic.b2cDiscountType || "").toString().toLowerCase() === "fixed";
  const isB2bFixed =
    (basic.b2bDiscountType || "").toString().toLowerCase() === "fixed";

  const last30 = basic.salesAnalytics?.last30Days || {};
  const soldQty = last30.quantity || 0;
  const soldValue = last30.value || 0;

  const isSchemeRunning = basic.b2bScheme?.status === "Running";

  const handlePriceEdit = (type: "network" | "customer") =>
    setPriceConfigModal({ show: true, type });

  // The slab config needs the deal's current slab set, which only comes back on
  // a fresh fetch — the loader payload doesn't carry the config id.
  const handleSlabEdit = async () => {
    setBusy({ show: true, message: "Loading price slab data..." });
    const resp = await SellerCatalogService.getProducts({
      filter: { dealId: basic._id },
    });
    setBusy({ show: false, message: "" });

    if (resp.statusCode !== 200) return;

    const raw = resp.data?.data?.[0];
    const dealData = raw
      ? SellerCatalogService.formatProductResponse([raw])[0]
      : basic;

    setSlabModal({
      show: true,
      editId: dealData?.networkPriceSlab?.isAvailable
        ? dealData?.networkPriceSlab?.configId
        : undefined,
      targetDetails: [
        {
          label: dealData.name,
          value: { id: dealData._id, name: dealData.name, objId: dealData._id },
        },
      ],
      slabs: dealData?.networkPriceSlab?.slab,
    });
  };

  const handleSchemeEdit = () => {
    if (!basic.isB2bMarginConfigured) {
      toast.show({ msg: "Please configure B2B margin first", color: "error" });
      return;
    }
    setSchemeModal(true);
  };

  return (
    <>
      <section className={className}>
        <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:lg:grid-cols-3">
          <Tile
            label="B2C Price"
            onEdit={() => handlePriceEdit("customer")}
            footer={
              <>
                MRP <Amount value={basic.mrp || 0} /> ·{" "}
                <Margin value={basic.b2cDiscount} isFixed={isB2cFixed} />
              </>
            }
          >
            <DisplayPrice
              price={basic.b2cPrice || 0}
              uom={basic.selectedStockUom}
              className="tw:text-2xl tw:font-bold tw:text-slate-900"
              uomClassName="tw:text-xs tw:font-normal tw:text-slate-500"
            />
          </Tile>

          <Tile
            label="B2B Price"
            onEdit={() => handlePriceEdit("network")}
            footer={
              <>
                {basic.purchasePrice !== undefined && (
                  <>
                    cost <Amount value={basic.purchasePrice} /> ·{" "}
                  </>
                )}
                <Margin value={basic.b2bDiscount} isFixed={isB2bFixed} />
              </>
            }
          >
            <DisplayPrice
              price={basic.b2bPrice || 0}
              uom={basic.selectedStockUom}
              className="tw:text-2xl tw:font-bold tw:text-slate-900"
              uomClassName="tw:text-xs tw:font-normal tw:text-slate-500"
            />
          </Tile>

          <Tile
            label="You sell / mo"
            className="tw:col-span-2 tw:lg:col-span-1"
            footer={
              <>
                <Amount value={soldValue} /> revenue · last 30 days
              </>
            }
          >
            {soldQty}
            {basic.selectedStockUom && (
              <span className="tw:ml-1 tw:text-xs tw:font-normal tw:text-slate-500">
                {basic.selectedStockUom}
              </span>
            )}
          </Tile>
        </div>

        {/* Scheme / slab shortcuts — the B2B pricing levers for this deal. */}
        <div className="tw:mt-2 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-slate-50 tw:px-3 tw:py-2">
          <button
            type="button"
            onClick={handleSchemeEdit}
            className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded tw:text-xs tw:font-semibold tw:text-slate-700 tw:transition-colors tw:hover:text-primary"
          >
            <Gift size={13} />
            <span className="tw:truncate">B2B Scheme</span>
            {isSchemeRunning && (
              <span className="tw:rounded-full tw:bg-emerald-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:text-emerald-700">
                <Amount value={basic.b2bScheme?.offerPrice ?? 0} />
                {basic.b2bScheme?.offerDiscount
                  ? ` · ${basic.b2bScheme.offerDiscount}% off`
                  : ""}
              </span>
            )}
            <ChevronRight size={13} />
          </button>

          <button
            type="button"
            onClick={handleSlabEdit}
            className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded tw:text-xs tw:font-semibold tw:text-orange-700 tw:transition-colors tw:hover:text-orange-800"
          >
            <Layers size={13} />
            <span className="tw:truncate">B2B Price slabs</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </section>

      <PriceConfigModal
        show={priceConfigModal.show}
        type={priceConfigModal.type}
        dealId={basic._id}
        callback={({ action }: { action: string; data?: any }) => {
          setPriceConfigModal({ show: false, type: "customer" });
          if (action === "update") onUpdated?.();
        }}
      />

      <PriceSlabConfigModal
        show={slabModal.show}
        editId={slabModal.editId || undefined}
        type="product"
        targetDetails={slabModal.targetDetails}
        slabs={slabModal.slabs}
        channel="b2b"
        disableChannel={true}
        hideTabs={false}
        callback={() => setSlabModal({ show: false })}
      />

      <PriceSchemeModal
        show={schemeModal}
        dealId={basic._id}
        callback={({ action }: { action: string; data?: any }) => {
          setSchemeModal(false);
          if (action === "save" || action === "remove") onUpdated?.();
        }}
      />

      <BusyLoader show={busy.show} message={busy.message} />
    </>
  );
};

export default ProductPricingPanel;
