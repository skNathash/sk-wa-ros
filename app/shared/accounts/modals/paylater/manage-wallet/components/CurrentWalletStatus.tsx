import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import Divider from "~/components/core/divider/Divider";
import AppBadge from "~/components/core/badge/AppBadge";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import PaylaterService from "~/services/PaylaterService";
import AuthService from "~/services/AuthService";
import DateFormat from "~/components/core/date/DateFormat";

type Props = {
  userId?: string | null;
  show?: boolean;
  name?: string;
  routeType?: string;
  refreshKey?: number;
};

const CurrentWalletStatus: React.FC<Props> = ({
  userId,
  show = false,
  name,
  routeType,
  refreshKey = 0,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (userId) {
      const fetchData = async () => {
        setLoading(true);
        const res = await PaylaterService.validateEligibility({
          userInfo: {
            id: userId,
            type: routeType === "b2b" ? "franchise" : "customer",
          },
          franchiseInfo: {
            id: AuthService.getLoggedInUserId(),
          },
        });
        setData(res.data?.data || null);
        setLoading(false);
      };
      fetchData();
    }
  }, [userId, refreshKey]);

  return (
    <div className="tw:bg-gray-50 tw:rounded-xl tw:p-4  tw:space-y-3 tw:mb-4">
      <div className="tw:font-medium tw:text-sm">
        Current Wallet Status of &quot;
        <span className="tw:font-bold">{name}</span>&quot;
      </div>

      <>
        <div className="tw:grid tw:grid-cols-2 tw:gap-6 tw:mb-2">
          <div className="tw:flex tw:flex-col tw:items-start">
            <div className="tw:text-xs tw:text-gray-500">Status</div>
            {loading ? (
              <AppSpinner className="tw:w-6 tw:h-6" />
            ) : (
              <AppBadge
                variant={data?.paylaterInfo?._statusColor || "default"}
                className="tw:px-3 tw:py-1 tw:rounded-full tw:text-xs tw:font-medium"
              >
                {data?.paylaterInfo?._statusLbl || "--"}
              </AppBadge>
            )}
          </div>

          <div className="tw:flex tw:flex-col tw:items-start">
            <div className="tw:text-xs tw:text-gray-500">Current Limit</div>
            {loading ? (
              <AppSpinner className="tw:w-6 tw:h-6" />
            ) : (
              <Amount
                value={data?.paylaterInfo?.creditLimit || 0}
                className="tw:font-bold tw:text-base"
              />
            )}
          </div>

          <div className="tw:flex tw:flex-col tw:items-start">
            <div className="tw:text-xs tw:text-gray-500">Used Limit</div>
            {loading ? (
              <AppSpinner className="tw:w-6 tw:h-6" />
            ) : (
              <Amount
                value={data?.paylaterInfo?.totalPayableAmount || 0}
                className="tw:font-bold tw:text-base tw:text-orange-500"
              />
            )}
          </div>

          <div className="tw:flex tw:flex-col tw:items-start">
            <div className="tw:text-xs tw:text-gray-500">Available Limit</div>
            {loading ? (
              <AppSpinner className="tw:w-6 tw:h-6" />
            ) : (
              <Amount
                value={data?.paylaterInfo?.creditAvailable || 0}
                className="tw:font-bold tw:text-base tw:text-orange-500"
              />
            )}
          </div>
        </div>

        <Divider className="tw:!my-2" />

        <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:text-xs tw:text-slate-600">
          <div className="tw:flex tw:flex-col tw:gap-1 tw:text-xs tw:text-slate-600">
            <span>Validity Period</span>{" "}
            <span className="tw:font-bold">
              {data?.paylaterInfo?.validityPeriod || "-"}
            </span>
          </div>
          <div className="tw:flex tw:flex-col tw:gap-1 tw:text-xs tw:text-slate-600">
            <div>
              <span>Expires on</span>{" "}
            </div>

            {data?.paylaterInfo?.validityEndDate ? (
              <div className="tw:flex tw:items-center tw:gap-1">
                <DateFormat
                  value={data?.paylaterInfo?.validityEndDate}
                  formatStr="dd MMM yyyy"
                  className="tw:font-bold"
                />
              </div>
            ) : (
              "-"
            )}
          </div>
        </div>
      </>
    </div>
  );
};

export default CurrentWalletStatus;
