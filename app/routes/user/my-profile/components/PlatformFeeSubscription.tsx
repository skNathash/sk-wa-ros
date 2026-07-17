import { format } from "date-fns";
import { CheckCircle, Loader2, Tag, Eye } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SwiperOptions } from "swiper/types";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import useAppToast from "~/hooks/useAppToast";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import { AuthService } from "~/services/AuthService";
import { History, Wallet } from "lucide-react";
import clsx from "clsx";
import TermsModal from "~/modals/core/terms-modal/TermsModal";
import ActivePlatformFeeModal from "~/shared/catalog/modals/active-platform-fee/ActivePlatFormFeeModal";

interface ServiceFeePlan {
  _id: string;
  title?: string;
  refId?: string;
  subscriptionAmount: number; // maps to previous `amount`
  planDurationDays: number; // maps to previous `validityInDays`
  purchaseValue?: number;
  name?: string;
  description?: string;
  isActive?: boolean;
  amountTo?: number;
}

interface ActiveSubscription {
  _id: string;
  planId: string; // should match plan._id
  planName?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  amountTo?: number;
  totalLimit?: number;
  availableAmount?: number;
  daysLeft?: number;
}

const swiperConfig: SwiperOptions = {
  slidesPerView: 1.2,
  spaceBetween: 12,
  centeredSlides: false,
  slidesOffsetAfter: 16,
  breakpoints: {
    768: { slidesPerView: 2, spaceBetween: 12 },
    1024: { slidesPerView: 3, spaceBetween: 16 },
  },
};

const PlatformFeeSubscription: React.FC = () => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const [termsModal, setTermsModal] = useState<{
    show: boolean;
    title: string;
  }>({ show: false, title: "" });

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<ServiceFeePlan[]>([]);
  const [activeSubscription, setActiveSubscription] =
    useState<ActiveSubscription | null>(null);

  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [agreedTerms, setAgreedTerms] = useState<Record<string, boolean>>({});
  const [appAlertDialog, setAppAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });
  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const appNav = useAppNav();
  const [showActivePlanModal, setShowActivePlanModal] = useState(false);

  const redirectToDepositMoney = () => {
    appNav.to("/dashboard/deposit-money/options?from=platform-fee");
  };

  const init = () => {
    fetchData();
    fetchBalance();
  };

  useEffect(() => {
    init();
  }, []);

  const fetchBalance = async () => {
    const fid = AuthService.getLoggedInUserId(true);
    if (!fid) return;
    setLoadingBalance(true);
    try {
      const response = await FranchiseService.getBalance(fid);
      if (response && response.statusCode === 200) {
        setBalance(response.balance || 0);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const plansRes = await FranchiseService.fetchServiceFeePlan({
        page: 1,
        limit: 100,
        filter: {
          isActive: true,
        },
      });

      if (plansRes?.data?.data) {
        const raw = Array.isArray(plansRes.data.data) ? plansRes.data.data : [];
        // sort plans by amountTo ascending (low to high)
        const sorted = (raw as ServiceFeePlan[]).slice().sort((a, b) => {
          const va = a.amountTo ?? a.purchaseValue ?? 0;
          const vb = b.amountTo ?? b.purchaseValue ?? 0;
          return va - vb;
        });
        setPlans(sorted);
      }

      // Fetch active subscription using FranchiseService.getActivePlan
      try {
        const activePlanData = await FranchiseService.getActivePlan();
        if (activePlanData) {
          const activeSub: ActiveSubscription = {
            _id: activePlanData.planId || "",
            planId: activePlanData.planId || "",
            planName: activePlanData.planName || "",
            startDate: activePlanData.planStartAt,
            endDate: activePlanData.planEndAt,
            status: activePlanData.isPlanActive ? "Active" : "Expired",
            availableAmount: activePlanData.availableAmount,
            daysLeft: activePlanData.remainingDays,
          };
          setActiveSubscription(activeSub);
        } else {
          setActiveSubscription(null);
        }
      } catch (e) {
        console.warn("Could not fetch active plan:", e);
        setActiveSubscription(null);
      }
    } catch (error) {
      console.error("Error fetching platform fee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: ServiceFeePlan) => {
    if (!agreedTerms[plan._id]) {
      appToast.show({
        msg: "Please agree to the terms and conditions",
        color: "warning",
      });
      return;
    }
    // Show confirmation dialog before subscribing
    setAppAlertDialog({
      show: true,
      title: "Subscribe to Plan",
      description: `Are you sure you want to subscribe to "${
        plan.title
      }" for ₹${CommonService.commaSeparated(plan.subscriptionAmount)}?`,
      onConfirm: async () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        await new Promise((r) => setTimeout(r, 200));
        setSubscribingId(plan._id);
        try {
          // Check wallet balance before calling subscribe API
          try {
            const fid = AuthService.getLoggedInUserId(true);
            if (fid) {
              const balResp: any = await FranchiseService.getBalance(fid);
              const available = (balResp && balResp.balance) || 0;
              if (available < (plan.subscriptionAmount || 0)) {
                appToast.show({
                  msg: "Insufficient wallet balance. Please add money to your wallet.",
                  color: "warning",
                });
                setSubscribingId(null);
                return;
              }
            }
          } catch (err) {
            console.warn(
              "Could not validate wallet balance before subscribing:",
              err
            );
            // fallback: proceed to attempt subscription if balance check fails silently
          }

          const response = await FranchiseService.subscribeServiceFeePlan({
            planId: plan._id,
          });

          if (response?.data?.success || response?.statusCode === 200) {
            appToast.show({ msg: "Subscribed successfully", color: "success" });
            init(); // Refresh data and balance to show active plan and updated wallet
          } else {
            appToast.show({
              msg: response?.data?.message || "Failed to subscribe",
              color: "danger",
            });
          }
        } catch (error: any) {
          appToast.show({
            msg: error?.message || "Something went wrong",
            color: "danger",
          });
        } finally {
          setSubscribingId(null);
        }
      },
      onCancel: () => setAppAlertDialog((prev) => ({ ...prev, show: false })),
    });
  };

  const toggleTerms = (planId: string) => {
    setAgreedTerms((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const isPlanActive = (planId: string) => {
    if (!activeSubscription) return false;
    // Check if subscription is active and matches planId
    return (
      activeSubscription.planId === planId &&
      activeSubscription.status === "Active"
    );
  };

  const termsModalCb = () => {
    setTermsModal({ show: false, title: "" });
  };

  if (loading && plans.length === 0) {
    return (
      <AppCard title={t("Platform Fee Subscription")}>
        <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
          <Loader2 className="tw:w-6 tw:h-6 tw:animate-spin tw:text-gray-500" />
        </div>
      </AppCard>
    );
  }

  // If no plans are available, we might want to hide the component or show empty state
  if (!plans.length && !loading) {
    return null;
  }

  return (
    <AppCard
      title={
        activeSubscription
          ? "Platform Fee - Current Active plan"
          : "Platform Fee - Purchase Plan"
      }
      className="tw:overflow-visible"
      subtitle={
        !activeSubscription ? "Designed to reduce your purchase costs" : ""
      }
      icon={<Tag />}
      noContentPadding
    >
      {activeSubscription && activeSubscription.status === "Active" ? (
        <div className="tw:bg-gradient-to-br tw:from-green-50 tw:to-white tw:border tw:border-green-200 tw:rounded-lg tw:p-3 tw:mb-4 tw:shadow-sm tw:mx-6">
          <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
            <div className="tw:flex tw:items-start tw:gap-2.5 tw:flex-1 tw:min-w-0">
              <div className="tw:p-1.5 tw:bg-green-100 tw:rounded-md tw:flex-shrink-0">
                <CheckCircle className="tw:text-green-600 tw:w-4 tw:h-4" />
              </div>
              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                  <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:leading-tight">
                    {activeSubscription.planName || "Platform Fee Plan"}
                  </h3>
                  <span className="tw:bg-green-600 tw:text-white tw:text-[10px] tw:px-2 tw:py-0.5 tw:rounded-full tw:font-semibold tw:uppercase tw:leading-none">
                    Active
                  </span>
                </div>
                <div className="tw:text-xs tw:text-gray-600 tw:space-y-0.5">
                  <div>
                    Available:{" "}
                    <span className="tw:font-semibold tw:text-green-700">
                      <Amount
                        value={activeSubscription.availableAmount || 0}
                        decimalPlaces={2}
                      />
                    </span>
                  </div>
                  <div>
                    Expires:{" "}
                    {activeSubscription.endDate
                      ? format(
                          new Date(activeSubscription.endDate),
                          "dd MMM yyyy"
                        )
                      : "-"}
                  </div>
                </div>
              </div>
            </div>
            <AppButton
              onClick={() => setShowActivePlanModal(true)}
              size="small"
              fill="clear"
              color="primary"
              className="tw:flex tw:items-center tw:gap-1 tw:flex-shrink-0 tw:text-xs"
            >
              <Eye size={13} />
              <span className="tw:hidden sm:tw:inline">View More</span>
              <span className="sm:tw:hidden">View</span>
            </AppButton>
          </div>
        </div>
      ) : (
        <>
          <div className="tw:px-4 tw:pt-4">
            <div
              className={clsx(
                "tw:flex tw:items-center tw:justify-between tw:p-3 tw:rounded-lg tw:border",
                {
                  "tw:bg-red-50 tw:border-red-100": balance <= 0,
                  "tw:bg-blue-50 tw:border-blue-100": balance > 0,
                }
              )}
            >
              <div className="tw:flex tw:items-center tw:gap-3">
                <div className="tw:p-2 tw:bg-white tw:rounded-full tw:shadow-sm">
                  <Wallet className="tw:w-4 tw:h-4 tw:text-blue-600" />
                </div>
                <div>
                  <div className="tw:text-[10px] tw:text-gray-500 tw:font-medium tw:uppercase tw:tracking-wider">
                    Wallet Balance
                  </div>
                  <div className="tw:text-sm tw:font-bold tw:text-gray-900">
                    {loadingBalance ? (
                      <Loader2 className="tw:w-3 tw:h-3 tw:animate-spin tw:text-gray-400" />
                    ) : (
                      <Amount
                        value={balance}
                        className={balance <= 0 ? "tw:text-red-600" : ""}
                      />
                    )}
                  </div>
                </div>
              </div>
              <AppButton
                size="small"
                color="primary"
                fill="outline"
                className="tw:h-8 tw:px-3"
                onClick={redirectToDepositMoney}
              >
                Deposit Money
              </AppButton>
            </div>
          </div>

          <div className="tw:py-4 tw:ps-4">
            <AppSwiper config={swiperConfig} className="tw:py-2">
              {plans.map((plan) => {
                const isActive = isPlanActive(plan._id);
                const isProcessing = subscribingId === plan._id;
                return (
                  <AppSwiper.Slide key={plan._id} isAutoWidth={false}>
                    <div
                      className={`tw:border tw:rounded-lg tw:p-4 tw:flex tw:flex-col tw:relative tw:transition-all tw:overflow-visible tw:min-h-[220px] ${
                        isActive
                          ? "tw:border-green-500 tw:bg-green-50 tw:shadow-sm"
                          : "tw:border-gray-200 hover:tw:border-blue-300 hover:tw:shadow-md tw:bg-white"
                      }`}
                    >
                      {/* Top badge removed; CURRENT PLAN is shown in action area */}

                      <div className="tw:flex-1">
                        {plan.title && (
                          <h3 className="tw:text-base tw:font-bold tw:text-gray-900 tw:mb-3">
                            {plan.title}
                          </h3>
                        )}
                        <div className="tw:flex tw:items-start tw:gap-2 tw:mb-1">
                          <div className="tw:flex tw:flex-col tw:justify-center tw:mr-2">
                            <span className="tw:text-xs tw:text-gray-500">
                              Platform fee
                            </span>
                            <div className="tw:flex tw:items-baseline tw:gap-0.5">
                              <span className="tw:text-2xl tw:font-bold tw:text-gray-900">
                                ₹
                                {CommonService.commaSeparated(
                                  plan.subscriptionAmount
                                )}
                              </span>
                            </div>
                          </div>
                          <span className="tw:text-sm tw:text-gray-500 tw:self-end">
                            / {plan.planDurationDays} days
                          </span>
                        </div>
                        <p className="tw:text-xs tw:text-gray-500 tw:mb-4">
                          + 18% GST as applicable
                        </p>

                        <div className="tw:space-y-2 tw:mb-4">
                          <div className="tw:flex tw:justify-between tw:text-sm tw:py-1 tw:border-b tw:border-gray-100">
                            <span className="tw:text-gray-600">
                              Purchase Value
                            </span>
                            <span className="tw:font-medium tw:text-gray-900">
                              <span className="tw:text-xs tw:text-gray-500">
                                upto
                              </span>{" "}
                              <Amount value={plan.amountTo || 0} />
                            </span>
                          </div>
                          <div className="tw:flex tw:justify-between tw:text-sm tw:py-1 tw:border-b tw:border-gray-100">
                            <span className="tw:text-gray-600">Validity</span>
                            <span className="tw:font-medium tw:text-gray-900">
                              {plan.planDurationDays} Days
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="tw:mt-auto">
                        {!isActive ? (
                          <>
                            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
                              <input
                                type="checkbox"
                                id={`terms-${plan._id}`}
                                checked={!!agreedTerms[plan._id]}
                                onChange={() => toggleTerms(plan._id)}
                                className="tw:w-4 tw:h-4 tw:text-blue-600 tw:rounded tw:border-gray-300 focus:tw:ring-blue-500"
                              />
                              <label
                                htmlFor={`terms-${plan._id}`}
                                className="tw:text-xs tw:text-gray-600 tw:cursor-pointer"
                              >
                                I agree to the{" "}
                                <span
                                  className="tw:text-blue-600 tw:underline tw:cursor-pointer"
                                  onClick={() =>
                                    setTermsModal({
                                      show: true,
                                      title: plan.title || "",
                                    })
                                  }
                                >
                                  Terms & Conditions
                                </span>
                              </label>
                            </div>
                            {balance < (plan.subscriptionAmount || 0) ? (
                              <div>
                                <div className="tw:text-red-600 tw:text-xs tw:mb-1">
                                  You do not have sufficient balance in your
                                  wallet to subscribe to this plan.
                                </div>
                                <AppButton
                                  className="tw:w-full"
                                  fill="solid"
                                  color="success"
                                  onClick={redirectToDepositMoney}
                                >
                                  Deposit Money
                                </AppButton>
                              </div>
                            ) : (
                              <AppButton
                                className="tw:w-full"
                                fill="solid"
                                color="primary"
                                isLoading={isProcessing}
                                disabled={isProcessing}
                                onClick={() => handleSubscribe(plan)}
                              >
                                Subscribe Now
                              </AppButton>
                            )}
                          </>
                        ) : (
                          <div>
                            <div className="tw:text-center tw:mb-2">
                              <span className="tw:text-green-700 tw:font-medium tw:text-sm">
                                Active until{" "}
                                {activeSubscription?.endDate
                                  ? format(
                                      new Date(activeSubscription.endDate),
                                      "dd MMM yyyy"
                                    )
                                  : "-"}
                              </span>
                            </div>
                            <div className="tw:flex tw:justify-center">
                              <div className="tw:inline-flex tw:items-center tw:gap-1 tw:bg-green-600 tw:text-white tw:text-xs tw:font-bold tw:px-3 tw:py-2 tw:rounded-full">
                                <CheckCircle size={14} />
                                <span>CURRENT PLAN</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </AppSwiper.Slide>
                );
              })}
            </AppSwiper>
          </div>
        </>
      )}
      <div className="tw:mt-1 tw:pb-4 tw:text-[10px] tw:text-gray-500 tw:px-4 tw:italic">
        Note: For total purchases above ₹50,00,000 a fee of 1% + 18% GST will be
        applied on the total purchase amount.
      </div>

      <AppAlertDialog
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        show={appAlertDialog.show}
        onConfirm={appAlertDialog.onConfirm}
        onCancel={appAlertDialog.onCancel}
      />

      <TermsModal
        code={"ROS_PLAN_SUBSCRIBE"}
        show={termsModal.show}
        title={termsModal.title}
        callback={termsModalCb}
      />

      <ActivePlatformFeeModal
        show={showActivePlanModal}
        callback={() => setShowActivePlanModal(false)}
        showViewTransactionButton={true}
      />
    </AppCard>
  );
};

export default PlatformFeeSubscription;
