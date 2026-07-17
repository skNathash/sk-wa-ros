import React from "react";
import { useFormContext, useFieldArray, useWatch, Controller } from "react-hook-form";
import AppBadge from "~/components/core/badge/AppBadge";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import Amount from "~/components/core/amount/Amount";
import AppDateInput from "~/components/core/form/AppDateInput";
import type { TableHeaderItem } from "~/types/CommonTypes";
import { Trash2 } from "lucide-react";
import type { MfgExpFormValues } from "./UpdateMfgExp";
import { mfgDateConfig, expiryDateConfig } from "./helper";

const headers: TableHeaderItem[] = [
  { label: "#", width: "5%", key: "slNo" },
  { label: "Name", width: "25%", key: "dealName" },
  { label: "MRP", width: "8%", key: "mrp" },
  { label: "Stock", width: "8%", key: "quantity" },
  { label: "MFG Date", width: "14%", key: "manufactureDate" },
  { label: "Expiry Date", width: "14%", key: "expiry" },
  { label: "Status", width: "8%", key: "status" },
  { label: "Message", width: "20%", key: "validationMessage" },
  { label: "", width: "6%", key: "actions" },
];

const containerStyle = {
  maxHeight: "calc(100vh - 350px)",
};

const DesktopView: React.FC = () => {
  const { control, setValue, getValues } = useFormContext<MfgExpFormValues>();
  const { fields, remove } = useFieldArray({ control, name: "records" });
  const watchedRecords = useWatch({ control, name: "records" });

  const getStatus = (index: number) =>
    watchedRecords?.[index]?.status || fields[index]?.status;

  const getMessage = (index: number) =>
    watchedRecords?.[index]?.validationMessage ?? fields[index]?.validationMessage;

  return (
    <div className="tw:w-full tw:mt-2">
      <AppTable
        size="sm"
        fixedLayout
        container
        containerStyle={containerStyle}
        stickyHeader
        bordered
        hover
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {fields.map((field, index) => (
            <AppTable.Row key={field.id}>
              <AppTable.Cell>{field.slNo}</AppTable.Cell>
              <AppTable.Cell>
                <span className="tw:font-medium">
                  {field.dealName || "-"}
                </span>
                <div className="tw:text-xs tw:text-gray-500">
                  {field.dealRefId || "-"}
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount value={field.mrp} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell>{field.quantity}</AppTable.Cell>
              <AppTable.Cell>
                {field.stockMasterId ? (
                  <Controller
                    name={`records.${index}.manufactureDate`}
                    control={control}
                    render={({ field: dateField }) => (
                      <AppDateInput
                        value={dateField.value}
                        callback={(val: string) => {
                          dateField.onChange(val);
                          const expiry = getValues(`records.${index}.expiry`);
                          if (val && expiry && field.snapshotId && field.dealRefId) {
                            setValue(`records.${index}.status`, "VALID", { shouldDirty: true });
                            setValue(`records.${index}.validationMessage`, "", { shouldDirty: true });
                          }
                        }}
                        placeholder="Select date"
                        isRequired
                        dateConfig={mfgDateConfig}
                      />
                    )}
                  />
                ) : (
                  <span className="tw:text-xs tw:text-gray-400">-</span>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                {field.stockMasterId ? (
                  <Controller
                    name={`records.${index}.expiry`}
                    control={control}
                    render={({ field: dateField }) => (
                      <AppDateInput
                        value={dateField.value}
                        callback={(val: string) => {
                          dateField.onChange(val);
                          const mfgDate = getValues(`records.${index}.manufactureDate`);
                          if (val && mfgDate && field.snapshotId && field.dealRefId) {
                            setValue(`records.${index}.status`, "VALID", { shouldDirty: true });
                            setValue(`records.${index}.validationMessage`, "", { shouldDirty: true });
                          }
                        }}
                        placeholder="Select date"
                        isRequired
                        dateConfig={expiryDateConfig}
                      />
                    )}
                  />
                ) : (
                  <span className="tw:text-xs tw:text-gray-400">-</span>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge
                  variant={
                    getStatus(index) === "VALID" || getStatus(index) === "Success"
                      ? "success"
                      : "danger"
                  }
                >
                  {getStatus(index)}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                {(getStatus(index) === "VALID" || getStatus(index) === "Success") && field.remarks && (
                  <span className="tw:text-xs tw:text-gray-700">
                    {field.remarks}
                  </span>
                )}
                {getStatus(index) !== "VALID" && getStatus(index) !== "Success" && getMessage(index) && (
                  <span className="tw:text-xs tw:text-red-600 tw:block">
                    {getMessage(index)}
                  </span>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="tw:text-red-500 hover:tw:text-red-700 tw:p-1"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </AppTable.Cell>
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>
    </div>
  );
};

export default DesktopView;
