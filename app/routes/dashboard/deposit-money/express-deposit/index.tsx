import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { SUPPORT_WHATSAPP_NUMBER } from "~/constants";
import AccountService from "~/services/AccountService";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";

const ExpressDepositPage = () => {
  const [hostData, setHostData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const franchiseId = AuthService.getLoggedInUserId(true);
        const resp = await AccountService.getHostToHostData({ franchiseId });
        setHostData(resp.data || []);
      } catch (e) {
        setHostData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleContactSupport = () => {
    const msg = `Hi StoreKing Support, I cannot see Express Deposit / Host-to-Host bank details in my account. Please enable this service for my account.`;
    const url = CommonService.prepareWhatsappMessage(
      msg,
      SUPPORT_WHATSAPP_NUMBER
    );
    CommonService.windowOpenHandler(url, () => {});
  };
  return (
    <>
      <AppHeader title="Express Deposit" showCart={false} />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbsData} className="tw:mb-4" />
          {/* Inlined HostToHostModal content (modal wrapper removed) */}
          {loading ? (
            <div className="tw:text-center tw:py-8">
              <AppSpinner />
            </div>
          ) : (
            <>
              {hostData.length > 0 && (
                <AppCard>
                  <div className="tw:text-lg tw:font-bold tw:mb-2 tw:pb-4">
                    Express Deposit: Exclusive Bank Account Number for You!
                  </div>
                  <InfoBlock size="sm" bordered>
                    Please transfer the exact amount to one of the bank accounts
                    listed below using IMPS, NEFT, or RTGS from your bank. Once
                    the transfer is completed to the specified account, your
                    StoreKing balance will be updated automatically. Ensure you
                    enter the correct amount and account number as shown below.
                  </InfoBlock>
                </AppCard>
              )}

              {/* Separate card for listing available banks from hosttohost data */}
              <AppCard title="Available Bank Accounts">
                {hostData?.length ? (
                  hostData.map((item: any, idx: number) => (
                    <div
                      key={`${item.accountNumber}-${item.ifscCode}-${idx}`}
                      className="tw:grid tw:gap-2 tw:mb-4 tw:border-b tw:border-gray-200 tw:pb-4 tw:last:border-b-0"
                    >
                      <div className="tw:text-base tw:font-bold">
                        {item.name}
                      </div>
                      <div className="tw:grid tw:gap-2 tw:grid-cols-2">
                        <KeyValue label="Deposit Account Number" size="sm">
                          {item.accountNumber}
                        </KeyValue>
                        <KeyValue label="IFSC Code" size="sm">
                          {item.ifscCode}
                        </KeyValue>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="tw:py-4">
                    {/* When host-to-host data is not available, show helpful message + contact support CTA */}
                    <div className="tw:text-lg tw:font-bold tw:mb-2">
                      Service not enabled
                    </div>
                    <div className="tw:mb-4 tw:text-sm tw:text-gray-600">
                      It looks like Express Deposit (host-to-host) is not
                      enabled for your account. To enable this service, please
                      contact our support team and they will assist you.
                    </div>
                    <div>
                      <AppButton color="success" onClick={handleContactSupport}>
                        Contact Support
                      </AppButton>
                    </div>
                  </div>
                )}
              </AppCard>

              <AppCard title="Express Deposits">
                {points1.map((point, index) => (
                  <div key={index} className="tw:flex tw:gap-2 tw:mb-4">
                    <CheckCircle className="tw:text-green-500 tw:mt-1 tw:w-4 tw:h-4" />
                    <span className="tw:text-sm tw:font-medium tw:flex-1">
                      {point}
                    </span>
                  </div>
                ))}
              </AppCard>

              <AppCard title="Time Taken for Amount to Reflect in your Account">
                {points2.map((point, index) => (
                  <div key={index} className="tw:flex tw:gap-2 tw:mb-4">
                    <CheckCircle className="tw:text-green-500 tw:mt-1 tw:w-4 tw:h-4" />
                    <span className="tw:text-sm tw:font-medium tw:flex-1">
                      {point}
                    </span>
                  </div>
                ))}
              </AppCard>

              <AppCard title="IMPORTANT NOTE">
                {points3.map((point, index) => (
                  <div key={index} className="tw:flex tw:gap-2 tw:mb-4">
                    <CheckCircle className="tw:text-green-500 tw:mt-1 tw:w-4 tw:h-4" />
                    <span className="tw:text-sm tw:font-medium tw:flex-1">
                      {point}
                    </span>
                  </div>
                ))}
              </AppCard>
            </>
          )}
        </div>
      </div>
    </>
  );
};

const points1 = [
  "StoreKing Launches Express Deposit, Get Instant Credit into your StoreKing Account.",
  "Transfer Money to above Exclusive Bank Account and Get your Balance Updated Immediately.",
  "No more waiting for long hours to get your Money into your Storeking Balance.",
  "Transfers Money through IMPS and get Instant Credit even on Bank Holidays.",
  "Do an IMPS / NEFT / RTGS from your Bank and Get Instant Credit. ",
  "No Need to 'Make Deposit' in StoreKing App if Amount transferred to Above Exclusive Bank Accounts.",
];

const points2 = [
  "IMPS Transfers: Approximate Time 10 minutes.",
  "NEFT Transfers: Approximate Time 2 hours.",
  "RTGS Transfers: Approximate Time 2 hours",
];

const points3 = [
  "CASH Deposit is not accepted to this account, Only IMPS / NEFT / RTGS is allowed.",
  "Every Retailer has a Different Account Number, Do not Transfer Money to Account Number given by other Retailer or Sales Team.",
];

export default ExpressDepositPage;

const breadcrumbsData: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Account Statement",
    redirect: {
      path: "/dashboard/accounts/sk-statement?tab=sk-statement",
    },
  },
  {
    label: "Express Deposit",
  },
];
