import React from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import AppBadge from "~/components/core/badge/AppBadge";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import Amount from "~/components/core/amount/Amount";
import type { TableHeaderItem } from "~/types/CommonTypes";
import { Trash2 } from "lucide-react";
import type { BarcodeFormValues } from "./UpdateBarcode";

const headers: TableHeaderItem[] = [
  { label: "#", width: "5%", key: "slNo" },
  { label: "Name", width: "25%", key: "dealName" },
  { label: "MRP", width: "10%", key: "mrp" },
  { label: "Barcode", width: "20%", key: "barcode" },
  { label: "Status", width: "10%", key: "status" },
  { label: "Message", width: "24%", key: "validationMessage" },
  { label: "", width: "6%", key: "actions" },
];

const containerStyle = {
  maxHeight: "calc(100vh - 350px)",
};

const DesktopView: React.FC = () => {
  const { control, setValue, watch } = useFormContext<BarcodeFormValues>();
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
                <Amount value={field.mrp} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell>
                {field.stockMasterId ? (
                  <Controller
                    name={`records.${index}.barcode`}
                    control={control}
                    render={({ field: barcodeField }) => (
                      <input
                        type="text"
                        value={barcodeField.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          barcodeField.onChange(val);
                          if (val.trim() && field.stockMasterId) {
                            if (val.trim().length < 3) {
                              setValue(`records.${index}.status`, "Error", { shouldDirty: true });
                              setValue(`records.${index}.validationMessage`, "Barcode must have at least 3 characters", { shouldDirty: true });
                            } else {
                              setValue(`records.${index}.status`, "VALID", { shouldDirty: true });
                              setValue(`records.${index}.validationMessage`, "", { shouldDirty: true });
                            }
                          }
                        }}
                        placeholder="Enter barcode"
                        className="tw:border tw:border-gray-300 tw:rounded tw:px-2 tw:py-1 tw:text-sm tw:w-full"
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
