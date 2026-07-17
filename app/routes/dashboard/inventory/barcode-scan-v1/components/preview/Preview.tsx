import React, { useMemo, useState } from "react";
import { ListChecks, PackagePlus } from "lucide-react";
import useScreenView from "~/hooks/useScreenView";
import SimpleAddProductModal from "~/shared/catalog/modals/simple-add-product/SimpleAddProductModal";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import { groupItems, type PreviewItem } from "./types";

interface PreviewProps {
  items: PreviewItem[];
  onProductCreated?: (barcode: string) => void;
  onRemove?: (barcode: string) => void;
}

const Preview: React.FC<PreviewProps> = ({
  items,
  onProductCreated,
  onRemove,
}) => {
  const { isMobile } = useScreenView();
  const groups = useMemo(() => groupItems(items), [items]);
  const [createModal, setCreateModal] = useState<{
    show: boolean;
    item: PreviewItem | null;
  }>({ show: false, item: null });

  const handleCreate = (item: PreviewItem) => {
    setCreateModal({ show: true, item });
  };

  const handleModalCallback = (a: { action: string; data?: any }) => {
    if (a.action === "submit" || a.action === "created") {
      const bc = createModal.item?.barcode;
      setCreateModal({ show: false, item: null });
      if (bc) onProductCreated?.(bc);
    } else {
      setCreateModal({ show: false, item: null });
    }
  };

  const View = isMobile ? MobileView : DesktopView;

  const totalQty = useMemo(
    () => items.reduce((s, i) => s + (Number(i.qty) || 0), 0),
    [items],
  );

  const summary = [
    {
      key: "new",
      label: "To subscribe",
      count: groups.notSubscribed.length,
      tone: "tw:text-blue-700 tw:bg-blue-50 tw:border-blue-100",
      dot: "tw:bg-blue-500",
    },
    {
      key: "already",
      label: "Already subscribed",
      count: groups.subscribed.length,
      tone: "tw:text-emerald-700 tw:bg-emerald-50 tw:border-emerald-100",
      dot: "tw:bg-emerald-500",
    },
    {
      key: "missing",
      label: "Not found",
      count: groups.newProducts.length,
      tone: "tw:text-amber-700 tw:bg-amber-50 tw:border-amber-100",
      dot: "tw:bg-amber-500",
    },
  ];

  return (
    <>
      <div>
        <div className="tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-3 tw:mb-4">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-2">
            <div className="tw:flex tw:items-center tw:gap-2">
              <ListChecks className="tw:w-4 tw:h-4 tw:text-gray-600" />
              <span className="tw:text-sm tw:font-semibold tw:text-gray-800">
                Review before subscribing
              </span>
            </div>
            <span className="tw:text-[11px] tw:font-medium tw:text-gray-500 tw:tabular-nums">
              {items.length} items · {totalQty} units
            </span>
          </div>
          <div className="tw:flex tw:flex-wrap tw:gap-1.5">
            {summary.map((s) => (
              <span
                key={s.key}
                className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-medium tw:border tw:rounded-full tw:px-2 tw:py-0.5 tw:tabular-nums ${
                  s.count ? s.tone : "tw:text-gray-400 tw:bg-gray-50 tw:border-gray-100"
                }`}
              >
                <span className={`tw:w-1.5 tw:h-1.5 tw:rounded-full ${s.count ? s.dot : "tw:bg-gray-300"}`} />
                {s.label}
                <span className="tw:font-semibold">{s.count}</span>
              </span>
            ))}
          </div>
        </div>
        {items.length === 0 ? (
          <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:text-center tw:py-10 tw:px-4">
            <PackagePlus className="tw:w-8 tw:h-8 tw:text-gray-300 tw:mb-3" />
            <div className="tw:text-sm tw:font-medium tw:text-gray-700">
              Nothing to preview
            </div>
            <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
              Scan items and submit to see a grouped preview here.
            </div>
          </div>
        ) : (
          <>
            <View
              title="To subscribe"
              hint="Will be subscribed when you confirm"
              tone="blue"
              items={groups.notSubscribed}
              onRemove={onRemove}
            />
            <View
              title="Already subscribed"
              hint="Skipped — already in your inventory"
              tone="emerald"
              items={groups.subscribed}
              onRemove={onRemove}
            />
            <View
              title="Product not found"
              hint="Create a product first, or remove the scan"
              tone="amber"
              items={groups.newProducts}
              showCreate
              onCreate={handleCreate}
              onRemove={onRemove}
            />
          </>
        )}
      </div>

      <SimpleAddProductModal
        show={createModal.show}
        callback={handleModalCallback}
        initialData={
          createModal.item
            ? { barcode: createModal.item.barcode }
            : undefined
        }
      />
    </>
  );
};

export default Preview;
