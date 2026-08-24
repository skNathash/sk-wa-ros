import React from "react";
import NoData from "~/components/core/no-data/NoData";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import { Paperclip } from "lucide-react";

interface ExpenseRecord {
  _id: string;
  title?: string;
  categoryName?: string;
  subCategoryName?: string;
  amount?: number;
  createdAt?: string;
  expenseDate?: string;
  description?: string;
  status?: string;
  receiptUrl?: string;
  assets?: string[];
}

interface MobileViewProps {
  data: ExpenseRecord[];
  loading?: boolean;
  callback?: (payload: { action: string; data: any }) => void;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  loadedCount?: number;
}

// Stable, theme-friendly accent per category (matches the hero palette lead).
const ROW_COLORS = [
  "#075e54", // teal
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ef4444", // red
  "#0ea5e9", // sky
];

const colorFor = (key = "") => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return ROW_COLORS[Math.abs(hash) % ROW_COLORS.length];
};

const MobileView: React.FC<MobileViewProps> = ({
  data,
  loading,
  callback,
  showLoadMore,
  loadingMore,
  loadMore,
}) => {
  const [imgPreviewModal, setImgPreviewModal] = React.useState<{
    show: boolean;
    images: any[];
    initialImageId: string;
  }>({ show: false, images: [], initialImageId: "" });

  const openImagePreview = (images: string[] = [], initialId?: string) => {
    const imgs = (images || []).map((id) => ({ id }));
    setImgPreviewModal({
      show: true,
      images: imgs,
      initialImageId: initialId || imgs[0]?.id || "",
    });
  };

  const imgPreviewModalCallback = () => {
    setImgPreviewModal({ show: false, images: [], initialImageId: "" });
  };

  if (loading) return <div className="tw:text-center">Loading...</div>;

  if (!loading && (!data || data.length === 0)) return <NoData />;

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2.5">
      {data.map((item) => {
        const color = colorFor(item.categoryName || item.title);
        const initial = (item.categoryName || item.title || "?")
          .charAt(0)
          .toUpperCase();
        const hasReceipt = !!(item.assets && item.assets.length > 0);

        return (
          <div
            key={item._id}
            className="expense-row"
            style={{ borderLeftColor: color }}
            onClick={() => callback && callback({ action: "view", data: item })}
          >
            <div
              className="expense-row-icon"
              style={{
                backgroundColor: `color-mix(in srgb, ${color} 14%, #fff)`,
                color,
              }}
            >
              {initial}
            </div>

            <div className="tw:min-w-0 tw:flex-1">
              <div className="expense-row-title tw:truncate">
                {item.title || "Untitled expense"}
              </div>
              <div className="expense-row-meta tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
                <span>{item.categoryName || "Uncategorised"}</span>
                <span>·</span>
                <span>
                  <DateFormat
                    value={item.expenseDate || item.createdAt || ""}
                    formatStr="dd MMM"
                  />
                </span>
                {item.subCategoryName ? (
                  <>
                    <span>·</span>
                    <span>{item.subCategoryName}</span>
                  </>
                ) : null}
                {hasReceipt ? (
                  <button
                    type="button"
                    className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-blue-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      openImagePreview(item.assets || [], item.assets?.[0]);
                    }}
                  >
                    <span>·</span>
                    <Paperclip size={11} />
                    <span>{item.assets!.length}</span>
                  </button>
                ) : null}
              </div>
            </div>

            <div className="tw:flex tw:flex-col tw:items-end tw:gap-0.5">
              <Amount
                value={item.amount || 0}
                className="expense-row-amount"
              />
              {item.status ? (
                <span className="tw:text-[10px] tw:capitalize tw:text-gray-400">
                  {item.status}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}

      {showLoadMore ? (
        <div className="tw:text-center tw:mt-2 tw:md:col-span-2">
          <button
            className="tw:bg-gray-100 tw:text-sm tw:px-4 tw:py-2 tw:rounded tw:border tw:border-gray-200 hover:tw:bg-gray-200"
            onClick={loadMore}
            disabled={!!loadingMore}
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}

      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={() => imgPreviewModalCallback()}
        images={imgPreviewModal.images}
        initialImageId={imgPreviewModal.initialImageId}
      />
    </div>
  );
};

export default MobileView;
