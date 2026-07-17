import { Barcode } from "lucide-react";
import AppPopover from "~/components/core/popover/AppPopover";
import ScanInput from "./ScanInput";

type Props = {
  callback: (a: {
    action: string;
    data: { product: any; barcode: string };
  }) => void;
  dealIds: string[];
  vendorId?: string;
};

const ScanFab = ({ callback, dealIds, vendorId }: Props) => {
  return (
    <div className="tw:fixed tw:bottom-20 tw:right-4 tw:z-50">
      <AppPopover
        align="end"
        side="left"
        sideOffset={8}
        avoidCollisions={true}
        triggerContent={
          <button className="tw:bg-blue-600 tw:text-white tw:w-14 tw:h-14 tw:rounded-full tw:shadow-lg tw:flex tw:items-center tw:justify-center tw:hover:bg-blue-700 tw:transition-colors tw:duration-200 tw:cursor-pointer">
            <Barcode className="tw:text-2xl" />
          </button>
        }
      >
        <div>
          <ScanInput
            callback={callback}
            dealIds={dealIds}
            vendorId={vendorId}
          />
        </div>
      </AppPopover>
    </div>
  );
};

export default ScanFab;
