import AppButton from "~/components/core/button/AppButton";
import { Trash } from "lucide-react";
import React from "react";
import MrpSnapshots from "../../../components/MrpSnapshots";

type Props = {
  boxId: string;
  item: any;
  onRemove: (itemId: string) => void;
};

const BoxItem = ({ boxId, item, onRemove }: Props) => {
  return (
    <div className="tw:flex tw:justify-between tw:items-center tw:bg-white tw:p-2 tw:border tw:rounded-sm tw:mb-2">
      <div className="tw:text-sm">
        <div className="tw:font-medium">{item.dealName}</div>
        <div className="tw:text-xs">
          <div className="tw:text-xs tw:text-blue-500 tw:font-medium">
            {item.qty} units
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
            <MrpSnapshots mrpSnapshots={item.mrpSnapshots} />
          </div>
        </div>
      </div>
      <AppButton
        onClick={() => onRemove(item.dealId)}
        size="small"
        fill="clear"
      >
        <Trash color="red" />
      </AppButton>
    </div>
  );
};

export default BoxItem;
