import React, { useEffect, useState } from "react";
import { RefreshCw, FileText } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import clsx from "clsx";
import FranchiseService from "~/services/FranchiseService";
import AuthService from "~/services/AuthService";
import { useTranslation } from "react-i18next";
import useAppNav from "~/hooks/useAppNav";

const WalletBalance: React.FC = () => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = AuthService.getLoggedInUser();
  const userName = user?.name || "Wallet";

  // Get franchise ID from current user
  const getFranchiseId = () => {
    return AuthService.getLoggedInUserId(true);
  };

  // Fetch balance from API
  const fetchBalance = async () => {
    const fid = getFranchiseId();
    if (!fid) {
      setError(t("franchiseIdNotFound"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await FranchiseService.getBalance(fid);

      if (response.statusCode === 200) {
        setBalance(response.balance || 0);
      } else {
        setError(t("failedToFetchBalance"));
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
      setError(t("errorFetchingBalance"));
    } finally {
      setLoading(false);
    }
  };

  // Fetch balance on component mount
  useEffect(() => {
    fetchBalance();
  }, []);

  const handleRefresh = () => {
    fetchBalance();
  };

  const handleViewStatement = () => {
    appNav.to("/dashboard/accounts/sk-statement");
  };

  return (
    <AppCard
      className="tw:bg-white tw:border-2 tw:border-blue-200 tw:shadow-sm"
      noPadding
    >
      <div className="tw:flex tw:flex-col tw:sm:flex-row tw:items-start tw:sm:items-center tw:justify-between tw:gap-2 tw:p-4">
        {/* Balance Display */}
        <div className="tw:flex-1 tw:min-w-0 tw:w-full tw:sm:w-auto">
          <div className="tw:text-xs tw:text-gray-600 tw:font-semibold tw:mb-0.5 tw:uppercase">
            &quot;{userName}&quot; {t("balance")}
          </div>
          <div className="tw:font-bold tw:text-gray-900 tw:break-words">
            {loading ? (
              <div className="tw:flex tw:items-center tw:gap-1.5">
                <RefreshCw className="tw:w-4 tw:h-4 tw:animate-spin tw:text-blue-600" />
                <span className="tw:text-base tw:text-gray-600">
                  {t("loading")}
                </span>
              </div>
            ) : error ? (
              <div className="tw:text-sm tw:text-red-600 tw:font-normal">
                {error}
              </div>
            ) : (
              <Amount
                value={balance}
                decimalPlaces={2}
                className="tw:text-xl tw:sm:text-2xl tw:text-green-700"
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:flex-shrink-0 tw:w-full tw:sm:w-auto">
          <AppButton
            onClick={handleViewStatement}
            size="small"
            color="primary"
            fill="outline"
            title={t("viewStatement")}
          >
            <FileText className="tw:w-4 tw:h-4" />
            <span className="tw:text-xs">{t("statement")}</span>
          </AppButton>

          <AppButton
            onClick={handleRefresh}
            size="small"
            color="light"
            fill="outline"
            disabled={loading}
            title={t("refresh")}
          >
            <RefreshCw
              className={clsx(
                "tw:w-4 tw:h-4",
                loading && "tw:animate-spin tw:text-blue-600"
              )}
            />
            <span className="tw:text-xs">{t("refresh")}</span>
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
};

export default WalletBalance;
