import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import { useTranslation } from "react-i18next";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface BatchesProps {
  batches: any[];
  loading?: boolean;
  onSelect: (batch: any) => void;
  selectedStockUom?: string;
}

const Batches = ({
  batches,
  loading,
  onSelect,
  selectedStockUom,
}: BatchesProps) => {
  const { t } = useTranslation(["common"]);
  return (
    <div className="tw:space-y-4">
      <div className="tw:text-xs tw:font-medium tw:mb-1">
        {t("selectSnapshotToEdit")}
      </div>
      <div className="tw:my-4">
        {loading ? (
          <div className="tw:text-center tw:py-4">{t("loading")}</div>
        ) : (
          <>
            {batches && batches.length > 0 ? (
              batches.map((batch: any, index: number) => (
                <div
                  key={batch._id || index}
                  className="tw:flex tw:items-center tw:gap-2 tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:justify-between tw:mb-2"
                >
                  <div className="tw:flex-1">
                    <div className="tw:text-sm tw:font-medium tw:mb-1">
                      {t("batch")}: {batch.stockMasterId || batch._id}
                    </div>
                    <KeyValue
                      label={t("currentStock")}
                      horizontal
                      size="xs"
                      className="tw:mb-1"
                      labelClassName="tw:w-28"
                      valueClassName="tw:font-medium tw:text-green-600"
                    >
                      <DisplayQty
                        qty={batch.quantity}
                        isLooseQty={false}
                        uom={selectedStockUom || batch.uom}
                      />
                    </KeyValue>
                    <KeyValue
                      label={t("mrp")}
                      horizontal
                      size="xs"
                      className="tw:mb-1"
                      labelClassName="tw:w-28"
                      valueClassName="tw:font-medium tw:text-indigo-600"
                    >
                      <Amount value={batch.mrp} decimalPlaces={2} />
                    </KeyValue>
                    <KeyValue
                      label={t("manufactureDate")}
                      horizontal
                      size="xs"
                      className="tw:mb-1"
                      labelClassName="tw:w-28"
                      valueClassName="tw:text-teal-600"
                    >
                      {batch.manufactureDate ? (
                        <DateFormat
                          value={
                            batch.manufactureDate
                              ? new Date(batch.manufactureDate)
                              : null
                          }
                          formatStr="dd MMM yyyy"
                        />
                      ) : (
                        "--"
                      )}
                    </KeyValue>
                    <KeyValue
                      label={t("expiryDate")}
                      horizontal
                      size="xs"
                      className="tw:mb-1"
                      labelClassName="tw:w-28"
                      valueClassName="tw:text-red-500"
                    >
                      {batch.expiry ? (
                        <DateFormat
                          value={batch.expiry ? new Date(batch.expiry) : null}
                          formatStr="dd MMM yyyy"
                        />
                      ) : (
                        "--"
                      )}
                    </KeyValue>
                  </div>
                  <div className="tw:flex tw:flex-col tw:items-end tw:gap-2">
                    <AppButton
                      color="light"
                      fill="outline"
                      onClick={() => onSelect(batch)}
                      size="small"
                    >
                      {t("edit")}
                    </AppButton>
                  </div>
                </div>
              ))
            ) : (
              <div className="tw:p-2 tw:rounded tw:bg-gray-50">
                {t("noBatchesFound")}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Batches;
