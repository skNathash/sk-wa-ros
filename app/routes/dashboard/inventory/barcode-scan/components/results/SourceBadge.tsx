import { CheckCircle2, Sparkles } from "lucide-react";

import type { ScanResultRow } from "./helper";

/** The row's own answer to "where did this come from?", shared by both views. */
const SourceBadge: React.FC<{ row: ScanResultRow }> = ({ row }) => {
  if (row.mine)
    return (
      <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-slate-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-slate-700">
        <CheckCircle2 className="tw:w-2.5 tw:h-2.5" />
        Subscribed
      </span>
    );
  if (row.source === "ai")
    return (
      <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-violet-50 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-violet-700">
        <Sparkles className="tw:w-2.5 tw:h-2.5" />
        SK AI
      </span>
    );
  return (
    <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-emerald-50 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-emerald-700">
      <CheckCircle2 className="tw:w-2.5 tw:h-2.5" />
      {row.exact ? "Exact match" : "SK Library"}
    </span>
  );
};

export default SourceBadge;
