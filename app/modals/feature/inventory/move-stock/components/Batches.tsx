import { useFormContext } from "react-hook-form";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import { AppInput } from "~/components/core/form/AppInput";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import { useTranslation } from "react-i18next";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface BatchesProps {
  masterData: any[];
  selectedStockUom?: string;
}

const Batches = ({ masterData, selectedStockUom }: BatchesProps) => {
  const { t } = useTranslation(["common"]);
  const { register, setValue, getValues } = useFormContext();

  // Choose a scroll area class based on number of batches to mimic adjust-stock non-sellable behaviour
  const scrollClass =
    masterData && masterData.length === 1 ? "tw:max-h-[280px]" : "tw:h-[280px]";

  // Handler to restrict adjustment to not exceed current stock
  const handleAdjustmentChange = (index: number, max: number) => {
    let value = getValues(`batches.${index}.adjustment`);
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
        {t("selectQuantitiesToMove")}
      </div>
      <div className="tw:my-4">
        <AppScrollArea className={scrollClass}>
          {masterData &&
            masterData.length > 0 &&
            masterData.map((batch: any, index: number) => (
              <div key={batch._id || index}>
                <div className="tw:flex tw:items-center tw:gap-2 tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:justify-between tw:mb-2">
                  <div className="tw:flex-1">
                    <div className="tw:text-sm tw:font-medium tw:mb-2">
                      {t("batch")}: {batch.stockMasterId}
                    </div>

                    <div className="tw:flex tw:flex-col tw:gap-2">
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <span className="tw:text-xs tw:font-medium tw:text-slate-500">
                          {t("currentStock")}:
                        </span>
                        <span className="tw:text-xs">
                          <DisplayQty
                            qty={batch.quantity}
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
                        </span>
                      </div>

                      <div className="tw:flex tw:items-start tw:gap-2">
                        <span className="tw:text-xs tw:font-medium tw:text-slate-500">
                          {t("expiryDate")}:
                        </span>
                        <div className="tw:text-xs">
                          {batch.expiry ? (
                            <div className="tw:flex tw:items-start tw:gap-1 tw:flex-wrap">
                              <DateFormat
                                value={
                                  batch.expiry ? new Date(batch.expiry) : null
                                }
                                formatStr="dd MMM yyyy"
                                className="tw:text-red-600 tw:mr-1"
                              />
                              <AppBadge variant="danger">
                                {batch.daysLeft} days
                              </AppBadge>
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
                      name={`batches.${index}.adjustment`}
                      label={t("moveQuantity")}
                      type="number"
                      register={register}
                      className="tw:w-24"
                      inputClassName="tw:w-24"
                      isRequired={true}
                      size="sm"
                      onChange={() =>
                        handleAdjustmentChange(index, batch.quantity)
                      }
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
      </div>
    </div>
  );
};

export default Batches;
