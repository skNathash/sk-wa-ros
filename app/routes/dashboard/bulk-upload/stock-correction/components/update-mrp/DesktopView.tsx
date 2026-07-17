import React from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import AppBadge from "~/components/core/badge/AppBadge";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import Amount from "~/components/core/amount/Amount";
import type { TableHeaderItem } from "~/types/CommonTypes";
import { Trash2 } from "lucide-react";
import type { MrpFormValues } from "./UpdateMrp";

const headers: TableHeaderItem[] = [
  { label: "#", width: "5%", key: "slNo" },
  { label: "Name", width: "20%", key: "dealName" },
  { label: "Purchase Price", width: "12%", key: "purchasePrice" },
  { label: "Current MRP", width: "10%", key: "oldMrp" },
  { label: "New MRP", width: "15%", key: "mrp" },
  { label: "Status", width: "10%", key: "status" },
  { label: "Message", width: "22%", key: "validationMessage" },
  { label: "", width: "6%", key: "actions" },
];

const containerStyle = {
  maxHeight: "calc(100vh - 350px)",
};

const DesktopView: React.FC = () => {
  const { control, setValue, watch } = useFormContext<MrpFormValues>();
  const { fields, remove } = useFieldArray({ control, name: "records" });
  const watchedRecords = watch("records");

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
                <Amount value={field.purchasePrice} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount value={field.oldMrp} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell>
                {field.stockMasterId ? (
                  <Controller
                    name={`records.${index}.mrp`}
                    control={control}
                    render={({ field: mrpField }) => (
                      <input
                        type="number"
                        value={mrpField.value}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") { mrpField.onChange(""); return; }
                          const val = parseFloat(raw);
                          if (!isNaN(val) && val >= 0) {
                            mrpField.onChange(val);
                            if (val > 0 && field.purchasePrice > 0 && val < field.purchasePrice) {
                              setValue(`records.${index}.status`, "INVALID", { shouldDirty: true });
                              setValue(`records.${index}.validationMessage`, "New MRP should not be less than Purchase Price", { shouldDirty: true });
                            } else if (val > 0 && field.oldMrp > 0 && val === field.oldMrp) {
                              setValue(`records.${index}.status`, "INVALID", { shouldDirty: true });
                              setValue(`records.${index}.validationMessage`, "Old MRP and New MRP are same", { shouldDirty: true });
                            } else if (val > 0 && field.snapshotId && field.dealRefId) {
                              setValue(`records.${index}.status`, "VALID", { shouldDirty: true });
                              setValue(`records.${index}.validationMessage`, "", { shouldDirty: true });
                            }
                          }
                        }}
                        onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
                        placeholder="Enter new MRP"
                        className="tw:border tw:border-gray-300 tw:rounded tw:px-2 tw:py-1 tw:text-sm tw:w-full"
                        min={field.purchasePrice > 0 ? field.purchasePrice : 0}
                        step="1"
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
