import { Info } from "lucide-react";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppPopover from "~/components/core/popover/AppPopover";
import clsx from "clsx";
import { useState } from "react";

const CaseQtyPopover = ({
  packageQty,
  sellingType,
  className,
}: {
  packageQty: number;
  sellingType: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);

  if (!sellingType || sellingType === "UNIT") {
    return null;
  }

  return (
    <AppPopover
      triggerContent={
        <Info
          size={12}
          className={clsx("tw:text-gray-500", className)}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        />
      }
      open={open}
      onOpenChange={setOpen}
    >
      <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
        This product is sold in <SellingTypeDisplay sellingType={sellingType} />
      </div>
      <KeyValue
        label={`1 ${sellingType.replace(/_/g, " ")}`}
        horizontal
        size="xs"
        labelClassName="tw:w-1/2"
        className="tw:mb-2"
      >
        = {packageQty} units
      </KeyValue>
    </AppPopover>
  );
};

export default CaseQtyPopover;
