import clsx from "clsx";
import { RefreshCw } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";

const WalletBalance: React.FC = () => {
  const { t } = useTranslation(["common"]);

  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  // Get franchise ID from current user
  const getFranchiseId = () => {
    return AuthService.getLoggedInUserId(true);
  };

  // Fetch balance from API
  const fetchBalance = async () => {
    const fid = getFranchiseId();

    // Get user name
    const user = AuthService.getLoggedInUser();
    if (user?.name) {
      setUserName(user.name);
    }

    if (!fid) {
      setError(t("franchiseIdNotFound") || "Franchise ID not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await FranchiseService.getBalance(fid);

      if (response.statusCode === 200) {
        setBalance(response.balance || 0);
      } else {
        setError(t("failedToFetchBalance") || "Failed to fetch balance");
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
      setError(t("errorFetchingBalance") || "Error fetching balance");
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

  return (
    <AppCard noPadding className="tw:mb-4 tw:border-l-4 tw:border-l-primary">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:p-3 tw:md:p-4">
        <div className="tw:min-w-0">
          <span className="tw:block tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-muted-foreground">
            {t("skWalletBalance")}
          </span>
          <div className="tw:mt-1 tw:text-2xl tw:font-bold tw:text-foreground">
            {loading ? (
              <RefreshCw className="tw:w-5 tw:h-5 tw:animate-spin tw:text-primary" />
            ) : error ? (
              <span className="tw:text-sm tw:font-normal tw:text-destructive">
                {error}
              </span>
            ) : (
              <Amount value={balance} decimalPlaces={2} />
            )}
          </div>
          {userName && (
            <span className="tw:block tw:text-xs tw:text-muted-foreground tw:mt-0.5">
              {t("hello") || "Hello"}{" "}
              <span className="tw:font-medium">{userName}</span>
            </span>
          )}
        </div>
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
              loading && "tw:animate-spin"
            )}
          />
        </AppButton>
      </div>
    </AppCard>
  );
};

export default WalletBalance;
