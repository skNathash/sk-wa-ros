import clsx from "clsx";
import { Info, Pencil, Plus } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import Rbac from "~/components/core/rbac/Rbac";
import useAppNav from "~/hooks/useAppNav";
import BlockedQtyListModal from "~/modals/feature/inventory/blocked-qty-list/BlockedQtyListModal";
import PickingLogModal from "~/modals/feature/inventory/picking-log/PickingLogModal";
import UnitConfigurationModal from "~/shared/catalog/modals/unit-configuration/UnitConfigurationModal";
import ReserveConfig from "./ReserveConfig";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface StockStatusProps {
  stockValue: number;
  // daysOfStock: number | string;
  stock?: number | string;
  blockedQty?: number | string;
  pickedQty?: number | string;
  dealId: string;
  sellerDealObjId: string;
  // totalStock: number;
  productName?: string;
  callback?: (payload: { action: string; data?: any }) => void;
  hideAddStock?: boolean;
  caseQty?: number;
  innerCaseQty?: number;
  sellingType?: string;
  isReserve?: boolean;
  packageQty?: number;
  selectedStockUom?: string;
  hideUnitConfigEdit?: boolean;
}

const rbacRoles = {
  addStock: ["INVENTORY.ADD-STOCK"],
};

/** One stat tile — uppercase label on top, the headline figure, context line. */
const Tile = ({
  label,
  badge,
  value,
  footer,
  onClick,
  className,
  valueClassName,
}: {
  label: React.ReactNode;
  badge?: React.ReactNode;
  value: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  valueClassName?: string;
}) => {
  const Wrapper: any = onClick ? "button" : "div";
  return (
    <Wrapper
      {...(onClick ? { type: "button", onClick } : {})}
      className={clsx(
        "tw:rounded-xl tw:border tw:border-slate-200 tw:bg-slate-50 tw:px-3 tw:py-2.5 tw:text-left",
        onClick &&
          "tw:cursor-pointer tw:transition-colors tw:hover:border-slate-300 tw:hover:bg-slate-100",
        className,
      )}
    >
      <div className="tw:flex tw:items-center tw:gap-1.5">
        <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
          {label}
        </span>
        {badge}
      </div>

      <div
        className={clsx(
          "tw:mt-1 tw:text-xl tw:font-bold tw:leading-tight tw:text-slate-900",
          valueClassName,
        )}
      >
        {value}
      </div>

      {footer && (
        <div className="tw:mt-0.5 tw:text-xs tw:text-slate-500">{footer}</div>
      )}
    </Wrapper>
  );
};

/** Inline "Edit" affordance used by the unit-configuration rows. */
const EditLink = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-primary tw:transition-opacity tw:hover:opacity-80"
  >
    <Pencil size={12} />
    Edit
  </button>
);

const StockStatus: React.FC<StockStatusProps> = ({
  stockValue,
  // daysOfStock,
  stock,
  blockedQty,
  pickedQty,
  dealId,
  sellerDealObjId,
  // totalStock,
  productName,
  callback,
  hideAddStock = false,
  caseQty,
  innerCaseQty,
  sellingType,
  isReserve,
  packageQty,
  selectedStockUom,
  hideUnitConfigEdit = false,
}) => {
  const { t } = useTranslation(["common"]);

  const [_, setSearchParams] = useSearchParams();

  const [blockedQtyModal, setBlockedQtyModal] = useState({
    show: false,
    data: null,
  });

  const [pickingLogModal, setPickingLogModal] = useState({
    show: false,
  });

  const [unitConfigModal, setUnitConfigModal] = useState({
    show: false,
  });

  const stockUnits = stock !== undefined ? stock : 0;
  const blockedUnits = blockedQty !== undefined ? blockedQty : 0;
  const pickedUnits = pickedQty !== undefined ? pickedQty : 0;
  const isOutOfStock = Number(stockUnits) === 0;

  const handleAddStock = () => {
    callback?.({
      action: "add-stock",
      data: { dealId, productName },
    });
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

  return (
    <>
      <AppCard
        icon="trending-up"
        title={
          <div className="tw:flex tw:justify-between tw:items-center tw:w-full tw:flex-wrap tw:gap-2">
            <span className="tw:font-semibold tw:flex-1">
              {t("stockStatus")}
            </span>
            {!hideAddStock && (
              <Rbac roles={rbacRoles.addStock}>
                <AppButton
                  size="small"
                  color="dark"
                  onClick={handleAddStock}
                  className="tw:text-xs"
                >
                  <Plus className="tw:w-3 tw:h-3" />
                  {t("addStoreStock")}
                </AppButton>
              </Rbac>
            )}
          </div>
        }
      >
        <div className="tw:flex tw:flex-col tw:gap-3">
          <ReserveConfig
            dealId={dealId}
            sellerDealObjId={sellerDealObjId}
            isReserve={!!isReserve}
          />

          {/* Headline stock figures. */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-2">
            <Tile
              label={t("availableStock")}
              badge={
                <AppBadge variant={isOutOfStock ? "danger" : "success"}>
                  {isOutOfStock ? t("outOfStock") : t("inStock")}
                </AppBadge>
              }
              value={
                <DisplayQty
                  qty={Number(stockUnits) || 0}
                  isLooseQty={false}
                  uom={selectedStockUom}
                />
              }
              // footer={
              //   <>
              //     {t("totalStock")}{" "}
              //     <DisplayQty
              //       qty={Number(totalStock) || 0}
              //       isLooseQty={false}
              //       uom={selectedStockUom}
              //     />
              //   </>
              // }
            />

            <Tile
              label={t("stockValue")}
              value={<Amount value={stockValue || 0} decimalPlaces={2} />}
              // footer={
              //   <>
              //     {daysOfStock || 0} · {t("daysOfStock")}
              //   </>
              // }
            />
          </div>

          {/* Quantities held back from sale — each opens its own log. */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-2">
            <Tile
              label={t("blockedQty")}
              badge={<Info size={13} className="tw:text-slate-400" />}
              onClick={() => setBlockedQtyModal({ show: true, data: null })}
              valueClassName="tw:text-red-500"
              value={
                <DisplayQty
                  qty={Number(blockedUnits) || 0}
                  isLooseQty={false}
                  uom={selectedStockUom}
                />
              }
            />

            <Tile
              label={t("pickedQty")}
              badge={<Info size={13} className="tw:text-slate-400" />}
              onClick={() => setPickingLogModal({ show: true })}
              valueClassName="tw:text-yellow-600"
              value={
                <DisplayQty
                  qty={Number(pickedUnits) || 0}
                  isLooseQty={false}
                  uom={selectedStockUom}
                />
              }
            />
          </div>

          {/* How the item is sold — badge plus the unit-config shortcuts. */}
          <div className="tw:flex tw:flex-col tw:gap-2 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-3 tw:py-2">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
              <span className="tw:text-xs tw:text-slate-500">
                {t("sellingType")}
              </span>
              <div className="tw:flex tw:items-center tw:gap-2">
                <AppBadge variant="primary">
                  <SellingTypeDisplay sellingType={sellingType} />
                </AppBadge>
                {!hideUnitConfigEdit && (
                  <EditLink
                    onClick={() => setUnitConfigModal({ show: true })}
                  />
                )}
              </div>
            </div>

            {sellingType && sellingType !== "UNIT" && (
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-t tw:border-slate-100 tw:pt-2">
                <span className="tw:text-xs tw:text-slate-500">
                  <SellingTypeDisplay sellingType={sellingType} /> Qty
                </span>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <span className="tw:text-sm tw:font-semibold tw:text-slate-900">
                    {packageQty}
                  </span>
                  {!hideUnitConfigEdit && (
                    <EditLink
                      onClick={() => setUnitConfigModal({ show: true })}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </AppCard>

      <BlockedQtyListModal
        show={blockedQtyModal.show}
        dealId={dealId}
        callback={() => setBlockedQtyModal({ show: false, data: null })}
      />

      <PickingLogModal
        show={pickingLogModal.show}
        callback={() => setPickingLogModal({ show: false })}
        dealId={dealId}
        productName={productName}
      />

      <UnitConfigurationModal
        show={unitConfigModal.show}
        callback={handleUnitConifgModalCb}
        dealId={dealId}
      />
    </>
  );
};

export default StockStatus;
