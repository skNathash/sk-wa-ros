import { Box, ChevronRight } from "lucide-react";
import React from "react";
import { Link } from "react-router";
import Amount from "~/components/core/amount/Amount";
import { AppCheckbox } from "~/components/core/form/AppCheckbox";
import ImgRender from "~/components/core/img/ImgRender";
import { AppTable, TableHeader } from "~/components/core/table";
import type { TableHeaderItem } from "~/types/CommonTypes";
import type { SellingAroundYouDeal } from "./helper";

interface Props {
  items: SellingAroundYouDeal[];
  selectedIds: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onProductTap: (id: string) => void;
  radiusKm: number;
  seeAllTo?: string;
}

// Widths are declared once here so header labels stay aligned with their cells.
const HEADERS: TableHeaderItem[] = [
  { label: "Product", width: "37%" },
  { label: "Brand · category", width: "20%" },
  { label: "MRP", width: "12%", isRightAligned: true },
  { label: "Best price", width: "12%", isRightAligned: true },
  { label: "Retailers subscribed", width: "19%", isCentered: true },
];

const SellingAroundYouDesktop: React.FC<Props> = ({
  items,
  selectedIds,
  onSelect,
  onProductTap,
  radiusKm,
  seeAllTo,
}) => {
  return (
    <div>
      <div className="tw:overflow-x-auto">
        <AppTable fixedLayout minWidth="760px" className="tw:text-sm">
          <AppTable.Header>
            <TableHeader headers={HEADERS} />
          </AppTable.Header>

          <AppTable.Body>
            {items.map((item) => {
              const isSelected = selectedIds.has(item._id);

              return (
                <AppTable.Row
                  key={item._id}
                  className={isSelected ? "tw:bg-emerald-50/40" : ""}
                >
                  <AppTable.Cell className="tw:align-top">
                    <div className="tw:flex tw:items-start tw:gap-3">
                      <div className="tw:pt-0.5">
                        <AppCheckbox
                          size="xs"
                          value={isSelected}
                          onChange={(checked) =>
                            onSelect(item._id, checked)
                          }
                          label=""
                        />
                      </div>

                      <div className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-slate-50">
                        {item.images.length > 0 ? (
                          <ImgRender
                            assetId={item.images[0]}
                            alt={item.name}
                            className="tw:h-9 tw:w-9 tw:object-contain"
                          />
                        ) : (
                          <Box size={16} className="tw:text-slate-300" />
                        )}
                      </div>

                      <div className="tw:min-w-0">
                        <button
                          type="button"
                          onClick={() => onProductTap(item._id)}
                          className="tw:block tw:w-full tw:truncate tw:text-left tw:text-sm tw:font-semibold tw:text-slate-800 tw:transition-colors tw:hover:text-primary"
                          title={item.name}
                        >
                          {item.name}
                        </button>
                        <p className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-slate-400">
                          {item.dealRefId}
                          {item.hsn ? ` · HSN ${item.hsn}` : ""}
                        </p>
                      </div>
                    </div>
                  </AppTable.Cell>

                  <AppTable.Cell className="tw:align-top">
                    <div className="tw:truncate tw:text-sm tw:font-medium tw:text-slate-700">
                      {item.brandName || "—"}
                    </div>
                    <div className="tw:truncate tw:text-xs tw:text-slate-400">
                      {item.categoryName || "—"}
                    </div>
                  </AppTable.Cell>

                  <AppTable.Cell className="tw:text-right tw:align-top">
                    <Amount
                      value={item.mrp}
                      className="tw:text-sm tw:font-semibold tw:text-slate-800"
                    />
                    <div className="tw:text-[10px] tw:text-slate-400">
                      GST {item.tax}%
                    </div>
                  </AppTable.Cell>

                  <AppTable.Cell className="tw:text-right tw:align-top">
                    {item.bestPrice === null ? (
                      <span className="tw:text-sm tw:text-slate-300">—</span>
                    ) : (
                      <>
                        <Amount
                          value={item.bestPrice}
                          className="tw:text-sm tw:font-bold tw:text-emerald-700"
                        />
                        {item.offMrpPercent === null ? null : (
                          <div className="tw:mt-0.5">
                            <span className="tw:rounded-full tw:bg-emerald-50 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:text-emerald-700">
                              {item.offMrpPercent}% off MRP
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </AppTable.Cell>

                  <AppTable.Cell className="tw:text-center tw:align-top">
                    <span className="tw:inline-flex tw:min-w-8 tw:justify-center tw:rounded-md tw:bg-slate-100 tw:px-1.5 tw:py-0.5 tw:text-xs tw:font-semibold tw:text-slate-600">
                      {item.sellersCount}
                    </span>
                    <div className="tw:mt-0.5 tw:text-[10px] tw:text-slate-400">
                      within {radiusKm}km
                    </div>
                  </AppTable.Cell>
                </AppTable.Row>
              );
            })}
          </AppTable.Body>
        </AppTable>
      </div>

      {seeAllTo ? (
        <div className="tw:border-t tw:border-slate-100 tw:bg-slate-50/60 tw:px-4 tw:py-2">
          <Link
            to={seeAllTo}
            className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-xs tw:font-semibold tw:text-primary tw:transition-colors tw:hover:text-primary-dark"
          >
            See all
            <ChevronRight size={14} />
          </Link>
        </div>
      ) : null}
    </div>
  );
};

export default SellingAroundYouDesktop;
