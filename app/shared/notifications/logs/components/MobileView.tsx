import { ArrowRight } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import MsgPopover from "./MsgPopover";

type MobileViewProps = {
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

const MobileView = ({
  data,
  loading,
  hasMoreData,
  loadingMore,
  loadMore,
  totalCount,
  loadedCount,
  activeTab,
  callback,
}: MobileViewProps) => {
  const isEmail = activeTab === "email";
  const isSms = activeTab === "sms";
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  // skeleton loader
  if (loading) {
    return (
      <div className="tw:space-y-4 tw:mx-4 tw:flex tw:justify-center tw:items-center tw:h-40 ">
        <AppSpinner />
      </div>
    );
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((item) => {
        return (
          <AppCard key={item._id} className="tw:mb-0">
            <div className="tw:flex tw:gap-2 tw:justify-between tw:items-center">
              <KeyValue
                label="Template Name"
                size="sm"
                valueClassName="tw:font-semibold"
              >
                {item.templateName}
              </KeyValue>

              <div>
                {item.status === "Success" ? (
                  <AppBadge variant="success">Success</AppBadge>
                ) : (
                  <AppBadge variant="danger">Failed</AppBadge>
                )}
              </div>
            </div>

            <div className="tw:my-4">
              <KeyValue label="Sent On" size="sm">
                <DateFormat value={item.sentOn} />
              </KeyValue>
            </div>

            <div className="tw:bg-gray-50 tw:p-2">
              <div className="tw:text-xs tw:font-semibold tw:mb-1">Message</div>
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
            </div>
          </AppCard>
        );
      })}

      {hasMoreData && !loading && data.length > 0 && (
        <div className="tw:flex tw:justify-center tw:mt-4">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </div>
  );
};

export default MobileView;
