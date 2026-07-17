import { MoreVertical } from "lucide-react";
import React from "react";
import AppPopover from "~/components/core/popover/AppPopover";
import KeyValue from "~/components/core/key-value/KeyValue";

interface ProductMoreMenuProps {
  data: {
    brand?: { name: string };
    category?: { name: string };
    hsn?: string;
    gst?: number;
    dealId?: string;
  };
  callback: (params: { action: string; data?: any }) => void;
}

const ProductMoreMenu: React.FC<ProductMoreMenuProps> = ({
  data,
  callback,
}) => {
  return (
    <AppPopover
      triggerContent={
        <MoreVertical
          size={18}
          className="tw:text-gray-500 tw:cursor-pointer"
        />
      }
    >
      <div className="tw:grid tw:grid-cols-2 tw:gap-2">
        <KeyValue
          label="Brand"
          valueClassName="tw:font-medium"
          className="tw:col-span-2"
          size="sm"
        >
          <span
            onClick={() =>
              callback({
                action: "brand-tap",
                data: { brand: data.brand },
              })
            }
          >
            <span className="tw:cursor-pointer tw:underline">
              {data.brand?.name || "--"}
            </span>
          </span>
        </KeyValue>

        <KeyValue
          label="Category"
          valueClassName="tw:font-medium"
          className="tw:col-span-2"
          size="sm"
        >
          {data.category?.name || "--"}
        </KeyValue>

        <KeyValue label="HSN" valueClassName="tw:font-medium" size="sm">
          {data.hsn || "--"}
        </KeyValue>
        <KeyValue label="GST" valueClassName="tw:font-medium" size="sm">
          {data.gst || "--"} {data.gst ? "%" : ""}
        </KeyValue>

        <KeyValue label="ID" valueClassName="tw:font-medium" size="sm">
          {data.dealId || "--"}
        </KeyValue>
      </div>
    </AppPopover>
  );
};

export default ProductMoreMenu;
