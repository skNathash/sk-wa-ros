import { PackageSearch, PlusCircle, ScanLine, Sparkles } from "lucide-react";

import AppButton from "~/components/core/button/AppButton";

interface Props {
  barcode: string;
  onCreate: () => void;
  onScanNext: () => void;
}

/**
 * Shown when neither the SK Library nor the AI search found anything.
 * Big friendly actions: add it yourself (you'd be the first!) or scan another.
 */
const NoMatch: React.FC<Props> = ({ barcode, onCreate, onScanNext }) => (
  <div className="tw:flex tw:flex-col tw:items-center tw:text-center tw:py-8 tw:px-4 tw:border tw:border-dashed tw:border-amber-300 tw:rounded-xl tw:bg-amber-50/50">
    <div className="tw:flex tw:items-center tw:justify-center tw:w-14 tw:h-14 tw:rounded-full tw:bg-amber-100 tw:mb-3">
      <PackageSearch className="tw:w-7 tw:h-7 tw:text-amber-600" />
    </div>
    <div className="tw:flex tw:items-center tw:gap-1 tw:text-sm tw:font-bold tw:text-gray-900">
      Not in SK Library or StoreKing AI — create it!
      <Sparkles className="tw:w-3.5 tw:h-3.5 tw:text-amber-500" />
    </div>
    <div className="tw:text-xs tw:text-gray-600 tw:mt-1 tw:max-w-xl">
      Barcode{" "}
      <span className="tw:font-mono tw:font-semibold tw:text-gray-800">
        {barcode}
      </span>{" "}
      isn't in SK Library and StoreKing AI couldn't find its details. Create it
      to add it to the library and your store.
    </div>

    <div className="tw:flex tw:flex-col tw:sm:flex-row tw:gap-2 tw:mt-5 tw:w-full tw:sm:w-auto">
      <AppButton onClick={onCreate}>
        <PlusCircle className="tw:w-4 tw:h-4 tw:mr-1.5" />
        Create New Item
      </AppButton>
      <AppButton fill="outline" color="light" onClick={onScanNext}>
        <ScanLine className="tw:w-4 tw:h-4 tw:mr-1.5" />
        Scan next item
      </AppButton>
    </div>
  </div>
);

export default NoMatch;
