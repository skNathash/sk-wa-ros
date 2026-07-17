import { ArrowRight } from "lucide-react";
import { AppTable, TableSkeletonLoader } from "~/components/core/table";
import TableHeader from "~/components/core/table/TableHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppBadge from "~/components/core/badge/AppBadge";
import MsgPopover from "./MsgPopover";
import NoData from "~/components/core/no-data/NoData";

type DesktopViewProps = {
  data: any[];
  loading: boolean;
  hasMoreData: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
  loadedCount: number;
  activeTab?: string;
  callback?: (params: { action: string; data?: any }) => void;
};

const tableContainer = {
  maxHeight: "calc(100vh - 300px)",
};

const headers = [
  { label: "S.No", key: "sno", width: "5%" },
  { label: "Template Name", key: "templateName", width: "20%" },
  { label: "Status", key: "status", width: "10%" },
  { label: "Sent On", key: "sentOn", width: "15%" },
  { label: "Message", key: "message", width: "25%" },
];

const DesktopView = ({
  data,
  loading,
  hasMoreData,
  loadingMore,
  loadMore,
  totalCount,
  loadedCount,
  activeTab,
  callback,
}: DesktopViewProps) => {
  const isEmail = activeTab === "email";
  const isSms = activeTab === "sms";
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <>
      <AppTable
        fixedLayout
        container
        stickyHeader
        containerStyle={tableContainer}
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {loading ? (
            <TableSkeletonLoader cols={headers.length} rows={10} />
          ) : null}

          {data.map((item, index) => (
            <AppTable.Row key={item._id}>
              <AppTable.Cell>{index + 1}</AppTable.Cell>
              <AppTable.Cell>{item.templateName}</AppTable.Cell>
              <AppTable.Cell>
                {item.status === "Success" ? (
                  <AppBadge variant="success">Success</AppBadge>
                ) : (
                  <AppBadge variant="danger">Failed</AppBadge>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <DateFormat value={item.sentOn} />
              </AppTable.Cell>
              <AppTable.Cell>
                {isEmail ? (
                  <span
                    className="tw:text-xs tw:text-primary tw:cursor-pointer tw:flex tw:items-center tw:gap-1"
                    onClick={() =>
                      callback?.({ action: "view-email", data: item })
                    }
                  >
                    View
                    <ArrowRight size={12} />
                  </span>
                ) : isSms ? (
                  <div>
                    <p className="tw:text-xs tw:text-gray-700 tw:line-clamp-3 tw:whitespace-pre-wrap tw:mb-1">
                      {item.message}
                    </p>
                    <MsgPopover message={item.message} label="View" />
                  </div>
                ) : (
                  <div>
                    <p className="tw:text-xs tw:text-gray-700 tw:line-clamp-3 tw:whitespace-pre-wrap tw:mb-1">
                      {item.message}
                    </p>
                    <span
                      className="tw:text-xs tw:text-primary tw:cursor-pointer tw:flex tw:items-center tw:gap-1"
                      onClick={() =>
                        callback?.({ action: "view-whatsapp", data: item })
                      }
                    >
                      View
                      <ArrowRight size={12} />
                    </span>
                  </div>
                )}
              </AppTable.Cell>
            </AppTable.Row>
          ))}
          {hasMoreData && !loading && data.length > 0 && (
            <AppTable.Row>
              <AppTable.Cell
                colSpan={headers.length}
                className="tw:text-center"
              >
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={totalCount}
                  loadedCount={loadedCount}
                />
              </AppTable.Cell>
            </AppTable.Row>
          )}
        </AppTable.Body>
      </AppTable>
    </>
  );
};

export default DesktopView;
