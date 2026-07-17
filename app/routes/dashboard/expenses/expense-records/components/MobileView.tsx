import React from "react";
import NoData from "~/components/core/no-data/NoData";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppButton from "~/components/core/button/AppButton";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import { Eye, FileText, Clock } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import KeyValue from "~/components/core/key-value/KeyValue";

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
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((item) => (
        <AppCard
          key={item._id}
          className="tw:flex tw:flex-col tw:justify-between tw:mb-0"
          noPadding
        >
          <div className="tw:p-4 tw:flex tw:justify-between tw:items-start">
            <div>
              <div className="tw:line-clamp-2 tw:mb-1 tw:text-sm tw:font-semibold">
                {item.title}
              </div>
              <div className="tw:flex tw:flex-wrap tw:gap-2 tw:text-xs tw:text-gray-500">
                <span>{item.categoryName || "-"}</span>
                {item.subCategoryName ? (
                  <>
                    <span>•</span>
                    <span>{item.subCategoryName}</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="tw:flex tw:flex-col tw:items-end tw:ml-3">
              <Amount
                value={item.amount || 0}
                className="tw:text-red-600 tw:font-semibold tw:text-right"
              />
              <span className="tw:text-xs tw:text-gray-500 tw:mt-1">
                {item.status || "-"}
              </span>
            </div>
          </div>

          <Divider className="tw:my-0!" />

          <div className="tw:grid tw:grid-cols-3 tw:gap-2 tw:px-4 tw:py-3">
            <KeyValue label="Date" size="sm">
              <DateFormat
                value={item.expenseDate || ""}
                formatStr="dd MMM yyyy"
              />
            </KeyValue>
            <KeyValue label="Receipt" size="sm">
              {item.assets && item.assets.length > 0 ? (
                <span
                  className="tw:text-blue-500 tw:px-0! tw:py-0! tw:cursor-pointer tw:text-xs tw:underline"
                  onClick={() =>
                    openImagePreview(item.assets || [], item.assets?.[0])
                  }
                >
                  View Receipt ({item.assets.length})
                </span>
              ) : (
                <span className="tw:text-xs tw:text-gray-400">No receipt</span>
              )}
            </KeyValue>
            <div className="tw:flex tw:justify-end">
              <AppButton
                size="small"
                fill="outline"
                color="light"
                onClick={() =>
                  callback && callback({ action: "view", data: item })
                }
              >
                <Eye />
                View
              </AppButton>
            </div>
          </div>
        </AppCard>
      ))}

      {showLoadMore ? (
        <div className="tw:text-center tw:mt-2">
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
