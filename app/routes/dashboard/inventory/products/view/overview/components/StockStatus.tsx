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
  daysOfStock: number | string;
  stock?: number | string;
  blockedQty?: number | string;
  pickedQty?: number | string;
  dealId: string;
  totalStock: number;
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

const StockStatus: React.FC<StockStatusProps> = ({
  stockValue,
  daysOfStock,
  stock,
  blockedQty,
  pickedQty,
  dealId,
  totalStock,
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
          <ReserveConfig dealId={dealId} isReserve={!!isReserve} />

          <div className="tw:flex tw:justify-between tw:items-center tw:gap-4">
            <div className="tw:text-gray-500 tw:text-sm">{t("stockLevel")}</div>
            <div className="tw:font-medium tw:text-sm">
              <AppBadge variant={isOutOfStock ? "danger" : "success"}>
                {isOutOfStock ? t("outOfStock") : t("inStock")}
              </AppBadge>
            </div>
          </div>

          <div className="tw:flex tw:justify-between tw:items-center tw:gap-4">
            <div className="tw:text-gray-500 tw:text-sm">{t("totalStock")}</div>
            <div className="tw:font-medium tw:text-sm tw:text-gray-700">
              <DisplayQty
                qty={Number(totalStock) || 0}
                isLooseQty={false}
                uom={selectedStockUom}
              />
            </div>
          </div>

          <div className="tw:flex tw:justify-between tw:items-center tw:gap-4">
            <div className="tw:text-gray-500 tw:text-sm">
              {t("sellingType")}
            </div>
            <div className="tw:font-medium tw:text-sm tw:flex tw:gap-2 tw:items-center">
              <AppBadge variant="primary">
                <SellingTypeDisplay sellingType={sellingType} />
              </AppBadge>
              {!hideUnitConfigEdit && (
                <button
                  onClick={() => setUnitConfigModal({ show: true })}
                  className="tw:cursor-pointer tw:text-primary tw:text-xs tw:underline tw:flex tw:items-center tw:gap-1"
                >
                  <Pencil size={12} />
                  Edit
                </button>
              )}
            </div>
          </div>

          {sellingType && sellingType !== "UNIT" && (
            <div className="tw:flex tw:justify-between tw:items-center tw:gap-4">
              <div className="tw:text-gray-500 tw:text-sm">
                <SellingTypeDisplay sellingType={sellingType} /> Qty
              </div>
              <div className="tw:font-medium tw:text-sm tw:flex tw:gap-2 tw:items-center">
                {packageQty}
                {!hideUnitConfigEdit && (
                  <button
                    onClick={() => setUnitConfigModal({ show: true })}
                    className="tw:cursor-pointer tw:text-primary tw:text-xs tw:underline tw:flex tw:items-center tw:gap-1"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="tw:flex tw:justify-between tw:items-center tw:gap-4">
            <div className="tw:text-gray-500 tw:text-sm">{t("blockedQty")}</div>
            <div
              className="tw:font-medium tw:text-sm tw:flex tw:gap-1 tw:hover:underline tw:cursor-pointer tw:text-gray-600"
              onClick={() => setBlockedQtyModal({ show: true, data: null })}
            >
              <div className="tw:text-red-500">
                <DisplayQty
                  qty={Number(blockedUnits) || 0}
                  isLooseQty={false}
                  uom={selectedStockUom}
                />
              </div>
              <button className="tw:text-slate-500 tw:text-xs tw:underline tw:flex tw:items-center tw:gap-1 tw:cursor-pointer">
                <Info size={14} />
              </button>
            </div>
          </div>

          <div className="tw:flex tw:justify-between tw:items-center tw:gap-4">
            <div className="tw:text-gray-500 tw:text-sm">{t("pickedQty")}</div>
            <div
              className="tw:font-medium tw:text-sm tw:flex tw:gap-1 tw:hover:underline tw:cursor-pointer"
              onClick={() => setPickingLogModal({ show: true })}
            >
              <div className="tw:text-yellow-600">
                <DisplayQty
                  qty={Number(pickedUnits) || 0}
                  isLooseQty={false}
                  uom={selectedStockUom}
                />
              </div>
              <button className="tw:text-slate-500 tw:text-xs tw:underline tw:flex tw:items-center tw:gap-1 tw:cursor-pointer">
                <Info size={14} />
              </button>
            </div>
          </div>

          <div className="tw:flex tw:justify-between tw:items-center tw:gap-4 tw:border-b tw:pb-2">
            <div className="tw:text-gray-500 tw:text-sm">
              {t("availableStock")}
            </div>
            <div className="tw:font-medium tw:text-sm tw:text-gray-700">
              <DisplayQty
                qty={Number(stockUnits) || 0}
                isLooseQty={false}
                uom={selectedStockUom}
              />
            </div>
          </div>

          <div className="tw:flex tw:justify-between tw:items-center tw:gap-4">
            <div className="tw:text-gray-500 tw:text-sm">{t("stockValue")}</div>
            <div className="tw:font-medium tw:text-sm">
              <Amount value={stockValue || 0} decimalPlaces={2} />
            </div>
          </div>

          <div className="tw:flex tw:justify-between tw:items-center tw:gap-4">
            <div className="tw:text-gray-500 tw:text-sm">
              {t("daysOfStock")}
            </div>
            <div className="tw:font-medium tw:text-sm">{daysOfStock || 0}</div>
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
