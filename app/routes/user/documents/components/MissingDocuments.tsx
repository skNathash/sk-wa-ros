import { AlertTriangle } from "lucide-react";
import React from "react";
import AppButton from "~/components/core/button/AppButton";
import type { DocumentItem } from "../helper";

interface MissingDocumentsProps {
  items: DocumentItem[];
  onAdd: (item: DocumentItem) => void;
}

/**
 * The "unlock next" strip — the documents the store still owes, listed above
 * the grid so the fix is one tap away without hunting through the cards.
 */
const MissingDocuments: React.FC<MissingDocumentsProps> = ({
  items,
  onAdd,
}) => (
  <div className="tw:rounded-xl tw:border tw:border-red-200 tw:bg-red-50/60 tw:p-3">
    <div className="tw:mb-2 tw:flex tw:items-center tw:gap-2 tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-red-700">
      <AlertTriangle size={14} />
      Missing — unlock next
    </div>
    <div className="tw:flex tw:flex-col tw:gap-2">
      {items.map((item) => (
        <div
          key={item.key}
          className="tw:flex tw:items-center tw:gap-3 tw:rounded-lg tw:bg-white tw:px-3 tw:py-2"
        >
          <span className="tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-red-100 tw:text-xs tw:font-bold tw:text-red-600">
            {item.initials}
          </span>
          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800">
              {item.title}
            </div>
            <div className="tw:truncate tw:text-xs tw:text-gray-500">
              {item.hint || item.type}
            </div>
          </div>
          <AppButton size="small" color="primary" onClick={() => onAdd(item)}>
            Add
          </AppButton>
        </div>
      ))}
    </div>
  </div>
);

export default MissingDocuments;
