import React, { useState } from "react";
import {
  Box,
  ScanBarcode,
  Package,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  PackagePlus,
  Trash2,
  Clock,
} from "lucide-react";
import ImgRender from "app/components/core/img/ImgRender";
import type { PreviewItem } from "./types";

type Tone = "blue" | "emerald" | "amber";

interface Props {
  title: string;
  hint?: string;
  items: PreviewItem[];
  showCreate?: boolean;
  onCreate?: (item: PreviewItem) => void;
  onRemove?: (barcode: string) => void;
  tone?: Tone;
}

const toneMap: Record<Tone, { chip: string; icon: React.ReactNode; accent: string }> = {
  blue: {
    chip: "tw:text-blue-700 tw:bg-blue-50 tw:border-blue-100",
    icon: <Package className="tw:w-3.5 tw:h-3.5" />,
    accent: "tw:border-l-4 tw:border-l-blue-400",
  },
  emerald: {
    chip: "tw:text-emerald-700 tw:bg-emerald-50 tw:border-emerald-100",
    icon: <CheckCircle2 className="tw:w-3.5 tw:h-3.5" />,
    accent: "tw:border-l-4 tw:border-l-emerald-400",
  },
  amber: {
    chip: "tw:text-amber-700 tw:bg-amber-50 tw:border-amber-100",
    icon: <AlertTriangle className="tw:w-3.5 tw:h-3.5" />,
    accent: "tw:border-l-4 tw:border-l-amber-400",
  },
};

const MobileView: React.FC<Props> = ({
  title,
  hint,
  items,
  showCreate,
  onCreate,
  onRemove,
  tone = "blue",
}) => {
  if (!items.length) return null;
  const totalQty = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);
  const t = toneMap[tone];
  const [open, setOpen] = useState(true);

  return (
    <div className="tw:mb-3 tw:last:mb-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="tw:flex tw:items-center tw:gap-2 tw:w-full tw:py-1.5 tw:px-1 tw:-mx-1 tw:rounded-lg active:tw:bg-gray-50"
      >
        <div className="tw:flex tw:flex-col tw:flex-1 tw:min-w-0 tw:text-left">
          <div className="tw:text-[13px] tw:font-semibold tw:text-gray-800 tw:truncate">
            {title}
          </div>
          {hint && (
            <div className="tw:text-[10px] tw:text-gray-500 tw:truncate">
              {hint}
            </div>
          )}
        </div>
        <span
          className={`tw:inline-flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-semibold tw:border tw:rounded-full tw:px-2 tw:py-0.5 tw:tabular-nums ${t.chip}`}
        >
          {t.icon}
          {items.length} · {totalQty}
        </span>
        <ChevronDown
          className={`tw:w-4 tw:h-4 tw:text-gray-400 tw:transition-transform ${
            open ? "" : "tw:-rotate-90"
          }`}
        />
      </button>

      {open && (
        <ul className={`tw:mt-1 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:divide-y tw:divide-gray-100 tw:overflow-hidden ${t.accent}`}>
          {items.map((item, idx) => {
            const invalid = item.status === "Invalid";
            const showActions = showCreate || !!onRemove;
            return (
              <li
                key={`${item.barcode}-${idx}`}
                className="tw:flex tw:items-center tw:gap-2.5 tw:px-2.5 tw:py-2"
              >
                {item.images && item.images.length > 0 ? (
                  <ImgRender
                    assetId={item.images[0]}
                    alt={item.dealName}
                    className="tw:h-9 tw:w-9 tw:object-cover tw:rounded-md tw:border tw:border-gray-100 tw:shrink-0"
                  />
                ) : (
                  <div className="tw:h-9 tw:w-9 tw:flex tw:items-center tw:justify-center tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-md tw:shrink-0">
                    <Box size={16} className="tw:text-gray-400" />
                  </div>
                )}

                <div className="tw:flex-1 tw:min-w-0">
                  <div className="tw:flex tw:items-center tw:gap-1.5">
                    {invalid && (
                      <span className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-red-500 tw:shrink-0" />
                    )}
                    <div className="tw:text-[13px] tw:font-medium tw:text-gray-900 tw:line-clamp-2 tw:leading-snug">
                      {item.dealName || (
                        <span className="tw:text-gray-400 tw:italic">
                          Unknown
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="tw:flex tw:items-center tw:gap-1.5 tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
                    <ScanBarcode className="tw:w-3 tw:h-3 tw:shrink-0" />
                    <span className="tw:font-mono tw:truncate">
                      {item.barcode}
                    </span>
                    <span className="tw:text-gray-300">·</span>
                    <span className="tw:font-semibold tw:text-gray-700 tw:tabular-nums tw:shrink-0">
                      ×{item.qty}
                    </span>
                  </div>
                  {item.dealRefId && (
                    <div className="tw:text-[10px] tw:font-mono tw:text-gray-500 tw:truncate tw:mt-0.5">
                      ID: {item.dealRefId}
                    </div>
                  )}
                  {invalid && item.validationMessage && (
                    <div className="tw:text-[10px] tw:text-red-600 tw:truncate tw:mt-0.5">
                      {item.validationMessage}
                    </div>
                  )}
                </div>

                {showActions && (
                  <div className="tw:flex tw:items-center tw:gap-1 tw:shrink-0">
                    {item.sentForApproval ? (
                      <span
                        aria-label="Sent for approval"
                        className="tw:inline-flex tw:items-center tw:gap-1 tw:h-8 tw:px-2.5 tw:rounded-full tw:bg-amber-50 tw:border tw:border-amber-200 tw:text-amber-700 tw:text-[11px] tw:font-semibold"
                      >
                        <Clock className="tw:w-3.5 tw:h-3.5" />
                        Pending
                      </span>
                    ) : (
                      <>
                        {showCreate && (
                          <button
                            type="button"
                            aria-label="Create product"
                            onClick={() => onCreate?.(item)}
                            className="tw:inline-flex tw:items-center tw:gap-1 tw:h-8 tw:px-2.5 tw:rounded-full tw:bg-blue-600 tw:text-white tw:text-[11px] tw:font-semibold tw:shadow-sm tw:transition-colors active:tw:bg-blue-700 hover:tw:bg-blue-700 focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-blue-300"
                          >
                            <PackagePlus className="tw:w-3.5 tw:h-3.5" />
                            Create
                          </button>
                        )}
                        {onRemove && (
                          <button
                            type="button"
                            aria-label="Remove"
                            onClick={() => onRemove(item.barcode)}
                            className="tw:inline-flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-full tw:bg-white tw:border tw:border-gray-200 tw:text-gray-500 tw:transition-colors active:tw:bg-red-50 active:tw:text-red-600 active:tw:border-red-200 hover:tw:bg-red-50 hover:tw:text-red-600 hover:tw:border-red-200 focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-red-300"
                          >
                            <Trash2 className="tw:w-3.5 tw:h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MobileView;
