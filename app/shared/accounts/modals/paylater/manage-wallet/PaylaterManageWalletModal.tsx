import { CreditCard, Settings } from "lucide-react";
import React, { useEffect, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import CurrentWalletStatus from "./components/CurrentWalletStatus";
import WalletLimit from "./components/WalletLimit";
import WalletStatus from "./components/WalletStatus";
import PaylaterService from "~/services/PaylaterService";
import AuthService from "~/services/AuthService";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";

type Props = {
  show: boolean;
  callback: (args: { action: "close" | "submit"; data?: any }) => void;
  userId: string;
  routeType?: string;
};

const tabs: TabItem[] = [
  { name: "Manage Wallet Status", key: "wallet-status", icon: <Settings /> },
  { name: "Manage Wallet Limit", key: "wallet-limit", icon: <CreditCard /> },
];

const PaylaterManageWalletModal: React.FC<Props> = ({
  show,
  callback,
  userId = "",
  routeType,
}) => {
  const [activeTab, setActiveTab] = useState("wallet-status");

  const [details, setDetails] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  const fetchRequest = async () => {
    setLoading(true);
    const response = await PaylaterService.getRequests({
      filter: {
        "userInfo.id": userId,
        "franchiseInfo.id": AuthService.getLoggedInUserId(),
      },
    });
    const d = response.data?.data?.[0] || null;
    setDetails(d);
    setLoading(false);
  };

  useEffect(() => {
    if (show) {
      fetchRequest();
      setActiveTab(tabs[0].key);
    }
  }, [show]);

  const handleClose = () => {
    callback({
      action: "close",
      data: {
        ...details,
        status: details?.status,
        limit: details?.limit,
        validityPeriod: details?.validityPeriod,
      },
    });
  };

  const walletStatusCb = (args: { action: "submit" | "close"; data?: any }) => {
    if (args.action === "submit") {
      setDetails({ ...details, status: args.data?.status });
      fetchRequest();
      setRefreshKey((k) => k + 1);
    }
  };

  const walletLimitCb = (args: { action: "submit" | "close"; data?: any }) => {
    if (args.action === "submit") {
      setDetails({
        ...details,
        creditLimit: args.data?.limit ?? args.data?.creditLimit,
        validityPeriod: args.data?.validityPeriod,
      });
      fetchRequest();
      setRefreshKey((k) => k + 1);
    }
  };

  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:h-[95vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-bold">Manage Paylater Wallet</div>
        <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
          Set Paylater limit, validity period, and manage wallet status for
          &quot;
          {details?.userInfo?.name}&quot;
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[80vh]">
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
            <AppSpinner />
          </div>
        ) : !details ? (
          <NoData />
        ) : (
          <>
            <CurrentWalletStatus
              userId={userId}
              show={show}
              name={details?.userInfo?.name}
              routeType={routeType}
              refreshKey={refreshKey}
            />

            <AppTab
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              className="tw:mb-4"
            />

            {activeTab === "wallet-status" && (
              <WalletStatus
                status={details?.status}
                userId={userId}
                callback={walletStatusCb}
                requestId={details?._id}
                routeType={routeType}
              />
            )}

            {activeTab === "wallet-limit" && (
              <WalletLimit
                limit={details?.creditLimit || 0}
                validityPeriod={details?.validityPeriod || "30"}
                userId={userId}
                callback={walletLimitCb}
                requestId={details?._id}
                routeType={routeType}
              />
            )}
          </>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default PaylaterManageWalletModal;
