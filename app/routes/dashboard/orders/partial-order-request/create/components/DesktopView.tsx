import React from "react";
import AppTable from "~/components/core/table/AppTable";
import { AppCheckbox } from "~/components/core/form";
import { AppInput } from "~/components/core/form/AppInput";
import AppBadge from "~/components/core/badge/AppBadge";
import { Hash } from "lucide-react";

interface DesktopViewProps {
  fields: any[];
  selected: Record<string, boolean>;
  onSelect: (id: string, checked: boolean) => void;
  register: any;
  handleQtyChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    maxQty: number,
  ) => void;
}

const DesktopView: React.FC<DesktopViewProps> = ({
  fields,
  selected,
  onSelect,
  register,
  handleQtyChange,
}) => {
  return (
    <AppTable bordered hover minWidth="800px">
      <AppTable.Header>
        <AppTable.Row noHover>
          <AppTable.Cell className="tw:w-12">{null}</AppTable.Cell>
          <AppTable.Cell>Item Details</AppTable.Cell>
          <AppTable.Cell className="tw:text-right tw:w-32">
            Ordered Qty
          </AppTable.Cell>
          <AppTable.Cell className="tw:w-48">New Order Qty</AppTable.Cell>
        </AppTable.Row>
      </AppTable.Header>
      <AppTable.Body>
        {fields.map((it, index) => {
          const id = String(it.dealId || index);
          const isRowSelected = !!selected[id];
          const maxQty = it.maxQuantity || 0;

          return (
            <AppTable.Row
              key={`${id}-${index}`}
              className={isRowSelected ? "tw:bg-indigo-50/30" : ""}
            >
              <AppTable.Cell>
                <AppCheckbox
                  label=""
                  value={isRowSelected}
                  onChange={(checked: boolean) => onSelect(id, checked)}
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:space-y-1">
                  <div className="tw:font-semibold tw:text-slate-900">
                    {it.dealName}
                  </div>
                  <div className="tw:flex tw:items-center tw:gap-3 tw:text-[11px]">
                    <div className="tw:flex tw:items-center tw:gap-1 tw:text-slate-500">
                      <Hash size={10} /> {it.dealRefId}
                    </div>
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-right">
                <span className="tw:font-bold tw:text-slate-900">{maxQty}</span>
              </AppTable.Cell>
              <AppTable.Cell>
                {isRowSelected ? (
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <AppInput
                      name={`items.${index}.quantity`}
                      type="number"
                      register={register}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleQtyChange(e, index, maxQty)
                      }
                      isRequired
                      size="sm"
                      inputClassName="tw:font-bold tw:text-indigo-600 tw:h-8 tw:bg-white"
                      className="tw:w-24"
                    />
                    <span className="tw:text-[10px] tw:text-slate-400">
                      Max: {maxQty}
                    </span>
                  </div>
                ) : (
                  <span className="tw:text-slate-300 tw:text-xs italic">
                    Select to edit
                  </span>
                )}
              </AppTable.Cell>
            </AppTable.Row>
          );
        })}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
