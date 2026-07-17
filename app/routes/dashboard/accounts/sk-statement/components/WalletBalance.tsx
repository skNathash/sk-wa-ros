import clsx from "clsx";
import { RefreshCw } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
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
      setError("Franchise ID not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await FranchiseService.getBalance(fid);

      if (response.statusCode === 200) {
        setBalance(response.balance || 0);
      } else {
        setError("Failed to fetch balance");
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
      setError("Error fetching balance");
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
    <InfoBlock variant="info" size="sm" bordered>
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <div>
          Hello <span className="tw:font-semibold">{userName}</span>, your
          wallet balance with StoreKing is{" "}
          <span className="tw:font-semibold">
            {loading ? (
              <RefreshCw className="tw:inline tw:w-3 tw:h-3 tw:animate-spin" />
            ) : error ? (
              <span className="tw:text-red-500">{error}</span>
            ) : (
              <Amount value={balance} decimalPlaces={2} />
            )}
          </span>
        </div>
        <AppButton
          onClick={handleRefresh}
          size="small"
          color="light"
          fill="clear"
          disabled={loading}
          className="tw:p-1 tw:h-auto tw:min-h-0"
          title={t("refresh")}
        >
          <RefreshCw
            className={clsx(
              "tw:w-3.5 tw:h-3.5 tw:text-gray-500",
              loading && "tw:animate-spin"
            )}
          />
        </AppButton>
      </div>
    </InfoBlock>
  );
};

export default WalletBalance;
