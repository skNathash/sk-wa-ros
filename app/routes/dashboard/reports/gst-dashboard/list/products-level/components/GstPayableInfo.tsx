import React from "react";
import { Info } from "lucide-react";
import AppPopover from "~/components/core/popover/AppPopover";
import Amount from "~/components/core/amount/Amount";

interface GstPayableInfoProps {
  netGst: number;
}

const GstPayableInfo: React.FC<GstPayableInfoProps> = ({ netGst }) => {
  const isPayable = netGst < 0;
  const isCredit = netGst > 0;

  return (
    <AppPopover
      triggerContent={<Info size={14} className="tw:text-gray-500" />}
    >
      <div className="tw:text-sm tw:text-gray-700">
        {isPayable ? (
          <div>
            You need to pay <Amount value={Math.abs(netGst)} /> to the
            government.
          </div>
        ) : isCredit ? (
          <div>
            This is a credit of <Amount value={Math.abs(netGst)} /> and can be
            carried forward.
          </div>
        ) : (
          <div>No net GST payable.</div>
        )}
      </div>
    </AppPopover>
  );
};

export default GstPayableInfo;
