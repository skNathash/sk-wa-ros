import React, { useEffect, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import LoyaltyPointService from "~/services/LoyaltyPointService";

type BasicInfoProps = {
  customerId?: string;
};

const BasicInfo = ({ customerId }: BasicInfoProps) => {
  const [balance, setBalance] = useState<{
    available: number;
    totalEarned: number;
    totalRedeemed: number;
  }>({ available: 0, totalEarned: 0, totalRedeemed: 0 });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchPoints = async () => {
      if (!customerId) {
        setBalance({ available: 0, totalEarned: 0, totalRedeemed: 0 });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const resp = await LoyaltyPointService.getHolderPoints(
          "Customer",
          customerId,
        );

        setBalance({
          available: resp?.available || 0,
          totalEarned: resp?.totalEarned || 0,
          totalRedeemed: resp?.totalRedeemed || 0,
        });
      } catch (err) {
        setBalance({ available: 0, totalEarned: 0, totalRedeemed: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
  }, [customerId]);

  return (
    <AppCard title="King Coins" subtitle="">
      <div className="tw:flex tw:flex-col tw:gap-4">
        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:py-6">
            <AppSpinner />
          </div>
        ) : (
          <>
            <div className="tw:bg-gradient-to-r tw:from-pink-50 tw:to-sky-50 tw:rounded-md tw:p-6 tw:text-center">
              <div className="tw:text-4xl tw:font-bold tw:text-purple-600">
                {balance.available}
              </div>
              <div className="tw:text-sm tw:text-gray-500">
                Available King Coins
              </div>
            </div>

            <div className="tw:border-t tw:pt-3">
              <div className="tw:flex tw:items-center tw:justify-between tw:py-2">
                <div className="tw:text-sm tw:text-gray-600">Total Earned:</div>
                <div className="tw:text-sm tw:font-medium">
                  {balance.totalEarned}
                </div>
              </div>
              <div className="tw:flex tw:items-center tw:justify-between tw:py-2">
                <div className="tw:text-sm tw:text-gray-600">
                  Total Redeemed:
                </div>
                <div className="tw:text-sm tw:font-medium">
                  {balance.totalRedeemed}
                </div>
              </div>
              <div className="tw:flex tw:items-center tw:justify-between tw:pt-2 tw:border-t">
                <div className="tw:text-sm tw:text-gray-600">
                  Current Balance:
                </div>
                <div className="tw:text-sm tw:font-semibold tw:text-purple-600">
                  {balance.available}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppCard>
  );
};

export default BasicInfo;
