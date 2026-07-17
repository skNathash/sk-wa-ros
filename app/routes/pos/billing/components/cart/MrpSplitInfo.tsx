import { Info } from "lucide-react";
import { useMemo } from "react";
import Amount from "~/components/core/amount/Amount";
import AppPopover from "~/components/core/popover/AppPopover";

const MrpSplitInfo = ({ snapshots }: { snapshots: any[] }) => {
  const groupedSnapshots: { mrp: number; quantity: number }[] = useMemo(() => {
    let grouped: Record<string, { mrp: number; quantity: number }> = {};
    snapshots.forEach((snapshot) => {
      if (!grouped[snapshot.mrp]) {
        grouped[snapshot.mrp] = {
          quantity: 0,
          mrp: snapshot.mrp,
        };
      }
      grouped[snapshot.mrp].quantity += snapshot.quantity;
    });
    return Object.values(grouped);
  }, [snapshots]);

  if (groupedSnapshots.length <= 1) return null;

  return (
    <AppPopover
      triggerContent={<Info size={12} className="tw:text-gray-500" />}
    >
      <div className="tw:text-xs tw:text-gray-900 tw:font-medium tw:mb-2">
        MRP wise Split of the product
      </div>

      {groupedSnapshots?.map((snapshot) => (
        <div
          key={snapshot.mrp}
          className="tw:items-center tw:gap-2 tw:text-xs tw:text-gray-500 tw:flex tw:justify-between tw:mb-1"
        >
          <div>
            <span className="tw:mr-1">MRP</span>
            <Amount
              value={snapshot.mrp}
              decimalPlaces={2}
              className="tw:text-right"
            />
          </div>
          <div>
            <span>×</span>
            {snapshot.quantity} units
          </div>
        </div>
      ))}
    </AppPopover>
  );
};

export default MrpSplitInfo;
