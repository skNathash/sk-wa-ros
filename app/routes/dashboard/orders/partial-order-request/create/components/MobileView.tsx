import React from "react";
import { AppCheckbox } from "~/components/core/form";
import { AppInput } from "~/components/core/form/AppInput";
import AppBadge from "~/components/core/badge/AppBadge";
import { Hash, Box } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";

interface MobileViewProps {
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

const MobileView: React.FC<MobileViewProps> = ({
  fields,
  selected,
  onSelect,
  register,
  handleQtyChange,
}) => {
  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      {fields.map((it, index) => {
        const id = String(it.dealId || index);
        const maxQty = it.maxQuantity || 0;
        const isRowSelected = !!selected[id];

        return (
          <AppCard
            key={`${id}-${index}`}
            className={`tw:transition-all ${isRowSelected ? "tw:ring-1 tw:ring-indigo-500 tw:bg-indigo-50/30" : ""}`}
          >
            <div className="tw:flex tw:items-start tw:gap-4">
              <div className="tw:mt-1">
                <AppCheckbox
                  label=""
                  value={isRowSelected}
                  onChange={(checked: boolean) => onSelect(id, checked)}
                />
              </div>

              <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:space-y-2">
                      <h4 className="tw:text-base tw:font-bold tw:text-slate-900 tw:line-clamp-2 tw:leading-snug">
                        {it.dealName}
                      </h4>
                      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-4 tw:gap-y-2 tw:text-xs">
                        <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-slate-500 tw:font-medium">
                          <Hash size={12} className="tw:text-slate-400" /> 
                          {it.dealRefId}
                        </div>
                        <div className="tw:flex tw:items-center tw:gap-2 tw:bg-slate-100 tw:px-2.5 tw:py-1 tw:rounded-md tw:border tw:border-slate-200/50">
                          <span className="tw:text-[10px] tw:uppercase tw:text-slate-500 tw:font-black tw:tracking-wider">
                            Ordered:
                          </span>
                          <span className="tw:text-sm tw:font-black tw:text-indigo-700">
                            {maxQty}
                          </span>
                        </div>
                      </div>
                    </div>

                {isRowSelected && (
                  <div className="tw:mt-4 tw:pt-4 tw:border-t tw:border-dashed tw:border-slate-200 tw:animate-in tw:fade-in tw:slide-in-from-top-2">
                    <div className="tw:flex tw:items-end tw:gap-4">
                      <div className="tw:flex-1">
                        <AppInput
                          name={`items.${index}.quantity`}
                          label="New Order Qty"
                          type="number"
                          placeholder="0"
                          register={register}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleQtyChange(e, index, maxQty)
                          }
                          isRequired
                          size="sm"
                          className="tw:max-w-[120px]"
                          inputClassName="tw:font-bold tw:text-indigo-600"
                        />
                      </div>
                      <div className="tw:flex-1 tw:text-[10px] tw:text-slate-400 tw:mb-1.5">
                        Max: {maxQty}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AppCard>
        );
      })}
    </div>
  );
};

export default MobileView;
