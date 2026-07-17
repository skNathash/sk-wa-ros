import React from "react";
import {
  Box,
  Package,
  CheckCircle2,
  AlertTriangle,
  ScanBarcode,
} from "lucide-react";
import ImgRender from "app/components/core/img/ImgRender";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import AppButton from "~/components/core/button/AppButton";
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

const baseHeaders = [
  { key: "idx", label: "#" },
  { key: "image", label: "Image" },
  { key: "name", label: "Product" },
  { key: "dealId", label: "Deal ID" },
  { key: "barcode", label: "Barcode" },
  { key: "qty", label: "Qty" },
];

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

const DesktopView: React.FC<Props> = ({
  title,
  hint,
  items,
  showCreate,
  onCreate,
  onRemove,
  tone = "blue",
}) => {
  if (!items.length) return null;
  const showActions = showCreate || !!onRemove;
  const headers = showActions
    ? [...baseHeaders, { key: "actions", label: "" }]
    : baseHeaders;
  const totalQty = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);
  const t = toneMap[tone];

  return (
    <div className="tw:mb-6 tw:last:mb-0">
      <div className="tw:flex tw:flex-col tw:mb-2">
        <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
          <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
            {title}
          </div>
          <span
            className={`tw:inline-flex tw:items-center tw:gap-1 tw:text-[11px] tw:font-semibold tw:border tw:rounded-full tw:px-2 tw:py-0.5 tw:tabular-nums ${t.chip}`}
          >
            {t.icon}
            {items.length} · {totalQty} units
          </span>
        </div>
        {hint && (
          <div className="tw:text-[11px] tw:text-gray-500 tw:mt-0.5">
            {hint}
          </div>
        )}
      </div>
      <div className={`tw:rounded-xl tw:border tw:border-gray-200 tw:overflow-hidden tw:bg-white ${t.accent}`}>
        <AppTable>
          <AppTable.Header>
            <TableHeader headers={headers} />
          </AppTable.Header>
          <AppTable.Body>
            {items.map((item, idx) => {
              const invalid = item.status === "Invalid";
              return (
                <AppTable.Row key={`${item.barcode}-${idx}`}>
                  <AppTable.Cell>
                    <span className="tw:text-xs tw:text-gray-500 tw:tabular-nums">
                      {idx + 1}
                    </span>
                  </AppTable.Cell>
                  <AppTable.Cell>
                    {item.images && item.images.length > 0 ? (
                      <ImgRender
                        assetId={item.images[0]}
                        alt={item.dealName}
                        className="tw:h-12 tw:w-12 tw:object-cover tw:rounded-lg tw:border tw:border-gray-100"
                      />
                    ) : (
                      <div className="tw:h-12 tw:w-12 tw:flex tw:items-center tw:justify-center tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-lg">
                        <Box size={20} className="tw:text-gray-400" />
                      </div>
                    )}
                  </AppTable.Cell>
                  <AppTable.Cell>
                    <div className="tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0">
                      <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:line-clamp-1">
                        {item.dealName || (
                          <span className="tw:text-gray-400 tw:italic">
                            Unknown product
                          </span>
                        )}
                      </div>
                      {invalid && item.validationMessage && (
                        <div className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[11px] tw:text-red-600">
                          <AlertTriangle className="tw:w-3 tw:h-3" />
                          {item.validationMessage}
                        </div>
                      )}
                    </div>
                  </AppTable.Cell>
                  <AppTable.Cell>
                    {item.dealRefId ? (
                      <span className="tw:text-xs tw:font-mono tw:text-gray-700">
                        {item.dealRefId}
                      </span>
                    ) : (
                      <span className="tw:text-xs tw:text-gray-400">—</span>
                    )}
                  </AppTable.Cell>
                  <AppTable.Cell>
                    <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-mono tw:text-gray-700 tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded tw:px-1.5 tw:py-0.5">
                      <ScanBarcode className="tw:w-3 tw:h-3 tw:text-gray-400" />
                      {item.barcode}
                    </span>
                  </AppTable.Cell>
                  <AppTable.Cell>
                    <span className="tw:inline-flex tw:items-center tw:justify-center tw:min-w-8 tw:text-xs tw:font-semibold tw:text-gray-800 tw:bg-gray-100 tw:rounded tw:px-2 tw:py-0.5 tw:tabular-nums">
                      {item.qty}
                    </span>
                  </AppTable.Cell>
                  {showActions && (
                    <AppTable.Cell>
                      {item.sentForApproval ? (
                        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[11px] tw:font-semibold tw:text-emerald-700 tw:bg-emerald-50 tw:border tw:border-emerald-100 tw:rounded-full tw:px-2 tw:py-0.5">
                          <CheckCircle2 className="tw:w-3 tw:h-3" />
                          Sent for approval
                        </span>
                      ) : (
                        <div className="tw:flex tw:gap-2 tw:justify-end">
                          {showCreate && (
                            <AppButton
                              size="small"
                              onClick={() => onCreate?.(item)}
                            >
                              Create Product
                            </AppButton>
                          )}
                          {onRemove && (
                            <AppButton
                              size="small"
                              color="danger"
                              fill="outline"
                              onClick={() => onRemove(item.barcode)}
                            >
                              Remove
                            </AppButton>
                          )}
                        </div>
                      )}
                    </AppTable.Cell>
                  )}
                </AppTable.Row>
              );
            })}
          </AppTable.Body>
        </AppTable>
      </div>
    </div>
  );
};

export default DesktopView;
