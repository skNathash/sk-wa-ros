import { Layers, Percent } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppPopover from "~/components/core/popover/AppPopover";
import { AppTable, TableHeader } from "~/components/core/table";

interface SlabData {
  min: number;
  max: number;
  discount?: number;
  offerPrice?: number;
}

interface KingSlabInfoProps {
  slabs: SlabData[];
  size?: "xs" | "sm" | "md";
}

const KingSlabInfo: React.FC<KingSlabInfoProps> = ({ slabs, size = "sm" }) => {
  const [open, setOpen] = React.useState(false);

  const formatDiscount = (discount?: number) => {
    if (!discount) return "N/A";
    return `${discount}%`;
  };

  const triggerContent = (
    <div
      className="tw:flex tw:items-center tw:gap-1 tw:bg-orange-100/50 tw:text-orange-700 tw:text-[9px] tw:px-1.5 tw:py-0.5 tw:rounded tw:font-bold tw:uppercase tw:tracking-tight tw:shrink-0 tw:cursor-pointer"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen((prev) => !prev);
      }}
    >
      <Layers size={10} />
      Slabs
      <Percent size={10} />
    </div>
  );

  const popoverContent = (
    <div>
      {/* Header */}
      <div className="tw:mb-3 tw:pb-2 tw:border-b tw:border-gray-200">
        <h3 className="tw:text-sm tw:font-bold tw:text-gray-900 tw:mb-0.5 tw:flex tw:items-center tw:gap-1.5">
          <Layers size={14} />
          <span>Slab Discount</span>
        </h3>
        <p className="tw:text-[10px] tw:text-gray-600 tw:leading-tight">
          Bulk purchase discounts - better prices for larger quantities
        </p>
      </div>

      <AppTable
        bordered
        condensed
        className="tw:border-gray-200 tw:border tw:mt-2"
      >
        <AppTable.Header>
          <TableHeader
            headers={[
              { label: "Quantity" },
              { label: "Discount", isCentered: true },
              { label: "B2B Price", isCentered: true },
            ]}
          />
        </AppTable.Header>

        <AppTable.Body>
          {slabs.map((item, index) => (
            <AppTable.Row key={index}>
              <AppTable.Cell>
                {index === slabs.length - 1 || item.max == null
                  ? `${item.min} and above`
                  : `${item.min} to ${item.max}`}
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center">
                {item.discount ? `${item.discount}%` : "—"}
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center">
                {item.offerPrice ? (
                  <Amount value={item.offerPrice} />
                ) : (
                  <span className="tw:text-gray-400 tw:text-[10px]">N/A</span>
                )}
              </AppTable.Cell>
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>

      {/* Footer tip */}
      <div className="tw:mt-2 tw:pt-2 tw:border-t tw:border-gray-200">
        <p className="tw:text-[9px] tw:text-gray-500 tw:italic tw:text-center">
          💡 Higher quantities unlock better prices automatically
        </p>
      </div>
    </div>
  );

  return (
    <div className="tw:inline-block">
      <AppPopover
        triggerContent={triggerContent}
        side="top"
        align="end"
        sideOffset={4}
        avoidCollisions={true}
        open={open}
        onOpenChange={setOpen}
      >
        {popoverContent}
      </AppPopover>
    </div>
  );
};

export default KingSlabInfo;
