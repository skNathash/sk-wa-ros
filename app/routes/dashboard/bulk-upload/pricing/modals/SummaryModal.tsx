import { CheckCircle, AlertTriangle, Package, XCircle } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";

interface FailedDeal {
  dealName: string;
  dealRefId: string;
  error: string;
}

interface SummaryModalProps {
  show: boolean;
  total: number;
  completed: number;
  failed: number;
  status?: "SUCCESS" | "FAILED" | "";
  failedDeals?: FailedDeal[];
  callback: (a: { action: string; data?: any }) => void;
}

const SummaryModal = ({
  show,
  total,
  completed,
  failed,
  status = "SUCCESS",
  failedDeals = [],
  callback,
}: SummaryModalProps) => {
  const handleClose = () => callback({ action: "close" });
  const isFailed = status === "FAILED";

  return (
    <AppModal show={show} callback={callback} isAutoHeight>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          {isFailed ? (
            <XCircle size={20} className="tw:text-red-600" />
          ) : (
            <CheckCircle size={20} className="tw:text-green-600" />
          )}
          {isFailed ? "Pricing Update Failed" : "Pricing Update Summary"}
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
          <AppStatsCard
            label="Total"
            icon={<Package />}
            color="info"
            template={2}
          >
            <div className="tw:text-xl tw:font-bold tw:text-blue-600">
              {total}
            </div>
          </AppStatsCard>

          <AppStatsCard
            label="Completed"
            icon={<CheckCircle />}
            color="success"
            template={2}
          >
            <div className="tw:text-xl tw:font-bold tw:text-green-600">
              {completed}
            </div>
          </AppStatsCard>

          <AppStatsCard
            label="Failed"
            icon={<AlertTriangle />}
            color="danger"
            template={2}
          >
            <div className="tw:text-xl tw:font-bold tw:text-red-600">
              {failed}
            </div>
          </AppStatsCard>
        </div>

        {isFailed && failedDeals.length > 0 && (
          <div className="tw:mt-4">
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
              <AlertTriangle size={14} className="tw:text-red-600" />
              <span className="tw:text-sm tw:font-semibold tw:text-gray-800">
                Failed Deals ({failedDeals.length})
              </span>
            </div>
            <div className="tw:max-h-64 tw:overflow-y-auto tw:border tw:border-gray-200 tw:rounded-md tw:divide-y tw:divide-gray-100">
              {failedDeals.map((deal, idx) => (
                <div
                  key={`${deal.dealRefId}-${idx}`}
                  className="tw:px-3 tw:py-2 tw:text-xs hover:tw:bg-gray-50"
                >
                  <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                    <div className="tw:font-medium tw:text-gray-900 tw:truncate">
                      {deal.dealName}
                    </div>
                    <div className="tw:text-gray-500 tw:shrink-0">
                      #{deal.dealRefId}
                    </div>
                  </div>
                  <div className="tw:mt-0.5 tw:text-red-600">{deal.error}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-3">
          <AppButton color="primary" onClick={handleClose}>
            Close
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default SummaryModal;
