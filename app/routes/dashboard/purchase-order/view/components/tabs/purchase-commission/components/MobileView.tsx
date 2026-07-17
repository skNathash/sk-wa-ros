import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import NoData from "~/components/core/no-data/NoData";
import DownloadCommissionButton from "./DownloadCommissionButton";
import PlatformFeeStatementPlan from "~/shared/accounts/components/platform-fee-statement-plan/PlatformFeeStatementPlan";

type MobileViewProps = {
  data: any[];
  loading?: boolean;
};

export default function MobileView({ data, loading }: MobileViewProps) {
  const { t } = useTranslation(["common"]);
  if (!loading && (!data || data.length === 0)) {
    return <NoData />;
  }
  return (
    <div className="tw:space-y-2">
      {loading ? (
        <div className="tw:rounded-md tw:border tw:border-border tw:p-3 tw:bg-background tw:animate-pulse">
          <div className="tw:flex tw:items-center tw:justify-between tw:mb-1">
            <div className="tw:h-4 tw:bg-muted tw:rounded tw:w-24" />
            <div className="tw:h-4 tw:bg-muted tw:rounded tw:w-20" />
          </div>
          <div className="tw:h-4 tw:bg-muted tw:rounded tw:w-32 tw:mb-2" />
          <div className="tw:flex tw:items-center tw:justify-between">
            <div className="tw:h-4 tw:bg-muted tw:rounded tw:w-16" />
            <div className="tw:h-4 tw:bg-muted tw:rounded tw:w-20" />
          </div>
          <div className="tw:h-3 tw:bg-muted tw:rounded tw:w-28 tw:mt-2" />
        </div>
      ) : (
        data.map((row) => (
          <div
            key={String(row.receiptId)}
            className="tw:rounded-md tw:border tw:border-border tw:p-3 tw:bg-background"
          >
            <div className="tw:flex tw:items-center tw:justify-between tw:mb-1">
              <div className="tw:text-sm tw:font-medium">
                {t("receiptId")}: {row.receiptId}
              </div>
              <div className="tw:text-sm tw:text-muted-foreground tw:flex tw:flex-col">
                <DateFormat value={row.createdAt} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-gray-500">
                  <DateFormat value={row.createdAt} formatStr="hh:mm a" />
                </div>
              </div>
            </div>

            {(row._raw?.planName || row._raw?.planRefId) && (
              <div className="tw:mt-1 tw:text-xs tw:text-gray-500">
                {row._raw?.planName && (
                  <PlatformFeeStatementPlan
                    planName={row._raw.planName}
                    startDate={row._raw.planStartAt}
                    endDate={row._raw.planEndAt}
                  />
                )}
                {row._raw?.planRefId && <div>Ref ID: {row._raw.planRefId}</div>}
              </div>
            )}

            <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mt-1">
              <div className="tw:text-sm">
                <div className="tw:text-sm tw:text-muted-foreground">
                  {t("amount")}
                </div>
                <div className="tw:font-medium tw:text-red-600">
                  <Amount
                    value={row.amount ?? 0}
                    decimalPlaces={2}
                    className="tw:ml-0"
                  />
                </div>
              </div>
              {/* tax removed */}
              {/* PO ID removed */}
            </div>
            <div className="tw:mt-3 tw:flex tw:justify-end">
              <DownloadCommissionButton subscriptionId={row.subscriptionId} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
