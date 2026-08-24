import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import TermsModal from "~/modals/core/terms-modal/TermsModal";
import { AuthService } from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import MiscService from "~/services/MiscService";
import PageAccessService from "~/services/PageAccessService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import { getData, getPlanHighlights, prepareParams } from "../plans/helper";
import SuccessModal from "../plans/SuccessModal";

export async function clientLoader() {
  if (
    !PageAccessService.canAccessPage([], {
      allowNoSubscribe: true,
      allowIncompleteProfile: true,
    })
  ) {
    return null;
  }
  return null;
}

interface OperationalFee {
  type: string;
  value: number;
  discountPercent: number;
  discountSubscriptionAmount: number;
  isActive: boolean;
  isFree: boolean;
  displayName: string;
  refId: string;
}

interface BuyPlan {
  _id: string;
  title?: string;
  subscriptionAmount: number;
  planDurationDays: number;
  amountTo?: number;
  description?: string;
  type?: string;
  typeOfPlan?: string;
  taxPercentage?: number;
  isInclusiveTax?: boolean;
  isExistingUser?: boolean;
  operationalFeeId?: string;
  operationalFeesList?: OperationalFee[];
  planHighlights?: { value: string[]; languageCode: string; _id: string }[];
  setupFeeInfo?: {
    value: number;
    isInclusiveTax?: boolean;
    taxPercentage?: number;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "Platform Fee",
    langKey: "platformFee",
    redirect: { path: "/dashboard/accounts/platform-fee" },
  },
  { label: "Buy Plan", langKey: "buyPlan" },
];

const PLAN_TYPES = ["HYBRID", "FIXED", "PERCENTAGE"] as const;

const BuyPlanPage = () => {
  const { t } = useTranslation(["common", "platformFee"]);
  const appToast = useAppToast();
  const appNav = useAppNav();
  const [searchParams, setSearchParams] = useSearchParams();
  const planId = searchParams.get("planId") || "";

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<BuyPlan[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [activePlan, setActivePlan] = useState<any>(null);

  const [selectedFeeRefId, setSelectedFeeRefId] = useState<string>("");
  const [topupAmount, setTopupAmount] = useState<string>("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [termsModal, setTermsModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<{ show: boolean; snapshot?: any }>({
    show: false,
  });

  const plan = useMemo(
    () => plans.find((p) => p._id === planId) || null,
    [plans, planId],
  );

  const isPercentage = (plan?.type || "").toUpperCase() === "PERCENTAGE";

  const operationalFees = useMemo(
    () => (plan?.operationalFeesList || []).filter((f) => f.isActive),
    [plan],
  );

  const selectedFee = useMemo(() => {
    if (!operationalFees.length) return null;
    return (
      operationalFees.find((f) => f.refId === selectedFeeRefId) ||
      operationalFees[0]
    );
  }, [operationalFees, selectedFeeRefId]);

  // ---- payable computation (mirrors SubscribeConfirmModal) ----
  const payable = useMemo(() => {
    if (!plan) return null;
    const isInclusiveTax = !!plan.isInclusiveTax;
    const setupFeeBase = plan.isExistingUser
      ? 0
      : plan.setupFeeInfo?.value || 0;
    const setupFeeTaxPct = plan.setupFeeInfo?.taxPercentage || 0;
    const setupFeeTax =
      plan.setupFeeInfo?.isInclusiveTax || !setupFeeBase
        ? 0
        : (setupFeeBase * setupFeeTaxPct) / 100;
    const setupFee = setupFeeBase + setupFeeTax;

    const subscriptionAmount = isPercentage
      ? Number(topupAmount) || 0
      : selectedFee
        ? selectedFee.discountSubscriptionAmount
        : plan.subscriptionAmount;

    const originalSubscriptionAmount = selectedFee
      ? plan.subscriptionAmount * (selectedFee.value || 1)
      : subscriptionAmount;

    const gst = isInclusiveTax
      ? 0
      : (subscriptionAmount * (plan.taxPercentage || 0)) / 100;
    const total = subscriptionAmount + gst + setupFee;

    return {
      isInclusiveTax,
      setupFeeBase,
      setupFeeTax,
      setupFee,
      setupFeeTaxPct,
      setupFeeIsInclusiveTax: !!plan.setupFeeInfo?.isInclusiveTax,
      subscriptionAmount,
      originalSubscriptionAmount,
      gst,
      total,
      discountPercent: selectedFee?.discountPercent || 0,
    };
  }, [plan, selectedFee, isPercentage, topupAmount]);

  const total = payable?.total || 0;
  const insufficientBalance = balance !== null && total > 0 && balance < total;

  // ---- data loading ----
  const fetchBalance = async () => {
    const fid = AuthService.getLoggedInUserId(true);
    if (!fid) return;
    setLoadingBalance(true);
    try {
      const resp: any = await FranchiseService.getBalance(fid);
      setBalance((resp && resp.balance) || 0);
    } catch (err) {
      console.error("Error fetching balance:", err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const init = async () => {
    setLoading(true);
    try {
      // Plan type isn't known from the id, so pull every active plan type in
      // parallel and pick the one matching the query param.
      const results = await Promise.all(
        PLAN_TYPES.map((type) =>
          getData(
            prepareParams(
              { planType: type },
              {
                activePage: 1,
                rowsPerPage: 100,
                startSlNo: 1,
                endSlNo: 100,
                totalRecords: 0,
              } as any,
              { key: "amountTo", value: "asc" },
            ),
          ),
        ),
      );
      setPlans(results.flat());
    } catch (err) {
      console.error("Error fetching plans:", err);
    } finally {
      setLoading(false);
    }
    fetchBalance();
    try {
      setActivePlan(await FranchiseService.getActivePlan());
    } catch (err) {
      console.warn("Error fetching active plan:", err);
    }
  };

  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (plan) {
      setSelectedFeeRefId(
        plan.operationalFeeId || operationalFees[0]?.refId || "",
      );
      setTopupAmount(String(plan.subscriptionAmount || ""));
      setAgreedTerms(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?._id]);

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

  // ---- payment ----
  const handlePay = async () => {
    if (!plan || !payable) return;
    if (AuthService.isMasterLogin()) {
      appToast.show({
        msg: t("common:youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }
    if (!agreedTerms) {
      appToast.show({
        msg: t("platformFee:pleaseAgreeTerms", {
          defaultValue: "Please agree to the terms and conditions",
        }),
        color: "warning",
      });
      return;
    }
    if (isPercentage && payable.subscriptionAmount <= 0) {
      appToast.show({
        msg: t("platformFee:enterValidAmount", {
          defaultValue: "Please enter a valid amount",
        }),
        color: "warning",
      });
      return;
    }

    setPaying(true);
    try {
      // Re-check wallet balance right before subscribing.
      try {
        const fid = AuthService.getLoggedInUserId(true);
        if (fid) {
          const balResp: any = await FranchiseService.getBalance(fid);
          const available = (balResp && balResp.balance) || 0;
          setBalance(available);
          if (available < total) {
            appToast.show({
              msg: t("platformFee:insufficientWalletBalance", {
                defaultValue:
                  "Insufficient wallet balance. Please add money to your wallet.",
              }),
              color: "warning",
            });
            return;
          }
        }
      } catch (err) {
        console.warn("Could not validate wallet balance:", err);
      }

      const payload: any = { planId: plan._id };
      if (isPercentage) payload.topupAmount = payable.subscriptionAmount;
      if (activePlan && (activePlan.canUpgradePlan || activePlan.isPlanActive))
        payload.isUpgradePlan = true;
      if (selectedFee?.refId) payload.operationalFeeId = selectedFee.refId;

      const response = await FranchiseService.subscribeServiceFeePlan(payload);

      if (response?.data?.success || response?.statusCode === 200) {
        const user = AuthService.getLoggedInUser();
        setSuccess({
          show: true,
          snapshot: {
            planName: plan.title,
            planTitle: plan.title,
            planType: plan.type,
            planDurationDays: plan.planDurationDays,
            subscriptionAmount: payable.subscriptionAmount,
            gstAmount: payable.gst,
            taxPercentage: plan.taxPercentage || 0,
            isInclusiveTax: payable.isInclusiveTax,
            setupFeeBase: payable.setupFeeBase,
            setupFeeTax: payable.setupFeeTax,
            setupFee: payable.setupFee,
            setupFeeTaxPercentage: payable.setupFeeTaxPct,
            setupFeeIsInclusiveTax: payable.setupFeeIsInclusiveTax,
            total,
            selectedFeeName: selectedFee?.displayName,
            discountPercent: payable.discountPercent,
            amountTo: plan.amountTo,
            selectedDurationMonths: selectedFee?.value || 0,
            walletBalance: balance,
            balanceAfter: (balance ?? 0) - total,
            userName: user?.name || "Wallet",
          },
        });
        try {
          MiscService.createEvent("platform-plan", {
            planId: plan._id,
            amount: payable.subscriptionAmount,
          });
        } catch {
          // ignore
        }
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
      setPaying(false);
    }
  };

  const closeSuccess = () => {
    setSuccess({ show: false });
    appNav.to("/dashboard/accounts/platform-fee?skipBenefits=true");
  };

  const highlights = getPlanHighlights(plan?.planHighlights);
  const durationLabel = selectedFee
    ? `${selectedFee.displayName}`
    : `${plan?.planDurationDays || 0} ${t("platformFee:days", { defaultValue: "days" })}`;

  /* Order summary — rendered in the AppPaneSide on desktop and inline on
     mobile. */
  const summaryPane = plan ? (
    <>
      <div className="tw:bg-white tw:rounded-xl tw:border tw:border-gray-200 tw:overflow-hidden">
        <div className="tw:px-4 tw:py-3 tw:border-b tw:border-gray-100 tw:flex tw:items-center tw:justify-between">
          <h3 className="tw:text-sm tw:font-bold tw:text-gray-900">
            {t("platformFee:yourOrder", {
              defaultValue: "Your order",
            })}
          </h3>
          <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-amber-700 tw:bg-amber-50 tw:px-2 tw:py-0.5 tw:rounded">
            {plan.typeOfPlan || plan.type}
          </span>
        </div>
        <div className="tw:p-4">
          <div className="tw:text-base tw:font-bold tw:text-gray-900">
            {plan.title}
          </div>
          <div className="tw:text-[11px] tw:text-gray-500 tw:mb-3">
            {durationLabel}
            {plan.amountTo ? (
              <>
                {" · "}
                {t("platformFee:purchaseValue", {
                  defaultValue: "Purchase value",
                })}{" "}
                <Amount value={plan.amountTo} />
              </>
            ) : null}
          </div>

          <div className="tw:flex tw:flex-col tw:gap-1.5 tw:text-xs tw:text-gray-600">
            {payable && payable.setupFee > 0 && (
              <div className="tw:flex tw:justify-between">
                <span>
                  {t("platformFee:setupFee", {
                    defaultValue: "Setup",
                  })}
                </span>
                <span className="tw:font-medium">
                  <Amount value={payable.setupFee} />
                </span>
              </div>
            )}
            <div className="tw:flex tw:justify-between">
              <span>
                {t("platformFee:term", { defaultValue: "Term" })}
                {selectedFee ? ` (${selectedFee.displayName})` : ""}
              </span>
              <span className="tw:font-medium tw:flex tw:items-center tw:gap-1.5">
                {payable &&
                payable.discountPercent > 0 &&
                payable.originalSubscriptionAmount >
                  payable.subscriptionAmount ? (
                  <span className="tw:text-gray-400 tw:line-through">
                    <Amount value={payable.originalSubscriptionAmount} />
                  </span>
                ) : null}
                <Amount value={payable?.subscriptionAmount || 0} />
              </span>
            </div>
            {(plan.taxPercentage || 0) > 0 && (
              <div className="tw:flex tw:justify-between">
                <span>GST {plan.taxPercentage}%</span>
                <span className="tw:font-medium">
                  {payable?.isInclusiveTax ? (
                    <span className="tw:text-gray-400 tw:text-[10px]">
                      {t("platformFee:included", {
                        defaultValue: "Included",
                      })}
                    </span>
                  ) : (
                    <Amount value={payable?.gst || 0} />
                  )}
                </span>
              </div>
            )}
            <div className="tw:flex tw:justify-between tw:pt-2 tw:mt-1 tw:border-t tw:border-dashed tw:border-gray-200">
              <span className="tw:font-semibold tw:text-gray-800">
                {t("platformFee:subtotal", {
                  defaultValue: "Subtotal",
                })}
              </span>
              <span className="tw:font-bold tw:text-gray-900">
                <Amount value={total} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grand total */}
      <div className="tw:rounded-xl tw:bg-emerald-700 tw:text-white tw:p-4 tw:flex tw:items-center tw:justify-between">
        <div>
          <div className="tw:text-[10px] tw:uppercase tw:tracking-wider tw:font-semibold tw:opacity-80">
            {t("platformFee:grandTotal", {
              defaultValue: "Grand total",
            })}
          </div>
          <div className="tw:text-2xl tw:font-black">
            <Amount value={total} />
          </div>
        </div>
        <ShieldCheck className="tw:w-8 tw:h-8 tw:opacity-70" />
      </div>

      {/* Wallet balance */}
      <div
        className={`tw:rounded-xl tw:border tw:p-3.5 ${
          insufficientBalance
            ? "tw:bg-red-50 tw:border-red-200"
            : "tw:bg-white tw:border-gray-200"
        }`}
      >
        <div className="tw:flex tw:items-center tw:justify-between tw:mb-1.5">
          <div className="tw:flex tw:items-center tw:gap-2">
            <div
              className={`tw:p-1.5 tw:rounded-lg ${
                insufficientBalance ? "tw:bg-red-100" : "tw:bg-blue-50"
              }`}
            >
              <Wallet
                className={`tw:w-4 tw:h-4 ${
                  insufficientBalance ? "tw:text-red-600" : "tw:text-blue-600"
                }`}
              />
            </div>
            <span className="tw:text-xs tw:font-semibold tw:text-gray-700">
              {t("platformFee:currentWalletBalance")}
            </span>
          </div>
          <span className="tw:text-sm tw:font-bold tw:text-gray-900">
            {loadingBalance ? (
              <Loader2 className="tw:w-4 tw:h-4 tw:animate-spin tw:text-gray-400" />
            ) : (
              <Amount value={balance ?? 0} />
            )}
          </span>
        </div>
        {insufficientBalance ? (
          <>
            <p className="tw:text-[11px] tw:text-red-600 tw:mb-2">
              {t("platformFee:needMoreBalance", {
                defaultValue: "You need",
              })}{" "}
              <Amount value={total - (balance ?? 0)} />{" "}
              {t("platformFee:moreInWallet", {
                defaultValue: "more in your wallet.",
              })}
            </p>
            <AppButton
              size="small"
              color="primary"
              className="tw:w-full"
              onClick={redirectToDepositMoney}
            >
              {t("platformFee:depositMoney")}
            </AppButton>
          </>
        ) : (
          balance !== null &&
          total > 0 && (
            <div className="tw:flex tw:items-center tw:justify-between tw:text-[11px] tw:text-gray-500">
              <span>{t("platformFee:balanceAfterPayment")}</span>
              <span className="tw:font-semibold tw:text-gray-800">
                <Amount value={balance - total} />
              </span>
            </div>
          )
        )}
      </div>

      <p className="tw:text-[10px] tw:text-gray-400 tw:leading-snug tw:px-1">
        {t("platformFee:gstInvoiceNote", {
          defaultValue:
            "You'll receive a proper GST invoice with input credit.",
        })}
      </p>
    </>
  ) : null;

  return (
    <>
      <AppHeader
        title={t("platformFee:buyPlan", { defaultValue: "Buy Plan" })}
        sectionKey="business"
        activeTab="platform-fee"
      />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <div className="section-layout">
            {/* Desktop-only left rail — section side menu */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab="platform-fee"
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Main column — centered with a max width */}
                <AppPaneMain className="tw:lg:col-span-12 tw:mx-auto tw:w-full tw:max-w-3xl">
                  <AppBreadcrumbs data={breadcrumbs} />

                  {loading ? (
                    <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:mt-3">
                      <div className="tw:col-span-12 tw:lg:col-span-4 tw:space-y-3">
                        <Skeleton className="tw:h-56 tw:w-full tw:rounded-xl" />
                        <Skeleton className="tw:h-28 tw:w-full tw:rounded-xl" />
                      </div>
                      <div className="tw:col-span-12 tw:lg:col-span-8 tw:space-y-3">
                        <Skeleton className="tw:h-14 tw:w-full tw:rounded-xl" />
                        <Skeleton className="tw:h-72 tw:w-full tw:rounded-xl" />
                      </div>
                    </div>
                  ) : !plan ? (
                    /* ---------- No / unknown planId ---------- */
                    <div className="tw:mt-3 tw:bg-white tw:rounded-xl tw:border tw:border-gray-200 tw:p-8 tw:text-center">
                      <p className="tw:text-sm tw:text-gray-500 tw:mb-4">
                        {t("platformFee:noPlanSelected", {
                          defaultValue:
                            "No plan selected. Please pick a plan to continue.",
                        })}
                      </p>
                      <AppButton
                        color="primary"
                        onClick={() =>
                          appNav.to("/dashboard/accounts/platform-fee/tiers")
                        }
                      >
                        {t("platformFee:browsePlans", {
                          defaultValue: "Browse plans",
                        })}
                      </AppButton>
                    </div>
                  ) : (
                    /* ---------- Checkout ---------- */
                    <div className="tw:space-y-4 tw:mt-3">
                      {/* Mobile-only order summary (desktop shows it in the side pane) */}
                      <div className="tw:lg:hidden tw:space-y-3">
                        {summaryPane}
                      </div>

                      {/* ===== Main: plan details + payment ===== */}
                      <main className="tw:space-y-4">
                        {/* Step header */}
                        <div className="tw:bg-white tw:rounded-xl tw:border tw:border-gray-200 tw:px-4 tw:py-3 tw:flex tw:items-center tw:gap-3">
                          <AppButton
                            fill="clear"
                            color="medium"
                            size="small"
                            noPadding
                            className="tw:p-1.5 tw:rounded-full tw:text-gray-500"
                            title={t("platformFee:backToPlans", {
                              defaultValue: "Back to plans",
                            })}
                            onClick={() => setSearchParams({})}
                          >
                            <ArrowLeft className="tw:w-4 tw:h-4" />
                          </AppButton>
                          <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs">
                            <span className="tw:flex tw:items-center tw:gap-1.5 tw:font-semibold tw:text-blue-600">
                              <span className="tw:w-5 tw:h-5 tw:rounded-full tw:bg-blue-600 tw:text-white tw:flex tw:items-center tw:justify-center tw:text-[10px]">
                                1
                              </span>
                              {t("platformFee:reviewPlan", {
                                defaultValue: "Review plan",
                              })}
                            </span>
                            <span className="tw:w-8 tw:h-px tw:bg-gray-200" />
                            <span className="tw:flex tw:items-center tw:gap-1.5 tw:font-semibold tw:text-gray-700">
                              <span className="tw:w-5 tw:h-5 tw:rounded-full tw:bg-gray-200 tw:text-gray-600 tw:flex tw:items-center tw:justify-center tw:text-[10px]">
                                2
                              </span>
                              {t("platformFee:payment", {
                                defaultValue: "Payment",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Plan details */}
                        <div className="tw:bg-white tw:rounded-xl tw:border tw:border-gray-200 tw:p-4">
                          <h3 className="tw:text-sm tw:font-bold tw:text-gray-900 tw:mb-3">
                            {t("platformFee:planDetails", {
                              defaultValue: "Plan details",
                            })}
                          </h3>

                          {highlights.length > 0 && (
                            <ul className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2 tw:mb-4">
                              {highlights.map((h, i) => (
                                <li
                                  key={i}
                                  className="tw:flex tw:items-start tw:gap-2 tw:text-xs tw:text-gray-600"
                                >
                                  <BadgeCheck className="tw:w-3.5 tw:h-3.5 tw:text-emerald-600 tw:mt-0.5 tw:shrink-0" />
                                  <span>{h}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Duration selector (Hybrid operational fees) */}
                          {operationalFees.length > 0 && (
                            <div>
                              <div className="tw:text-xs tw:font-bold tw:text-gray-700 tw:uppercase tw:mb-2">
                                {t("platformFee:chooseDuration", {
                                  defaultValue: "Choose Duration",
                                })}
                              </div>
                              <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-2">
                                {operationalFees.map((fee) => {
                                  const active =
                                    selectedFee?.refId === fee.refId;
                                  const feeGst = payable?.isInclusiveTax
                                    ? 0
                                    : (fee.discountSubscriptionAmount *
                                        (plan.taxPercentage || 0)) /
                                      100;
                                  return (
                                    <button
                                      key={fee.refId}
                                      type="button"
                                      onClick={() =>
                                        setSelectedFeeRefId(fee.refId)
                                      }
                                      className={`tw:flex tw:items-center tw:justify-between tw:p-3 tw:rounded-lg tw:border-2 tw:text-left tw:transition-all ${
                                        active
                                          ? "tw:border-blue-500 tw:bg-blue-50"
                                          : "tw:border-gray-200 tw:bg-white hover:tw:border-gray-300"
                                      }`}
                                    >
                                      <div className="tw:flex tw:items-center tw:gap-2">
                                        <span
                                          className={`tw:w-4 tw:h-4 tw:rounded-full tw:border-2 tw:flex tw:items-center tw:justify-center ${
                                            active
                                              ? "tw:border-blue-500"
                                              : "tw:border-gray-300"
                                          }`}
                                        >
                                          {active && (
                                            <span className="tw:w-2 tw:h-2 tw:rounded-full tw:bg-blue-500" />
                                          )}
                                        </span>
                                        <span className="tw:text-sm tw:font-semibold tw:text-gray-800">
                                          {fee.displayName}
                                        </span>
                                        {fee.discountPercent > 0 && (
                                          <span className="tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-green-100 tw:text-green-700 tw:text-[10px] tw:font-bold">
                                            {fee.discountPercent}% OFF
                                          </span>
                                        )}
                                      </div>
                                      <span className="tw:text-sm tw:font-bold tw:text-gray-900">
                                        <Amount
                                          value={
                                            fee.discountSubscriptionAmount +
                                            feeGst
                                          }
                                        />
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Percentage plan top-up amount */}
                          {isPercentage && (
                            <div className="tw:max-w-xs">
                              <label className="tw:text-xs tw:font-bold tw:text-gray-700 tw:uppercase tw:mb-1.5 tw:block">
                                {t("platformFee:topupAmount", {
                                  defaultValue: "Top-up amount",
                                })}
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={topupAmount}
                                onChange={(e) => setTopupAmount(e.target.value)}
                                className="tw:w-full tw:px-3 tw:py-2 tw:rounded-lg tw:border tw:border-gray-300 tw:text-sm focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-500"
                                placeholder="0"
                              />
                            </div>
                          )}
                        </div>

                        {/* Payment */}
                        <div className="tw:bg-white tw:rounded-xl tw:border tw:border-gray-200 tw:p-4">
                          <h3 className="tw:text-sm tw:font-bold tw:text-gray-900 tw:mb-3">
                            {t("platformFee:payment", {
                              defaultValue: "Payment",
                            })}
                          </h3>

                          <div className="tw:flex tw:items-start tw:gap-2 tw:mb-4">
                            <button
                              type="button"
                              onClick={() => setAgreedTerms((v) => !v)}
                              className={`tw:w-4.5 tw:h-4.5 tw:mt-0.5 tw:rounded tw:border-2 tw:flex tw:items-center tw:justify-center tw:shrink-0 ${
                                agreedTerms
                                  ? "tw:bg-blue-600 tw:border-blue-600"
                                  : "tw:border-gray-300 tw:bg-white"
                              }`}
                              aria-checked={agreedTerms}
                              role="checkbox"
                            >
                              {agreedTerms && (
                                <Check className="tw:w-3 tw:h-3 tw:text-white" />
                              )}
                            </button>
                            <span className="tw:text-xs tw:text-gray-600">
                              {t("platformFee:agreeTermsPrefix", {
                                defaultValue: "I agree to the",
                              })}{" "}
                              <button
                                type="button"
                                className="tw:text-blue-600 tw:font-semibold hover:tw:underline"
                                onClick={() => setTermsModal(true)}
                              >
                                {t("platformFee:termsAndConditions", {
                                  defaultValue: "terms and conditions",
                                })}
                              </button>
                            </span>
                          </div>

                          {insufficientBalance && (
                            <div className="tw:mb-3 tw:px-3 tw:py-2.5 tw:rounded-lg tw:border tw:border-red-200 tw:bg-red-50 tw:flex tw:items-center tw:gap-2.5">
                              <AlertTriangle className="tw:w-4 tw:h-4 tw:text-red-600 tw:shrink-0" />
                              <p className="tw:text-xs tw:text-red-700">
                                {t("platformFee:insufficientBalancePay", {
                                  defaultValue:
                                    "Insufficient wallet balance. Deposit money to continue.",
                                })}
                              </p>
                            </div>
                          )}

                          <div className="tw:flex tw:flex-col tw:sm:flex-row tw:gap-2">
                            <AppButton
                              fill="outline"
                              color="medium"
                              className="tw:flex-1"
                              onClick={() =>
                                appNav.to(
                                  "/dashboard/accounts/platform-fee/tiers",
                                )
                              }
                            >
                              {t("platformFee:changePlan", {
                                defaultValue: "Change plan",
                              })}
                            </AppButton>
                            {insufficientBalance ? (
                              <AppButton
                                color="primary"
                                className="tw:flex-1 tw:font-bold"
                                onClick={redirectToDepositMoney}
                              >
                                {t("platformFee:depositMoney")}
                              </AppButton>
                            ) : (
                              <AppButton
                                color="primary"
                                className="tw:flex-1 tw:font-bold"
                                disabled={
                                  paying ||
                                  loadingBalance ||
                                  !agreedTerms ||
                                  total <= 0
                                }
                                onClick={handlePay}
                              >
                                {paying ? (
                                  <span className="tw:flex tw:items-center tw:gap-2">
                                    <Loader2 className="tw:w-4 tw:h-4 tw:animate-spin" />
                                    {t("platformFee:processing", {
                                      defaultValue: "Processing…",
                                    })}
                                  </span>
                                ) : (
                                  <span className="tw:flex tw:items-center tw:gap-1.5">
                                    <CheckCircle2 className="tw:w-4 tw:h-4" />
                                    {t("platformFee:pay", {
                                      defaultValue: "Pay",
                                    })}{" "}
                                    <Amount value={total} />
                                  </span>
                                )}
                              </AppButton>
                            )}
                          </div>
                        </div>
                      </main>
                    </div>
                  )}
                </AppPaneMain>

                {/* Side Pane Column — order summary (theme-2 desktop) */}
                <AppPaneSide className="app-pane-only">
                  {summaryPane}
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TermsModal
        code="ROS_PLAN_SUBSCRIBE"
        show={termsModal}
        title={plan?.title || ""}
        callback={() => setTermsModal(false)}
      />

      <SuccessModal
        show={success.show}
        planId={planId}
        amount={payable?.subscriptionAmount}
        snapshot={success.snapshot}
        onClose={closeSuccess}
      />
    </>
  );
};

export default BuyPlanPage;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Buy Plan"),
    },
  ];
}
