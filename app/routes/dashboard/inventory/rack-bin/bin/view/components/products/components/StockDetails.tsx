import React, { useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import { Boxes, Barcode, ChevronDown, ChevronUp } from "lucide-react";
import EditSnapshotModal from "~/shared/catalog/modals/sanpshots/EditSnapshotModal";
import CreateBatchModal from "~/modals/feature/inventory/create-batch/CreateBatchModal";
import AddBarcodeModal from "../modals/AddBarcodeModal";
import { AppSelect } from "~/components/core/form";
import Rbac from "~/components/core/rbac/Rbac";
import { useTranslation } from "react-i18next";
import AuthService from "~/services/AuthService";
import useAppToast from "~/hooks/useAppToast";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

const MAX_BATCHES_TO_SHOW = 6;

interface StockBatch {
  _id: string;
  productId: string;
  intakeDate: string;
  expiry: string;
  manufactureDate: string;
  inventoryType: string;
  dealId: string;
  quantity: number;
  uom: string;
  purchasePrice: number;
  mrp: number;
  remarks: string;
  barcode: string;
  stockMasterId?: string;
  batchId?: string; // Optional, used for display purposes
}

interface StockDetailsProps {
  data: StockBatch[];
  productName: string;
  binId?: string;
  dealId?: string;
  dealRefId?: string;
  selectedStockUom?: string;
  callback?: (args: { action: string; data?: any; index?: number }) => void;
}

const qtyOptions = [
  {
    value: "all",
    label: "All",
    langKey: "all",
  },
  {
    value: "with-stock",
    label: "With Stock",
    langKey: "withStock",
  },
  {
    value: "without-stock",
    label: "Without Stock",
    langKey: "withoutStock",
  },
];

const defaultQty = "with-stock";

const rbacRoles = {
  editSnapshot: ["INVENTORY.EDIT-SNAPSHOT"],
};

const StockDetails = ({
  data,
  productName,
  binId,
  dealId,
  dealRefId,
  selectedStockUom,
  callback,
}: StockDetailsProps) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();
  const [filteredData, setFilteredData] = useState<StockBatch[]>([]);
  const [selectedQty, setSelectedQty] = useState<string>(defaultQty);
  const [showAllBatches, setShowAllBatches] = useState(false);

  const [editModal, setEditModal] = useState<{
    show: boolean;
    data?: {
      productName: string;
      batchId: string;
      _id: string;
      manufactureDate?: Date;
      expiryDate?: Date;
      remarks?: string;
      barcode?: string;
      masterId?: string;
    } | null;
    batchIndex?: number;
  }>({ show: false, data: null, batchIndex: undefined });

  const [createBatchModal, setCreateBatchModal] = useState<{
    show: boolean;
    data?: {
      productName: string;
      batchId: string;
      _id: string;
      stockMasterId?: string;
      quantity: number;
      uom: string;
      purchasePrice: number;
      mrp: number;
      barcode: string;
      manufactureDate?: Date;
      expiryDate?: Date;
      remarks?: string;
    } | null;
    batchIndex?: number;
  }>({ show: false, data: null, batchIndex: undefined });

  const [barcodeModal, setBarcodeModal] = useState<{
    show: boolean;
    data?: {
      masterId: string;
      productName: string;
      _id: string;
      dealId?: string;
      uom?: string;
    } | null;
  }>({ show: false, data: null });

  const [expandedBatches, setExpandedBatches] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    onQtyChange(defaultQty);
  }, [data]);

  const toggleExpanded = (id: string) => {
    setExpandedBatches((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditBatch = (batch: StockBatch, index: number) => {
    setEditModal({
      show: true,
      data: {
        productName,
        batchId: batch.batchId || batch.productId, // for display
        _id: batch._id, // for API
        manufactureDate: batch.manufactureDate
          ? new Date(batch.manufactureDate)
          : undefined,
        expiryDate: batch.expiry ? new Date(batch.expiry) : undefined,
        remarks: batch.remarks,
        barcode: batch.barcode, // Add barcode to the data
        masterId: batch.stockMasterId,
      },
      batchIndex: index,
    });
  };

  const handleModalCallback = (args: { action: string; data?: any }) => {
    if (args.action === "close") {
      setEditModal({ show: false, data: null, batchIndex: undefined });
    } else if (args.action === "save") {
      // Call the callback with the updated batch data and index
      if (callback && editModal.batchIndex !== undefined) {
        callback({
          action: "batch-updated",
          data: {
            ...args.data,
            originalBatch: data[editModal.batchIndex],
            updatedBatch: args.data,
          },
          index: editModal.batchIndex,
        });
      }
      setEditModal({ show: false, data: null, batchIndex: undefined });
    }
  };

  const handleCreateBatchCallback = (args: { action: string; data?: any }) => {
    if (args.action === "close") {
      setCreateBatchModal({ show: false, data: null, batchIndex: undefined });
    } else if (args.action === "save") {
      // Call the callback with the new batch data
      if (callback && createBatchModal.batchIndex !== undefined) {
        callback({
          action: "batch-created",
          data: {
            ...args.data,
            originalBatch: data[createBatchModal.batchIndex],
            newBatch: args.data,
          },
          index: createBatchModal.batchIndex,
        });
      }
      setCreateBatchModal({ show: false, data: null, batchIndex: undefined });
    }
  };

  const handleAddBarcode = (batch: StockBatch) => {
    if (AuthService.isMasterLogin()) {
      appToast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }
    setBarcodeModal({
      show: true,
      data: {
        masterId: batch.stockMasterId || batch._id,
        productName,
        _id: batch._id,
        dealId: batch.dealId || dealId,
        uom: batch.uom,
      },
    });
  };

  const handleBarcodeModalCallback = (args: { action: string; data?: any }) => {
    if (args.action === "close") {
      setBarcodeModal({ show: false, data: null });
    } else if (args.action === "submit") {
      // Call the callback with the barcode data
      if (callback) {
        callback({
          action: "barcode-added",
          data: args.data,
        });
      }
      setBarcodeModal({ show: false, data: null });
    }
  };

  const onQtyChange = (value: string) => {
    setSelectedQty(value);
    if (value === "all") {
      setFilteredData([...data]);
    } else if (value === "with-stock") {
      setFilteredData([...data.filter((batch) => batch.quantity > 0)]);
    } else if (value === "without-stock") {
      setFilteredData(data.filter((batch) => batch.quantity === 0));
    } else {
      setFilteredData([...data]);
    }
  };

  return (
    <>
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
        <Boxes className="tw:w-4 tw:h-4 tw:text-gray-500" />
        <div className="tw:text-sm tw:font-medium tw:text-gray-800 tw:flex tw:items-center tw:gap-2 tw:justify-between tw:flex-1">
          <div className="tw:flex-1">{t("stockDetails")}</div>
          <AppSelect
            options={qtyOptions}
            value={selectedQty}
            onChange={onQtyChange}
            size="sm"
          />
        </div>
      </div>
      <div className="tw:text-xs tw:text-gray-700">
        {/* Header */}

        {!filteredData || filteredData.length === 0 ? (
          <div className="tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-xl tw:p-3 tw:text-gray-500">
            {t("noStockBatchesFound")}
          </div>
        ) : (
          <>
            <div className="tw:text-gray-500 tw:mb-2">
              {t("receivedStock")} ({filteredData.length})
            </div>
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
              {filteredData.map((batch, idx) => {
                const idKey = batch._id || String(idx);
                const isExpanded = !!expandedBatches[idKey];

                if (idx >= MAX_BATCHES_TO_SHOW && !showAllBatches) {
                  return null;
                }

                return (
                  <div
                    key={batch._id || idx}
                    className="tw:bg-white tw:rounded-xl tw:p-3 tw:border tw:border-gray-200"
                  >
                    {/* Badge row: quantity + inventory type on the left, the
                        batch barcode (or the shortcut to add one) on the right. */}
                    <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2 tw:flex-wrap">
                      <span className="tw:bg-emerald-50 tw:text-emerald-700 tw:font-semibold tw:px-2 tw:py-0.5 tw:rounded-md">
                        <DisplayQty
                          qty={batch.quantity}
                          isLooseQty={false}
                          uom={selectedStockUom || batch.uom}
                        />
                      </span>
                      {batch.inventoryType && (
                        <span className="tw:bg-indigo-50 tw:text-indigo-600 tw:px-2 tw:py-0.5 tw:rounded-md tw:text-[10px] tw:uppercase tw:tracking-wide">
                          {batch.inventoryType}
                        </span>
                      )}
                      <div className="tw:ml-auto">
                        {batch.barcode ? (
                          <span className="tw:bg-gray-100 tw:text-gray-800 tw:font-mono tw:px-2 tw:py-0.5 tw:rounded-md tw:text-xs">
                            {batch.barcode}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="tw:text-emerald-700 tw:text-xs tw:font-medium tw:flex tw:items-center tw:gap-1 tw:cursor-pointer hover:tw:underline focus:tw:outline-none"
                            onClick={() => handleAddBarcode(batch)}
                          >
                            <Barcode className="tw:w-3 tw:h-3" />+{" "}
                            {t("addBarcode")}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Label-over-value columns — reads faster than stacked
                        label/value rows at this density. */}
                    <div className="tw:grid tw:grid-cols-3 tw:gap-2">
                      <div>
                        <div className="tw:text-[10px] tw:text-gray-500">
                          {t("snapshotId")}
                        </div>
                        <div className="tw:font-semibold tw:truncate">
                          {batch.stockMasterId || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="tw:text-[10px] tw:text-gray-500">
                          {t("mrp")}
                        </div>
                        <div className="tw:font-semibold">
                          <Amount value={batch.mrp} decimalPlaces={2} />
                        </div>
                      </div>
                      <div>
                        <div className="tw:text-[10px] tw:text-gray-500">
                          {t("expiry")}
                        </div>
                        <div className="tw:font-semibold">
                          {batch.expiry ? (
                            <DateFormat
                              value={batch.expiry}
                              formatStr="dd MMM yyyy"
                            />
                          ) : (
                            "-"
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Collapsible area - hidden by default */}
                    {isExpanded && (
                      <div id={`stock-details-${idKey}`} className="tw:mt-2">
                        <div className="tw:grid tw:grid-cols-3 tw:gap-2">
                          <div>
                            <div className="tw:text-[10px] tw:text-gray-500">
                              {t("manufacture")}
                            </div>
                            <div className="tw:font-semibold">
                              {batch.manufactureDate ? (
                                <DateFormat
                                  value={batch.manufactureDate}
                                  formatStr="dd MMM yyyy"
                                />
                              ) : (
                                "-"
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="tw:text-[10px] tw:text-gray-500">
                              {t("purchasePrice")}
                            </div>
                            <div className="tw:font-semibold">
                              <Amount
                                value={batch.purchasePrice}
                                decimalPlaces={2}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="tw:text-[10px] tw:text-gray-500">
                              {t("received")}
                            </div>
                            <div className="tw:font-semibold">
                              <DateFormat value={batch.intakeDate} />
                            </div>
                          </div>
                        </div>

                        <div className="tw:mt-2">
                          <div className="tw:text-[10px] tw:text-gray-500">
                            {t("notes")}
                          </div>
                          <div className="tw:text-gray-600">
                            {batch.remarks && batch.remarks.trim()
                              ? batch.remarks
                              : "No specific receiving notes provided."}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Combined row: view toggle left, actions right */}
                    <div className="tw:flex tw:justify-between tw:items-center tw:mt-2 tw:pt-2 tw:border-t tw:border-gray-100">
                      <div>
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-controls={`stock-details-${idKey}`}
                          className="tw:inline-flex tw:items-center tw:gap-2 tw:text-xs tw:text-blue-600 tw:font-medium hover:tw:underline focus:tw:outline-none"
                          onClick={() => toggleExpanded(idKey)}
                        >
                          {isExpanded ? t("viewLess") : t("viewMore")}
                          {isExpanded ? (
                            <ChevronUp className="tw:w-4 tw:h-4 tw:text-blue-600" />
                          ) : (
                            <ChevronDown className="tw:w-4 tw:h-4 tw:text-blue-600" />
                          )}
                        </button>
                      </div>

                      <div className="tw:flex tw:gap-2">
                        <Rbac roles={rbacRoles.editSnapshot}>
                          <button
                            type="button"
                            className="tw:border tw:border-gray-300 tw:text-gray-700 tw:px-3 tw:py-1 tw:rounded-lg tw:text-xs tw:font-medium hover:tw:bg-gray-50 focus:tw:outline-none tw:transition-colors tw:cursor-pointer"
                            onClick={() => handleEditBatch(batch, idx)}
                          >
                            {t("edit")}
                          </button>
                        </Rbac>
                        {/* Create Variation button removed here — now available only in ActionButtons */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!showAllBatches && filteredData.length > MAX_BATCHES_TO_SHOW && (
              <>
                <div className="tw:flex tw:justify-center tw:mt-2">
                  <button
                    type="button"
                    className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:text-blue-600 tw:font-medium hover:tw:underline focus:tw:outline-none"
                    onClick={() => setShowAllBatches(!showAllBatches)}
                  >
                    {showAllBatches ? t("viewLess") : t("viewMore")}
                    {showAllBatches ? (
                      <ChevronUp className="tw:w-4 tw:h-4" />
                    ) : (
                      <ChevronDown className="tw:w-4 tw:h-4" />
                    )}
                  </button>
                </div>
                <div className="tw:bg-gray-50 tw:rounded tw:p-3 tw:border tw:border-gray-200 tw:text-center">
                  <div className="tw:text-sm tw:text-gray-600">
                    +{filteredData.length - MAX_BATCHES_TO_SHOW}{" "}
                    {t("moreBatch")}
                    {filteredData.length - MAX_BATCHES_TO_SHOW > 1 ? "es" : ""}
                  </div>
                  <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                    {t("clickViewMoreToSeeAllBatches")}
                  </div>
                </div>
              </>
            )}
            {showAllBatches && filteredData.length > MAX_BATCHES_TO_SHOW && (
              <div className="tw:flex tw:justify-center tw:mt-2 tw:w-full">
                <button
                  type="button"
                  className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:text-blue-600 tw:font-medium hover:tw:underline focus:tw:outline-none"
                  onClick={() => setShowAllBatches(!showAllBatches)}
                >
                  {showAllBatches ? t("viewLess") : t("viewMore")}
                  {showAllBatches ? (
                    <ChevronUp className="tw:w-4 tw:h-4" />
                  ) : (
                    <ChevronDown className="tw:w-4 tw:h-4" />
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <EditSnapshotModal
        show={editModal.show}
        callback={handleModalCallback}
        data={editModal.data as any}
      />
      {createBatchModal.data && (
        <CreateBatchModal
          show={createBatchModal.show}
          callback={handleCreateBatchCallback}
          dealId={dealId}
          dealRefId={dealRefId}
          dealName={productName}
          binId={binId}
        />
      )}
      <AddBarcodeModal
        show={barcodeModal.show}
        callback={handleBarcodeModalCallback}
        masterId={barcodeModal.data?.masterId}
        _id={barcodeModal.data?._id}
        dealId={barcodeModal.data?.dealId}
        uom={barcodeModal.data?.uom}
      />
    </>
  );
};

export default StockDetails;
