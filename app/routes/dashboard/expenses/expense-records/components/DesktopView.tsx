import React from "react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import NoData from "~/components/core/no-data/NoData";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppButton from "~/components/core/button/AppButton";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import { Eye } from "lucide-react";

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

interface DesktopViewProps {
  data: ExpenseRecord[];
  loading?: boolean;
  callback: (payload: { action: string; data: any }) => void;
  loadedCount?: number;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
  totalCount?: number;
}

const headers = [
  { label: "Title", key: "title", width: "260px" },
  { label: "Amount", key: "amount", width: "110px" },
  { label: "Expense Date", key: "expenseDate", width: "10%" },
  { label: "Status", key: "status", width: "120px" },
  { label: "Receipt", key: "receipt", width: "120px" },
  { label: "Action", key: "action", width: "120px" },
];

const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  loading,
  callback,
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
  const onView = (item: any) => {
    callback({ action: "view", data: item });
  };

  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
        <AppSpinner />
      </div>
    );
  }

  // If not loading and there's no data, show the shared NoData component
  if (!loading && (!data || data.length === 0)) return <NoData />;

  return (
    <>
      <AppTable minWidth="900px" container>
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {data.map((item, idx) => (
            <AppTable.Row key={item._id || idx}>
              <AppTable.Cell>
                <div className="tw:font-medium">{item.title || "--"}</div>
                <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                  {item.categoryName || "--"}
                  {item.subCategoryName ? (
                    <span> / {item.subCategoryName}</span>
                  ) : null}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <Amount value={item.amount || 0} className="tw:text-red-600" />
              </AppTable.Cell>
              <AppTable.Cell>
                <DateFormat
                  value={item.expenseDate || ""}
                  formatStr="dd MMM yyyy"
                />
              </AppTable.Cell>
              <AppTable.Cell>{item.status || "--"}</AppTable.Cell>
              <AppTable.Cell>
                {item.assets && item.assets.length > 0 ? (
                  <AppButton
                    size="small"
                    color="primary"
                    fill="clear"
                    className="tw:text-blue-500"
                    onClick={() =>
                      openImagePreview(item.assets || [], item.assets?.[0])
                    }
                  >
                    View ({item.assets.length})
                  </AppButton>
                ) : (
                  "-"
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <AppButton
                  size="small"
                  color="light"
                  fill="outline"
                  onClick={() => onView(item)}
                >
                  <Eye />
                  View
                </AppButton>
              </AppTable.Cell>
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>
      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={() => imgPreviewModalCallback()}
        images={imgPreviewModal.images}
        initialImageId={imgPreviewModal.initialImageId}
      />
    </>
  );
};

export default DesktopView;
