import { Copy, Info, InfoIcon, Landmark, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import AccountService from "~/services/AccountService";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import UpiQrCode from "../storeking/components/UpiQrCode";
import PlatformFeePlan from "./components/PlatformFeePlan";
import WalletBalance from "./components/WalletBalance";

const DepositOptionsPage = () => {
  const { t } = useTranslation();
  const appNav = useAppNav();
  const appToast = useAppToast();
  const dynamicUpi = CommonService.isDynamicUpiEnabled();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");
  const topupPlan = searchParams.get("topup-plan");

  const [hostData, setHostData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accHolderName, setAccHolderName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (AuthService.isManpowerLoggedIn()) {
          const m = AuthService.getManpower();
          setAccHolderName(m?.franchiseInfo?.name || "");
        } else {
          const u = AuthService.getLoggedInUser();
          setAccHolderName(u?.name || "");
        }

        const franchiseId = AuthService.getLoggedInUserId(true);
        const resp = await AccountService.getHostToHostData({ franchiseId });
        const raw = resp.data || [];
        // Normalize bank names based on IFSC and fallback values
        const formatted = raw.map((b: any) => {
          const ifsc = (b.ifscCode || "").toString().toLowerCase();
          let name = b.name || "";

          // If IFSC starts with hdfc, force name to HDFC
          if (ifsc.startsWith("hdfc")) {
            name = "HDFC";
          }

          return {
            ...b,
            name,
          };
        });

        setHostData(formatted);
      } catch (e) {
        setHostData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    CommonService.copyToClipboard(text);
    appToast.show({
      color: "success",
      msg: `${label} copied to clipboard`,
    });
  };

  return (
    <>
      <AppHeader title={t("depositOptions")} showCart={false} />
      <div className="app-page tw:p-3 page-bg">
        <div className="app-container">
          <div className="tw:flex tw:justify-between tw:items-center tw:mb-3">
            <AppBreadcrumbs data={breadcrumbsData} className="tw:mb-0!" />
          </div>

          {/* Wallet Balance */}
          <WalletBalance />
          <PlatformFeePlan highlight={topupPlan === "1"} />

          {/* {from === "platform-fee" && (
            <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:p-3 tw:mb-3 tw:flex tw:items-center tw:justify-between">
              <div className="tw:flex tw:items-center tw:gap-2">
                <InfoIcon
                  size={16}
                  className="tw:text-blue-600 tw:flex-shrink-0"
                />
                <div>
                  <h3 className="tw:font-semibold tw:text-blue-900 tw:text-sm tw:mb-0.5">
                    Platform Fee Payment
                  </h3>
                  <p className="tw:text-xs tw:text-blue-700 tw:mb-0">
                    Please complete the payment for the platform fee.
                  </p>
                </div>
              </div>
              <button
                onClick={() => appNav.to("/user/my-profile", { view: "plans" })}
                className="tw:bg-blue-600 tw:text-white tw:px-3 tw:py-1.5 tw:rounded-md tw:text-xs tw:font-medium tw:hover:bg-blue-700 tw:transition-colors tw:flex-shrink-0"
              >
                Go to Plans
              </button>
            </div>
          )} */}

          {/* Common explanation block */}
          <div className="tw:bg-gradient-to-r tw:from-blue-50 tw:to-green-50 tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:mb-3">
            <div className="tw:flex tw:items-start tw:gap-3">
              <InfoIcon
                size={20}
                className="tw:text-blue-600 tw:flex-shrink-0 tw:mt-0.5"
              />
              <div>
                <h3 className="tw:font-bold tw:text-gray-900 tw:text-sm tw:mb-1.5">
                  {t("howToAddMoney")}
                </h3>
                <div className="tw:space-y-1.5 tw:text-xs tw:text-gray-700">
                  <p className="tw:mb-0">{t("storeKingPayDescription")}</p>
                  <p className="tw:mb-0">{t("bankDepositsDescription")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-3">
            {/* Left Column: UPI / StoreKing Pay */}
            {dynamicUpi.status && (
              <AppCard className="tw:h-full tw:flex tw:flex-col !tw:p-4">
                <div className="tw:flex tw:items-center tw:gap-3 tw:mb-4 tw:border-b tw:border-dashed tw:border-gray-200 tw:pb-3">
                  <div className="tw:p-1.5 tw:bg-blue-50 tw:text-blue-600 tw:rounded-lg">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h3 className="tw:font-bold tw:text-gray-900 tw:text-base">
                      {t("storeKingPay")}
                    </h3>
                    <p className="tw:text-xs tw:text-gray-500">
                      {t("instantTopUpViaUpi")}
                    </p>
                  </div>
                </div>

                <div className="tw:flex tw:flex-col tw:items-center">
                  <div className="tw:mb-4">
                    <UpiQrCode vpa={dynamicUpi.vpa} size={160} />
                  </div>

                  <div className="tw:w-full tw:flex tw:items-center tw:justify-between tw:gap-3 tw:mb-2">
                    <div className="tw:overflow-hidden">
                      <div className="tw:text-[10px] tw:text-gray-500 tw:uppercase tw:font-semibold tw:mb-0.5">
                        {t("upiIdLabel")}
                      </div>
                      <div className="tw:text-sm tw:font-bold tw:text-gray-900 tw:truncate">
                        {dynamicUpi.vpa}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(dynamicUpi.vpa, "UPI ID")}
                      className="tw:p-1.5 tw:hover:bg-gray-50 tw:rounded-md tw:transition-colors tw:text-blue-600"
                      title="Copy UPI ID"
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <div className="tw:mt-2 tw:text-[10px] tw:text-center tw:text-gray-500 tw:flex tw:items-center tw:gap-1.5 tw:bg-blue-50 tw:text-blue-700 tw:px-2.5 tw:py-1 tw:rounded-full">
                    <InfoIcon size={12} />
                    {t("useUpiApps")}
                  </div>

                  <div className="tw:mt-1.5 tw:text-[10px] tw:text-center tw:text-orange-700 tw:flex tw:items-center tw:gap-1.5 tw:bg-orange-50 tw:px-2.5 tw:py-1 tw:rounded-full">
                    <InfoIcon size={12} />
                    {t("maxTopUpNote")}
                  </div>
                </div>
              </AppCard>
            )}

            {/* Right Column: Host-to-Host (Bank Deposits) */}
            <div className="tw:flex tw:flex-col tw:gap-3">
              <div className="tw:bg-white tw:rounded-xl tw:border tw:border-gray-200 tw:flex-1 tw:p-4">
                <div className="tw:flex tw:items-center tw:gap-3 tw:mb-4 tw:border-b tw:border-dashed tw:border-gray-200 tw:pb-3">
                  <div className="tw:p-1.5 tw:bg-green-50 tw:text-green-600 tw:rounded-lg">
                    <Landmark size={20} />
                  </div>
                  <div>
                    <h3 className="tw:font-bold tw:text-gray-900 tw:text-base">
                      {t("bankDeposits")}
                    </h3>
                    <p className="tw:text-xs tw:text-gray-500">
                      {t("neftImpsRtgsTransfers")}
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="tw:py-8 tw:flex tw:justify-center">
                    <AppSpinner />
                  </div>
                ) : hostData.length > 0 ? (
                  <div className="tw:space-y-3">
                    <div className="tw:text-xs tw:text-gray-500 tw:flex tw:gap-2 tw:bg-gray-50 tw:p-2.5 tw:rounded-lg">
                      <Info size={14} className="tw:text-blue-500 tw:min-w-4" />
                      <span className="tw:text-[11px] tw:leading-tight">
                        {t("transferExactAmountNote")}
                      </span>
                    </div>
                    {hostData.map((bank, idx) => (
                      <div
                        key={idx}
                        className="tw:relative tw:bg-white tw:rounded-xl tw:p-3 tw:border tw:border-gray-200"
                      >
                        <div className="tw:absolute tw:top-0 tw:right-0 tw:bg-green-100 tw:text-green-800 tw:text-[9px] tw:font-bold tw:px-2 tw:py-0.5 tw:rounded-bl-lg tw:rounded-tr-lg">
                          {t("virtualAccount")}
                        </div>
                        <div className="tw:flex tw:items-start tw:justify-between tw:mb-3">
                          <div className="tw:flex tw:items-center tw:gap-2.5">
                            <div className="tw:bg-gray-50 tw:p-1.5 tw:rounded-lg tw:border tw:border-gray-100 tw:text-green-700">
                              <Landmark size={18} />
                            </div>
                            <div>
                              <h4 className="tw:font-bold tw:text-gray-900 tw:text-sm">
                                {bank.name || t("storeKingBank")}
                              </h4>
                              {accHolderName && (
                                <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
                                  {t("accountName")}{" "}
                                  <span className="tw:font-medium tw:text-gray-900">
                                    {accHolderName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="tw:grid tw:grid-cols-1 tw:gap-2.5">
                          <div className="tw:bg-gray-50 tw:p-2.5 tw:rounded-lg tw:border tw:border-gray-100 tw:flex tw:items-center tw:justify-between">
                            <div>
                              <div className="tw:text-[9px] tw:text-gray-500 tw:uppercase tw:font-semibold">
                                {t("accountNumber")}
                              </div>
                              <div className="tw:text-base tw:font-mono tw:font-bold tw:text-gray-900 tw:tracking-wider">
                                {bank.accountNumber || bank.acNumber}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  bank.accountNumber || bank.acNumber,
                                  t("accountNumber")
                                )
                              }
                              className="tw:bg-white tw:text-green-700 hover:tw:bg-green-50 tw:px-2.5 tw:py-1 tw:rounded tw:border tw:border-green-200 tw:transition-colors tw:text-[10px] tw:font-bold tw:flex tw:items-center tw:gap-1"
                            >
                              <Copy size={10} />
                              COPY
                            </button>
                          </div>

                          <div className="tw:grid tw:grid-cols-2 tw:gap-2.5">
                            <div className="tw:bg-gray-50 tw:p-2 tw:px-2.5 tw:rounded-lg tw:border tw:border-gray-100">
                              <div className="tw:text-[9px] tw:text-gray-500 tw:uppercase tw:font-semibold">
                                IFSC Code
                              </div>
                              <div className="tw:flex tw:items-center tw:justify-between">
                                <span className="tw:text-xs tw:font-bold tw:text-gray-900">
                                  {bank.ifscCode || bank.ifsc}
                                </span>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      bank.ifscCode || bank.ifsc,
                                      "IFSC"
                                    )
                                  }
                                  className="tw:text-gray-400 hover:tw:text-green-600 tw:transition-colors"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            </div>
                            {(bank.branch || bank.branchName) && (
                              <div className="tw:bg-gray-50 tw:p-2 tw:px-2.5 tw:rounded-lg tw:border tw:border-gray-100">
                                <div className="tw:text-[9px] tw:text-gray-500 tw:uppercase tw:font-semibold">
                                  Branch
                                </div>
                                <div className="tw:text-xs tw:font-medium tw:text-gray-900 tw:truncate">
                                  {bank.branch || bank.branchName}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="tw:text-center tw:text-gray-500 tw:py-4">
                    <p>Express Deposit details not available.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const breadcrumbsData: BreadcrumbItem[] = [
  {
    label: "dashboard",
    redirect: {
      path: "/dashboard",
    },
    langKey: "dashboard",
  },
  {
    label: "paymentOptions",
    langKey: "paymentOptions",
  },
];

export default DepositOptionsPage;
