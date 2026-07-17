import React from "react";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import CommonService from "~/services/CommonService";

interface CompletedBoxSummaryProps {
  completedBoxes: any[];
  dealUomMap?: Record<string, string>;
}

const CompletedBoxSummary: React.FC<CompletedBoxSummaryProps> = ({
  completedBoxes,
  dealUomMap = {},
}) => {
  if (!completedBoxes || completedBoxes.length === 0) {
    return null;
  }

  // Calculate totals
  const totalBoxes = completedBoxes.length;
  // Count unique items strictly by `dealId` across all completed boxes.
  const uniqueDealIds = new Set<string>();
  completedBoxes.forEach((box) => {
    (box.items || []).forEach((item: any) => {
      if (item && item.dealId) {
        uniqueDealIds.add(String(item.dealId));
      }
    });
  });

  const totalItems = uniqueDealIds.size;

  const qtyEntries: Array<{ uom: string; qty: number }> = [];
  completedBoxes.forEach((box) => {
    (box.items || []).forEach((item: any) => {
      qtyEntries.push({
        uom: dealUomMap[item?.dealId] || "unit",
        qty: Number(item?.qty ?? 0) || 0,
      });
    });
  });
  const totalQtyDisplay =
    CommonService.groupQtyByUom(qtyEntries).label || "0 units";

  // Get packed date from first record
  const firstBox = completedBoxes[0];
  const packedBy = firstBox?.createdBy?.name || "N/A";

  return (
    <div className="tw:mt-4 tw:mb-4 tw:bg-green-50 tw:border tw:border-green-200 tw:rounded-lg tw:p-4">
      <h3 className="tw:font-bold tw:text-green-800 tw:mb-4">
        Packing Summary
      </h3>

      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4">
        {/* Total Boxes */}
        <div>
          <div className="tw:text-green-600 tw:mb-1 tw:text-sm">
            Total Boxes
          </div>
          <div className="tw:font-medium tw:text-green-800 tw:text-sm">
            {totalBoxes}
          </div>
        </div>

        {/* Total Items */}
        <div>
          <div className="tw:text-green-600 tw:mb-1 tw:text-sm">
            Total Items
          </div>
          <div className="tw:font-medium tw:text-green-800 tw:text-sm">
            {totalItems} ({totalQtyDisplay})
          </div>
        </div>

        {/* Packed Date */}
        <div>
          <div className="tw:text-green-600 tw:mb-1 tw:text-sm">
            Packed Date
          </div>
          <div>
            <DateFormat
              value={firstBox?.createdAt}
              className="tw:font-medium tw:text-green-800 tw:text-sm"
            />
          </div>
        </div>

        {/* Packed By */}
        <div>
          <div className="tw:text-green-600 tw:mb-1 tw:text-sm">Packed By</div>
          <div className="tw:font-medium tw:text-green-800 tw:text-sm">
            {packedBy}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletedBoxSummary;
