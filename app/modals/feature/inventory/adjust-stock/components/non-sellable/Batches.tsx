import { useFormContext } from "react-hook-form";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import { AppInput } from "~/components/core/form/AppInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import { useTranslation } from "react-i18next";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface BatchesProps {
  masterData: any[];
  selectedStockUom?: string;
}

const Batches = ({ masterData, selectedStockUom }: BatchesProps) => {
  const { t } = useTranslation(["common"]);
  const { register, setValue } = useFormContext();
  const scrollClass =
    masterData && masterData.length === 1 ? "tw:max-h-[280px]" : "tw:h-[280px]";

  // Handler to restrict adjustment to not exceed current stock
  const handleAdjustmentChange =
    (index: number, max: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      // Allow empty string for clearing
      if (value === "") {
        setValue(`batches.${index}.adjustment`, "");
        return;
      }
      let num = Number(value);
      if (isNaN(num)) num = 0;
      if (num > max) num = max;
      if (num < 0) num = 0;
      setValue(`batches.${index}.adjustment`, num);
    };

  return (
    <div>
      <div className="tw:text-xs tw:font-medium tw:mb-1">
        {t("batchLevelAdjustments")}
      </div>
      <div className="tw:my-4">
        {!masterData || masterData.length === 0 ? (
          <div className="tw-text-center tw-text-gray-400 tw-py-8">
            {t("noBatchDataFound")}
          </div>
        ) : (
          <AppScrollArea className={scrollClass}>
            {masterData.map((batch: any, index: number) => (
              <div key={batch._id || index}>
                <div className="tw:flex tw:items-center tw:gap-2 tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:justify-between tw:mb-2">
                  <div className="tw:flex-1">
                    <div className="tw:text-sm tw:font-medium tw:mb-2">
                      {t("snapshotId")}: {batch.stockMasterId || batch.batch}
                    </div>

                    <div className="tw:flex tw:flex-col tw:gap-2">
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <span className="tw:text-xs tw:font-medium tw:text-slate-500">
                          {t("currentStock")}:
                        </span>
                        <span className="tw:text-xs">
                          <DisplayQty
                            qty={batch.quantity || batch.stock}
                            isLooseQty={false}
                            uom={selectedStockUom || batch.uom}
                          />
                        </span>
                      </div>

                      <div className="tw:flex tw:items-center tw:gap-2">
                        <span className="tw:text-xs tw:font-medium tw:text-slate-500">
                          {t("mrp")}:
                        </span>
                        <span className="tw:text-xs">
                          {batch.mrp ? <Amount value={batch.mrp} /> : "--"}
                        </span>
                      </div>

                      <div className="tw:flex tw:items-center tw:gap-2">
                        <span className="tw:text-xs tw:font-medium tw:text-slate-500">
                          {t("manufactureDate")}:
                        </span>
                        <span className="tw:text-xs">
                          {batch.manufactureDate ? (
                            <DateFormat
                              value={new Date(batch.manufactureDate)}
                              formatStr="dd MMM yyyy"
                            />
                          ) : (
                            "--"
                          )}
                        </span>
                      </div>

                      <div className="tw:flex tw:items-start tw:gap-2">
                        <span className="tw:text-xs tw:font-medium tw:text-slate-500">
                          {t("expiryDate")}:
                        </span>
                        <div className="tw:text-xs">
                          {batch.expiry || batch.expDate ? (
                            <div className="tw:flex tw:items-start tw:gap-1 tw:flex-wrap">
                              <DateFormat
                                value={
                                  batch.expiry
                                    ? new Date(batch.expiry)
                                    : batch.expDate
                                    ? new Date(batch.expDate)
                                    : null
                                }
                                formatStr="dd MMM yyyy"
                                className="tw:text-red-600 tw:mr-1"
                              />
                              {typeof batch.daysLeft === "number" && (
                                <AppBadge variant="danger">
                                  {t("leftDaysCount", {
                                    days: batch.daysLeft,
                                  })}
                                </AppBadge>
                              )}
                            </div>
                          ) : (
                            "--"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="tw:text-sm tw:flex tw:flex-col tw:items-center tw:gap-2">
                    <AppInput
                      label={t("adjustment")}
                      isRequired={true}
                      name={`batches.${index}.adjustment`}
                      type="number"
                      register={register}
                      className="tw:w-24"
                      inputClassName="tw:w-24"
                      size="sm"
                      onChange={handleAdjustmentChange(
                        index,
                        batch.quantity || batch.stock || 0
                      )}
                    />
                    {selectedStockUom && (
                      <div className="tw:text-[11px] tw:font-medium tw:text-blue-600 tw:bg-blue-50 tw:px-2 tw:py-0.5 tw:rounded">
                        Enter in {selectedStockUom}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </AppScrollArea>
        )}
      </div>
    </div>
  );
};

export default Batches;
