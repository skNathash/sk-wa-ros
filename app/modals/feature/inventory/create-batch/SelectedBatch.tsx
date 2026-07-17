import React from "react";
import KeyValue from "~/components/core/key-value/KeyValue";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import { useTranslation } from "react-i18next";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface SelectedBatchProps {
  batch: any;
  selectedStockUom?: string;
}

const SelectedBatch: React.FC<SelectedBatchProps> = ({
  batch,
  selectedStockUom,
}) => {
  const { t } = useTranslation(["common"]);
  if (!batch) return null;

  return (
    <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-3 tw:bg-gray-50">
      <div className="tw:font-medium tw:mb-1">
        {t("selectedBatch")}: {batch.stockMasterId || batch._id}
      </div>
      <div className="tw:grid tw:grid-cols-2 tw:gap-2">
        <KeyValue label={t("barcode")} size="sm">
          {batch.barcode || "--"}
        </KeyValue>
        <KeyValue label={t("available")} size="sm">
          <DisplayQty
            qty={batch.quantity || 0}
            isLooseQty={false}
            uom={selectedStockUom || batch.uom}
          />
        </KeyValue>
        <KeyValue label={t("mrp")} size="sm">
          <Amount value={batch.mrp} decimalPlaces={2} />
        </KeyValue>
        <KeyValue label={t("manufactureDate")} size="sm">
          {batch.manufactureDate ? (
            <DateFormat
              value={new Date(batch.manufactureDate)}
              formatStr="dd MMM yyyy"
            />
          ) : (
            "--"
          )}
        </KeyValue>
      </div>
    </div>
  );
};

export default SelectedBatch;
