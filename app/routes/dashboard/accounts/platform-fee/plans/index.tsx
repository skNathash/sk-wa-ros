import clsx from "clsx";
import {
  Loader2,
  Tag,
  Wallet,
  TrendingDown,
  AlertCircle,
  AlertTriangle,
  Gift,
  HelpCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "animate.css";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import TermsModal from "~/modals/core/terms-modal/TermsModal";
import { AuthService } from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import AppTab from "~/components/core/tab/AppTab";
import { Skeleton } from "~/components/ui/skeleton";
import PlatformFeeHiwModal from "~/shared/accounts/platform-fee/modals/PlatformFeeHiwModal";
import { getData, prepareParams } from "./helper";
import ActivePlan from "./components/ActivePlan";
import PlanItem from "./components/PlanItem";
import PercentagePlanItem from "./components/PercentagePlanItem";
import ChangePlanConfirmModal from "./modals/ChangePlanConfirmModal";
import PlanFeeModal from "./modals/PlanFeeModal";
import SubscribeConfirmModal from "./modals/SubscribeConfirmModal";
import SuccessModal from "./SuccessModal";
import PageAccessService from "~/services/PageAccessService";
import MiscService from "~/services/MiscService";
import { redirect } from "react-router";

export async function clientLoader({ request }: { request: Request }) {
  if (
    !PageAccessService.canAccessPage([], {
      allowNoSubscribe: true,
      allowIncompleteProfile: true,
    })
  ) {
    return null;
  }

  // If user came from benefits page (via "View Plans"), skip redirect
  const url = new URL(request.url);
  if (url.searchParams.get("skipBenefits") === "true") {
    return null;
  }

  // Redirect users without an active plan to benefits page first
  const activePlan = FranchiseService.getActivePlanFromLocal();
  if (!activePlan || activePlan?.usedAmount >= activePlan?.limitAmount) {
    throw redirect("/dashboard/accounts/platform-fee/benefits");
  }

  return null;
}

interface ServiceFeePlan {
  _id: string;
  title?: string;
  refId?: string;
  subscriptionAmount: number;
  planDurationDays: number;
  purchaseValue?: number;
  name?: string;
  description?: string;
  isActive?: boolean;
  amountTo?: number;
  percentage?: number;
  taxPercentage?: number;
  type?: "FIXED" | "HYBRID" | "PERCENTAGE" | string;
  typeOfPlan?: string;
  isInclusiveTax?: boolean;
  setupFeeInfo?: {
    value: number;
    isInclusiveTax?: boolean;
    taxPercentage?: number;
  };
  isExistingUser?: boolean;
  operationalFeeId?: string;
  operationalFeesList?: {
    type: string;
    value: number;
    discountPercent: number;
    discountSubscriptionAmount: number;
    isActive: boolean;
    isFree: boolean;
    displayName: string;
    refId: string;
  }[];
}

const plansTabs = [
  {
    key: "HYBRID",
    name: "Hybrid Plan",
    langKey: "platformFee:hybridPlan",
  },
  {
    key: "FIXED",
    name: "Fixed Value Plan",
    langKey: "platformFee:fixedValuePlan",
  },
  {
    key: "PERCENTAGE",
    name: "Percentage Plan",
    langKey: "platformFee:percentagePlan",
  },
];

const PlatformFee = () => {
  const { t } = useTranslation(["common", "platformFee"]);
  const appToast = useAppToast();
  const appNav = useAppNav();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<ServiceFeePlan[]>([]);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [agreedTerms, setAgreedTerms] = useState<Record<string, boolean>>({});

  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [activeTab, setActiveTab] = useState("HYBRID");
  const filterRef = useRef<any>({
    planType: "HYBRID",
  });
  const paginationRef = useRef({
    activePage: 1,
    rowsPerPage: 100,
    startSlNo: 1,
    endSlNo: 100,
    totalRecords: 0,
  });
  const sortRef = useRef({ key: "amountTo", value: "asc" as "asc" });

  const [termsModal, setTermsModal] = useState<{
    show: boolean;
    title: string;
  }>({ show: false, title: "" });

  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    planId: string;
    amount?: number;
    snapshot?: any;
  }>({ show: false, planId: "", amount: 0 });

  const [subscribeConfirmModal, setSubscribeConfirmModal] = useState<{
    show: boolean;
    data?: {
      name?: string;
      amount?: number;
      gst?: number;
      _id?: string;
      subscriptionAmount?: number;
      isMultiStep?: boolean;
      isInclusiveTax?: boolean;
      taxPercentage?: number;
      setupFee?: number;
      setupFeeInfo?: {
        value: number;
        isInclusiveTax?: boolean;
        taxPercentage?: number;
      };
      operationalFeesList?: {
        type: string;
        value: number;
        discountPercent: number;
        discountSubscriptionAmount: number;
        isActive: boolean;
        isFree: boolean;
        displayName: string;
        refId: string;
      }[];
      amountTo?: number;
      isExistingUser?: boolean;
    };
  }>({ show: false });

  const [planFeeModal, setPlanFeeModal] = useState<{
    show: boolean;
    data?: {
      name?: string;
      currentFee?: number;
      _id?: string;
    };
  }>({ show: false });

  const [changePlanConfirmModal, setChangePlanConfirmModal] = useState<{
    show: boolean;
    data?: {
      currentPlan?: {
        name?: string;
        remainingDays?: number;
        availableAmount?: number;
      };
      newPlanName?: string;
    };
  }>({ show: false });

  const [forceShowPlans, setForceShowPlans] = useState(false);
  const [hiwModal, setHiwModal] = useState<{ show: boolean }>({ show: false });

  const [activePlan, setActivePlan] = useState<any>(null);
  const [loadingActivePlan, setLoadingActivePlan] = useState(true);
  const [isChangePlanRequested, setIsChangePlanRequested] = useState(false);
  const pendingSubscriptionPlanRef = useRef<ServiceFeePlan | null>(null);

  const plansRef = useRef<HTMLDivElement>(null);
  const [scrollToPlanId, setScrollToPlanId] = useState<string | null>(null);
  const planRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const user = AuthService.getLoggedInUser();
  const userName = user?.name || "Wallet";

  // init function to fetch all required data. Fetch latest franchise
  // details and update local storage, then load other data.
  const init = async () => {
    try {
      const resp = await AuthService.getLoggedInFranchiseDetails();
      if (resp && resp.data && resp.data.data && resp.data.data._id) {
        // Update the locally stored franchise object so other components
        // have the latest franchise data available in localStorage.
        AuthService.setloggedInUser(resp.data.data);

        MiscService.createEvent("platform-fee", {});
      }
    } catch (err) {
      console.warn("Error fetching franchise details:", err);
    }

    applyFilter();
    fetchBalance();
    fetchActivePlan();
  };

  useEffect(() => {
    void init();
  }, []);

  useEffect(() => {
    if (scrollToPlanId && planRefs.current[scrollToPlanId]) {
      const element = planRefs.current[scrollToPlanId];
      if (element) {
        CommonService.scrollToView(element);
        // Add animation class
        element.classList.add("animate__animated", "animate__bounceIn");
        // Remove animation class after animation completes
        setTimeout(() => {
          element?.classList.remove("animate__animated", "animate__bounceIn");
        }, 1000);
        setScrollToPlanId(null); // Reset after scrolling
      }
    }
  }, [plans, scrollToPlanId]);

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

  const fetchActivePlan = async () => {
    setLoadingActivePlan(true);
    try {
      const plan = await FranchiseService.getActivePlan();
      setActivePlan(plan);
    } catch (err) {
      console.error("Error fetching active plan:", err);
    } finally {
      setLoadingActivePlan(false);
    }
  };

  const applyFilter = async () => {
    setLoading(true);
    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
      const data = await getData(params);
      setPlans(data);
    } catch (error) {
      console.error("Error fetching platform fee plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab.key);
    filterRef.current.planType = tab.key;
    applyFilter();
  };

  const redirectToDepositMoney = () => {
    if (AuthService.isMasterLogin()) {
      appToast.show({
        msg: t("common:youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }
    appNav.to("/dashboard/deposit-money/options?from=platform-fee");
  };

  const performSubscription = async (
    plan: ServiceFeePlan,
    customAmount?: number,
    snapshot?: any,
  ) => {
    const amount = customAmount || plan.subscriptionAmount;
    setSubscribingId(plan._id);
    try {
      // Check wallet balance before calling subscribe API
      try {
        const fid = AuthService.getLoggedInUserId(true);
        if (fid) {
          const balResp: any = await FranchiseService.getBalance(fid);
          const available = (balResp && balResp.balance) || 0;
          if (available < (amount || 0)) {
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
          err,
        );
        // fallback: proceed to attempt subscription if balance check fails silently
      }

      // Check if this is an upgrade scenario - either canUpgradePlan is true OR user has active plan and is in change plan mode
      const isUpgrade =
        activePlan && (activePlan.canUpgradePlan || activePlan.isPlanActive);

      let payload: any = {
        planId: plan._id,
      };

      if ((plan.type || "").toUpperCase() === "PERCENTAGE") {
        payload.topupAmount = amount;
      }

      if (isUpgrade) {
        payload.isUpgradePlan = true;
      }

      if (plan.operationalFeeId) {
        payload.operationalFeeId = plan.operationalFeeId;
      }

      const response = await FranchiseService.subscribeServiceFeePlan(payload);

      if (response?.data?.success || response?.statusCode === 200) {
        // appToast.show({ msg: "Subscribed successfully", color: "success" });
        const fullSnapshot = snapshot
          ? {
              ...snapshot,
              planTitle: plan.title,
              planType: plan.type,
              planDurationDays:
                snapshot.planDurationDays || plan.planDurationDays,
              balanceAfter:
                (snapshot.walletBalance ?? balance ?? 0) -
                (snapshot.total || 0),
              userName,
            }
          : undefined;
        setSuccessModal({
          show: true,
          planId: plan._id,
          amount,
          snapshot: fullSnapshot,
        });
        // Trigger global event so other components (eg. sidemenu) can react
        try {
          MiscService.createEvent("platform-plan", {
            planId: plan._id,
            amount,
          });
        } catch (e) {
          // ignore
        }
        // Refresh active plan and balance after successful subscription
        setForceShowPlans(false);
        setIsChangePlanRequested(false);
        init();
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
  };

  const initiateSubscriptionFlow = (plan: ServiceFeePlan) => {
    if (plan.type?.toUpperCase() === "PERCENTAGE") {
      // Show fee entry modal for percentage plans
      setPlanFeeModal({
        show: true,
        data: {
          name: plan.title,
          currentFee: plan.subscriptionAmount,
          _id: plan._id,
        },
      });
    } else {
      // Show confirmation modal for fixed plans
      const { baseAmount, gst } = FranchiseService.calculatePlanPayable({
        subscriptionAmount: plan.subscriptionAmount,
        duration: 1,
        setupFee: plan.setupFeeInfo?.value || 0,
        taxPercentage: plan.taxPercentage || 0,
        isInclusiveTax: plan.isInclusiveTax,
      });

      setSubscribeConfirmModal({
        show: true,
        data: {
          name: plan.title,
          amount: baseAmount,
          gst,
          _id: plan._id,
          subscriptionAmount: plan.subscriptionAmount,
          isInclusiveTax: plan.isInclusiveTax,
          taxPercentage: plan.taxPercentage,
          setupFee: plan.setupFeeInfo?.value || 0,
          setupFeeInfo: plan.setupFeeInfo,
          operationalFeesList: plan.operationalFeesList,
          amountTo: plan.amountTo,
          isExistingUser: plan.isExistingUser,
          planDurationDays: plan.planDurationDays,
          typeOfPlan: plan.typeOfPlan,
        },
      });
    }
  };

  const handleSubscribe = async (plan: ServiceFeePlan) => {
    if (AuthService.isMasterLogin()) {
      appToast.show({
        msg: t("common:youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }

    if (!agreedTerms[plan._id]) {
      appToast.show({
        msg: "Please agree to the terms and conditions",
        color: "warning",
      });
      return;
    }

    if (isChangePlanRequested || activePlan) {
      pendingSubscriptionPlanRef.current = plan;
      setChangePlanConfirmModal({
        show: true,
        data: {
          currentPlan: {
            name: activePlan?.planName || "Current Plan",
            remainingDays: activePlan?.remainingDays,
            availableAmount: activePlan?.availableAmount || 0,
          },
          newPlanName: plan.title,
        },
      });
    } else {
      initiateSubscriptionFlow(plan);
    }
  };

  const handleSubscribeConfirmModalCallback = (payload: {
    action: string;
    data?: any;
  }) => {
    // Simplified: close modal and attempt subscription using any available id/amount
    if (payload.action === "confirm" && payload.data) {
      setSubscribeConfirmModal({ show: false });

      const planId = payload.data?.plan?._id;
      const amount = payload.data.amount;
      const operationalFeeId = payload.data.operationalFeeId;
      const snapshot = payload.data.snapshot;

      if (planId) {
        const plan = plans.find((p) => p._id === planId);
        if (plan) {
          // Temporarily set the operationalFeeId from the selected duration
          const planWithFee = operationalFeeId
            ? { ...plan, operationalFeeId }
            : plan;
          performSubscription(planWithFee, amount, snapshot);
        }
      }
    } else if (payload.action === "depositMoney") {
      setSubscribeConfirmModal({ show: false });
      redirectToDepositMoney();
    } else if (payload.action === "close") {
      setSubscribeConfirmModal({ show: false });
    }
  };

  const handlePlanFeeModalCallback = (payload: {
    action: string;
    data?: any;
  }) => {
    if (payload.action === "confirm" && payload.data?.fee) {
      setPlanFeeModal({ show: false });
      // Find the plan by id
      const plan = plans.find((p) => p._id === planFeeModal.data?._id);
      if (plan) {
        // Open confirm modal with entered fee
        setSubscribeConfirmModal({
          show: true,
          data: {
            name: plan.title,
            amount: payload.data.fee,
            gst: plan.isInclusiveTax
              ? 0
              : (payload.data.fee * (plan.taxPercentage || 0)) / 100,
            _id: plan._id,
            subscriptionAmount: payload.data.fee,
            isMultiStep: true,
            isInclusiveTax: plan.isInclusiveTax,
            taxPercentage: plan.taxPercentage,
            setupFee: plan.setupFeeInfo?.value || 0,
            setupFeeInfo: plan.setupFeeInfo,
            operationalFeesList: plan.operationalFeesList,
            amountTo: plan.amountTo,
            isExistingUser: plan.isExistingUser,
            planDurationDays: plan.planDurationDays,
          },
        });
      }
    } else if (payload.action === "close") {
      setPlanFeeModal({ show: false });
    }
  };

  const toggleTerms = (planId: string) => {
    setAgreedTerms((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const termsModalCb = () => {
    setTermsModal({ show: false, title: "" });
  };

  const closeSuccessModal = () => {
    setSuccessModal({ show: false, planId: "", amount: 0 });
  };

  const handleChangePlan = () => {
    setIsChangePlanRequested(true);
    setForceShowPlans(true);
    setTimeout(() => {
      if (plansRef.current) {
        CommonService.scrollToView(plansRef.current);
      }
    }, 100);
  };

  const handleChangePlanConfirmModalCallback = (payload: {
    action: string;
    data?: any;
  }) => {
    if (payload.action === "confirm") {
      setChangePlanConfirmModal({ show: false });
      if (pendingSubscriptionPlanRef.current) {
        initiateSubscriptionFlow(pendingSubscriptionPlanRef.current);
        pendingSubscriptionPlanRef.current = null;
      }
    } else if (payload.action === "close") {
      setChangePlanConfirmModal({ show: false });
      pendingSubscriptionPlanRef.current = null;
    }
  };

  const activePlanCb = (payload: { action: string; data?: any }) => {
    if (payload.action === "changePlan") {
      handleChangePlan();
    } else if (payload.action === "renew") {
      const renewType =
        activePlan?.typeOfPlan?.toLowerCase() === "hybrid" ? "HYBRID" : "FIXED";
      setActiveTab(renewType);
      filterRef.current.planType = renewType;
      setScrollToPlanId(activePlan?.planId || null);
      applyFilter();
    } else if (payload.action === "cancelled") {
      init();
    }
  };

  // Use flags provided by FranchiseService.getActivePlan to decide which banner to show
  const isExpiringSoon = !!activePlan && !!activePlan.isExpiringSoon;
  const isUsageNearLimit = !!activePlan && !!activePlan.isUsageNearLimit;

  return (
    <>
      <ActivePlan
        activePlan={activePlan}
        loading={loadingActivePlan}
        balance={balance}
        userName={userName}
        callback={activePlanCb}
      />

      {/* Status banners */}
      {!loadingActivePlan && (
        <>
          {activePlan &&
            activePlan.isPlanActive &&
            activePlan.canUpgradePlan && (
              <>
                {isExpiringSoon && (
                  <div className="tw:mb-4 tw:px-3 tw:py-2.5 tw:rounded-lg tw:border tw:border-orange-200 tw:bg-orange-50/50 tw:flex tw:items-center tw:gap-2.5">
                    <div className="tw:shrink-0 tw:w-8 tw:h-8 tw:rounded-full tw:bg-orange-100 tw:flex tw:items-center tw:justify-center">
                      <Tag className="tw:w-4 tw:h-4 tw:text-orange-600" />
                    </div>
                    <div className="tw:flex-1">
                      <p className="tw:text-xs tw:font-semibold tw:text-orange-900 tw:mb-0.5">
                        {t("platformFee:planExpiringSoonTitle")}
                      </p>
                      <p className="tw:text-[11px] tw:text-orange-700 tw:leading-snug">
                        {t("platformFee:planExpiringSoonDesc", {
                          days: activePlan.displayRemainingDays,
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {isUsageNearLimit && (
                  <div className="tw:mb-4 tw:px-3 tw:py-2.5 tw:rounded-lg tw:border tw:border-amber-200 tw:bg-amber-50/50 tw:flex tw:items-center tw:gap-2.5">
                    <div className="tw:shrink-0 tw:w-8 tw:h-8 tw:rounded-full tw:bg-amber-100 tw:flex tw:items-center tw:justify-center">
                      <TrendingDown className="tw:w-4 tw:h-4 tw:text-amber-600" />
                    </div>
                    <div className="tw:flex-1">
                      <p className="tw:text-xs tw:font-semibold tw:text-amber-900 tw:mb-0.5">
                        {t("platformFee:planUsageNearLimitTitle")}
                      </p>
                      <p className="tw:text-[11px] tw:text-amber-700 tw:leading-snug">
                        {t("platformFee:planUsageNearLimitDesc", {
                          percentage: activePlan.usagePercentage.toFixed(1),
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

          {!activePlan && (
            <div
              className="tw:mb-4 tw:px-3 tw:py-2.5 tw:rounded-lg tw:border tw:border-amber-200 tw:bg-amber-50/50 tw:flex tw:items-center tw:gap-2.5"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              title={t("platformFee:noPlanSelectedTitle")}
            >
              <div className="tw:shrink-0 tw:w-8 tw:h-8 tw:rounded-full tw:bg-amber-100 tw:flex tw:items-center tw:justify-center animate__animated animate__flash animate__slow animate__infinite">
                <AlertTriangle className="tw:w-4 tw:h-4 tw:text-amber-600" />
              </div>
              <div className="tw:flex-1">
                <p className="tw:text-xs tw:font-semibold tw:text-amber-900 tw:mb-0.5">
                  {t("platformFee:noPlanSelectedTitle")}
                </p>
                <p className="tw:text-[11px] tw:text-amber-700 tw:leading-snug">
                  {t("platformFee:noPlanSelectedDesc")}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Benefits & How it Works links (mobile: above tabs, desktop: same row) */}
      <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-2 tw:mb-4">
        <div className="tw:flex tw:items-center tw:gap-3 tw:order-1 tw:md:order-2">
          <button
            type="button"
            onClick={() =>
              appNav.to("/dashboard/accounts/platform-fee/benefits")
            }
            className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-blue-600 tw:font-medium hover:tw:text-blue-800 tw:transition-colors"
          >
            <Gift className="tw:w-3.5 tw:h-3.5" />
            <span>
              {t("platformFee:benefits", { defaultValue: "Benefits" })}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setHiwModal({ show: true })}
            className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-blue-600 tw:font-medium hover:tw:text-blue-800 tw:transition-colors"
          >
            <HelpCircle className="tw:w-3.5 tw:h-3.5" />
            <span>{t("platformFee:howItWorks")}</span>
          </button>
        </div>
        <div className="tw:order-2 tw:md:order-1">
          <AppTab
            tabs={plansTabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      </div>

      {loading ? (
        <AppCard title={t("platformFee:platformFeePlans")}>
          <div className="tw:space-y-4">
            <div className="tw:flex tw:items-center tw:justify-between">
              <Skeleton className="tw:h-4 tw:w-1/3" />
              <Skeleton className="tw:h-4 tw:w-24" />
            </div>

            <div className="tw:space-y-4">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="tw:border tw:rounded tw:p-3">
                  <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                    <Skeleton className="tw:h-4 tw:w-1/2" />
                    <Skeleton className="tw:h-4 tw:w-16" />
                  </div>

                  <div className="tw:flex tw:gap-2 tw:mb-2">
                    <Skeleton className="tw:h-3 tw:w-20" />
                    <Skeleton className="tw:h-3 tw:w-16" />
                  </div>

                  <Skeleton className="tw:h-8 tw:w-full" />
                </div>
              ))}
            </div>
          </div>
        </AppCard>
      ) : !plans.length ? (
        <AppCard title={t("platformFee:platformFeePlans")}>
          <div className="tw:text-center tw:py-8 tw:text-gray-500">
            {t("platformFee:noPlansAvailable")}
          </div>
        </AppCard>
      ) : (
        <>
          <div ref={plansRef}>
            <p className="tw:text-xs tw:text-gray-600 tw:mb-4">
              {t("platformFee:subscribeToPlansInfo")}
            </p>
          </div>

          <div className="tw:mb-4 tw:hidden">
            <div
              className={clsx(
                "tw:flex tw:items-center tw:justify-between tw:p-3 tw:rounded-lg tw:border",
                {
                  "tw:bg-red-50 tw:border-red-100": balance <= 0,
                  "tw:bg-blue-50 tw:border-blue-100": balance > 0,
                },
              )}
            >
              <div className="tw:flex tw:items-center tw:gap-3">
                <div className="tw:p-2 tw:bg-white tw:rounded-full tw:shadow-sm">
                  <Wallet className="tw:w-4 tw:h-4 tw:text-blue-600" />
                </div>
                <div>
                  <div className="tw:text-[10px] tw:text-gray-500 tw:font-medium tw:uppercase tw:tracking-wider">
                    {t("platformFee:balanceLabel", { userName })}
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
                {t("platformFee:depositMoney")}
              </AppButton>
            </div>
          </div>

          <div className="tw:mt-4">
            {activeTab === "PERCENTAGE" ? (
              <div className="tw:flex tw:flex-col tw:gap-6">
                {plans.map((plan) => (
                  <PercentagePlanItem
                    key={plan._id}
                    plan={plan}
                    balance={balance}
                    agreed={!!agreedTerms[plan._id]}
                    subscribingId={subscribingId}
                    activePlanId={activePlan?.planId}
                    onToggleTerms={toggleTerms}
                    onOpenTerms={(title: string) =>
                      setTermsModal({ show: true, title })
                    }
                    onSubscribe={handleSubscribe}
                    redirectToDepositMoney={redirectToDepositMoney}
                  />
                ))}
              </div>
            ) : (
              <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan._id}
                    ref={(el) => {
                      planRefs.current[plan._id] = el;
                    }}
                  >
                    <PlanItem
                      plan={plan}
                      balance={balance}
                      agreed={!!agreedTerms[plan._id]}
                      subscribingId={subscribingId}
                      activePlanId={activePlan?.planId}
                      canUpgradePlan={activePlan?.canUpgradePlan}
                      onToggleTerms={toggleTerms}
                      onOpenTerms={(title: string) =>
                        setTermsModal({ show: true, title })
                      }
                      onSubscribe={handleSubscribe}
                      redirectToDepositMoney={redirectToDepositMoney}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <SubscribeConfirmModal
            show={subscribeConfirmModal.show}
            data={subscribeConfirmModal.data}
            callback={handleSubscribeConfirmModalCallback}
          />

          <ChangePlanConfirmModal
            show={changePlanConfirmModal.show}
            data={changePlanConfirmModal.data}
            callback={handleChangePlanConfirmModalCallback}
          />

          <PlanFeeModal
            show={planFeeModal.show}
            data={planFeeModal.data}
            callback={handlePlanFeeModalCallback}
          />

          <TermsModal
            code={"ROS_PLAN_SUBSCRIBE"}
            show={termsModal.show}
            title={termsModal.title}
            callback={termsModalCb}
          />

          <SuccessModal
            show={successModal.show}
            planId={successModal.planId}
            amount={successModal.amount}
            snapshot={successModal.snapshot}
            onClose={closeSuccessModal}
          />
        </>
      )}

      <PlatformFeeHiwModal
        show={hiwModal.show}
        callback={(p: { action: string }) => {
          if (p.action === "close") setHiwModal({ show: false });
          if (p.action === "openPlans") {
            setHiwModal({ show: false });
            setForceShowPlans(true);
            setTimeout(() => {
              if (plansRef.current) {
                CommonService.scrollToView(plansRef.current);
              }
            }, 100);
          }
        }}
      />
    </>
  );
};

export default PlatformFee;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Platform Fee"),
    },
  ];
}
