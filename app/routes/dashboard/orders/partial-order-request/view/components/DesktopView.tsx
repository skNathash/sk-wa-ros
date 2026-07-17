import React from "react";
import { AppTable, TableHeader } from "~/components/core/table";
import ImgRender from "~/components/core/img/ImgRender";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import type { TableHeaderItem } from "~/types/CommonTypes";

interface DesktopViewProps {
  items: any[];
}

const itemTableHeaders: TableHeaderItem[] = [
  { label: "Product", width: "4rem" },
  { label: "Details" },
  { label: "Req. qty", width: "7rem", isCentered: true },
  { label: "Ord. qty", width: "7rem", isCentered: true },
  { label: "MRP", width: "9rem", isRightAligned: true },
  { label: "Unit price", width: "9rem", isRightAligned: true },
  { label: "Line total", width: "10rem", isRightAligned: true },
];

const DesktopView: React.FC<DesktopViewProps> = ({ items }) => {
  return (
    <AppCard noContentPadding>
      <AppTable bordered hover minWidth="800px">
        <AppTable.Header>
          <TableHeader headers={itemTableHeaders} />
        </AppTable.Header>
        <AppTable.Body>
          {items.map((item, index) => {
            const mrp = Number(item.mrp);
            const unitPrice = Number(item.price);
            const showMrpStrike =
              Number.isFinite(mrp) &&
              Number.isFinite(unitPrice) &&
              mrp > unitPrice;

            return (
            <AppTable.Row key={item._id || index}>
              <AppTable.Cell>
                <ImgRender
                  assetId={item.images?.[0]}
                  className="tw:w-12 tw:h-12 tw:rounded-lg tw:border tw:border-slate-200 tw:object-cover tw:bg-white"
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:flex-col tw:justify-center">
                  <div className="tw:text-sm tw:font-semibold tw:text-slate-900 tw:line-clamp-1">
                    {item.dealName}
                  </div>
                  <div className="tw:text-xs tw:text-slate-500 tw:mt-0.5">
                    ID: {item.dealRefId || "N/A"}
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center tw:align-middle">
                <span className="tw:inline-block tw:text-sm tw:tabular-nums tw:font-bold tw:text-slate-900">
                  {item.quantity ?? "—"}
                </span>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center tw:align-middle tw:w-28">
                <span className="tw:inline-block tw:text-sm tw:tabular-nums tw:font-semibold tw:text-slate-800">
                  {item.actualOrderQty !== undefined &&
                  item.actualOrderQty !== null
                    ? item.actualOrderQty
                    : "—"}
                </span>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-right tw:align-middle">
                <Amount
                  value={item.mrp}
                  className={
                    showMrpStrike
                      ? "tw:text-sm tw:tabular-nums tw:text-slate-400 tw:line-through tw:decoration-slate-400"
                      : "tw:text-sm tw:tabular-nums tw:font-medium tw:text-slate-600"
                  }
                />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-right tw:align-middle">
                <Amount
                  value={item.price}
                  className="tw:text-sm tw:tabular-nums tw:font-semibold tw:text-slate-900"
                />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-right tw:align-middle">
                <Amount
                  value={item.finalPrice}
                  className="tw:text-sm tw:tabular-nums tw:font-bold tw:text-primary"
                />
              </AppTable.Cell>
            </AppTable.Row>
            );
          })}
        </AppTable.Body>
        <AppTable.Footer>
          <AppTable.Row noHover className="tw:bg-slate-50/50">
            <AppTable.Cell
              colSpan={6}
              className="tw:text-right tw:font-semibold tw:text-slate-900"
            >
              Total Amount
            </AppTable.Cell>
            <AppTable.Cell className="tw:text-right">
              <Amount
                value={items.reduce(
                  (acc, curr) => acc + (curr.finalPrice || 0),
                  0,
                )}
                className="tw:text-lg tw:font-black tw:text-primary"
              />
            </AppTable.Cell>
          </AppTable.Row>
        </AppTable.Footer>
      </AppTable>
    </AppCard>
  );
};

export default DesktopView;
