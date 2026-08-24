import {
  CreditCard,
  Eye,
  ExternalLink,
  Package,
  PhoneCall,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppPopover from "~/components/core/popover/AppPopover";
import useAppNav from "~/hooks/useAppNav";
import { getRetailerDetail } from "../helper";

interface StoreSnapshotProps {
  franchise: any;
  loading?: boolean;
  className?: string;
}

const getInitials = (name?: string) => {
  if (!name) return "?";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
};

// Human-readable plan name, matching the network dashboard's derivation.
const getPlanName = (planInfo: any) => {
  if (!planInfo?.type) return "";
  if (planInfo.typeOfPlan === "Hybrid") {
    return `Hybrid Plan${planInfo.planName ? ` - ${planInfo.planName}` : ""}`;
  }
  if (planInfo.type === "Value") return "Fixed Plan";
  if (planInfo.type === "Percentage") return "Percentage Plan";
  return planInfo.type;
};

// A compact inline label:value pair. Kept on one line to keep the identity
// card short; the label stays so State / District / Town read unambiguously.
const Field = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <span className="tw:inline-flex tw:min-w-0 tw:items-baseline tw:gap-1">
    <span className="tw:shrink-0 tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-400">
      {label}
    </span>
    <span className="tw:truncate tw:text-xs tw:font-semibold tw:text-gray-900">
      {value}
    </span>
  </span>
);

// A single headline metric card (icon tile + value + label + optional sub-line),
// matching the four-across stat row in the retailer overview design.
const StatCard = ({
  icon,
  iconClass,
  value,
  label,
  sub,
  loading,
}: {
  icon: React.ReactNode;
  iconClass: string;
  value: React.ReactNode;
  label: string;
  sub?: React.ReactNode;
  loading?: boolean;
}) => (
  <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-3">
    <span
      className={`tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg ${iconClass}`}
    >
      {icon}
    </span>
    <div className="tw:min-w-0">
      {loading ? (
        <span className="tw:mb-1 tw:block tw:h-4 tw:w-16 tw:animate-pulse tw:rounded tw:bg-gray-200" />
      ) : (
        <div className="tw:truncate tw:text-base tw:font-bold tw:leading-tight tw:text-gray-900">
          {value}
        </div>
      )}
      <div className="tw:text-[11px] tw:font-medium tw:text-gray-500">
        {label}
      </div>
      {sub ? (
        <div className="tw:mt-0.5 tw:truncate tw:text-[10px] tw:text-gray-400">
          {sub}
        </div>
      ) : null}
    </div>
  </div>
);

const StoreSnapshot: React.FC<StoreSnapshotProps> = ({
  franchise,
  loading,
  className,
}) => {
  const appNav = useAppNav();

  // Access-store opens the retailer's own console in a new tab; the master
  // "connect to franchise" flow at /auth/master/stores auto-triggers on ?fid=.
  const storeFid = franchise?._id || franchise?.id || "";
  const openStore = () => {
    if (!storeFid) return;
    appNav.openInNewTab(`/auth/master/stores?fid=${storeFid}`);
  };

  // Analytics detail (plan, sales, orders, customers) for this retailer,
  // fetched from the same retailer-detail-view API the network dashboard uses,
  // scoped to this franchise. Identity/location still come from `franchise`.
  const detailFranchiseId = franchise?.franchiseId || "";
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!detailFranchiseId) {
      setDetail(null);
      return;
    }
    const controller = new AbortController();
    setDetailLoading(true);
    (async () => {
      try {
        const result = await getRetailerDetail(
          detailFranchiseId,
          controller.signal,
        );
        setDetail(result);
      } catch (e) {
        if (!controller.signal.aborted) setDetail(null);
      } finally {
        if (!controller.signal.aborted) setDetailLoading(false);
      }
    })();
    return () => controller.abort();
  }, [detailFranchiseId]);

  if (loading) {
    return (
      <AppCard className={`${className ?? ""} tw:py-0`} bodyClassName="tw:p-3">
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:h-10 tw:w-10 tw:shrink-0 tw:animate-pulse tw:rounded-full tw:bg-gray-200" />
          <div className="tw:flex tw:flex-col tw:gap-2">
            <span className="tw:h-3.5 tw:w-40 tw:animate-pulse tw:rounded tw:bg-gray-200" />
            <span className="tw:h-3 tw:w-64 tw:animate-pulse tw:rounded tw:bg-gray-200" />
          </div>
        </div>
      </AppCard>
    );
  }

  const name = franchise?.name || franchise?.franchiseName || "Retailer";
  const refId = franchise?.franchiseId;
  const mobile = franchise?.mobileNo || franchise?.mobile || "";
  const displayType = franchise?.displayType?.name;
  const state = franchise?.state || "—";
  const district = franchise?.district || "—";
  const town = franchise?.town || franchise?.city || "—";
  const pincode = franchise?.pincode || "—";
  // Registration date: prefer the analytics detail, fall back to the franchise
  // record so it renders even before / without the detail-view response.
  const registeredOn =
    detail?.registeredOn || franchise?.registeredOn || franchise?.createdAt;

  const plan = detail?.subscriptionPlan;
  const planName = getPlanName(plan?.planInfo);
  const posOrders = detail?.posOrders ?? 0;
  // Combine POS B2B orders with ROS B2B orders for the snapshot headline.
  const rosOrders = detail?.rosOrders ?? 0;
  const clubOrders = detail?.clubOrders ?? 0;
  const totalOrders = posOrders + rosOrders + clubOrders;
  const combinedB2B = (detail?.b2bposOrders ?? 0) + rosOrders;

  // Plan consumption details used in the plan popover.
  const planLimit = plan?.planInfo?.amountTo ?? 0;
  const planUsed = plan?.usedAmount ?? 0;

  return (
    <div className={className}>
      {/* Identity */}
      <AppCard bodyClassName="tw:p-3" className="tw:mb-4 tw:py-0">
        <div className="tw:flex tw:flex-wrap tw:items-start tw:justify-between tw:gap-3">
          <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-3">
            <div className="tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-indigo-50 tw:text-sm tw:font-bold tw:text-indigo-700 tw:ring-1 tw:ring-indigo-200">
              {getInitials(name)}
            </div>
            <div className="tw:min-w-0">
              <div className="tw:flex tw:items-center tw:gap-2">
                <span className="tw:truncate tw:text-base tw:font-bold tw:text-gray-900">
                  {name}
                </span>
                {displayType && (
                  <AppBadge variant="primary">{displayType}</AppBadge>
                )}
              </div>
              <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-0.5 tw:text-[11px] tw:text-gray-500">
                {refId && (
                  <span className="tw:inline-flex tw:items-center tw:gap-1">
                    <Store size={11} className="tw:text-gray-400" />
                    {refId}
                  </span>
                )}
                {mobile && (
                  <>
                    <span className="tw:text-gray-300">·</span>
                    <span className="tw:inline-flex tw:items-center tw:gap-1">
                      <PhoneCall size={11} className="tw:text-gray-400" />
                      {mobile}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* No Call button by design — Access Store only. */}
          <AppButton
            size="small"
            fill="outline"
            color="primary"
            onClick={openStore}
            disabled={!storeFid}
          >
            <ExternalLink size={14} className="tw:mr-1" />
            Access Store
          </AppButton>
        </div>

        {/* Labelled location + registration, compact inline row. */}
        <div className="tw:mt-2.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-4 tw:gap-y-1.5 tw:border-t tw:border-gray-100 tw:pt-2.5">
          <Field label="State" value={state} />
          <Field label="District" value={district} />
          <Field label="Town/City" value={town} />
          <Field label="Pincode" value={pincode} />
          <Field
            label="Registered On"
            value={
              registeredOn ? (
                <DateFormat value={registeredOn} formatStr="dd MMM yyyy" />
              ) : (
                "—"
              )
            }
          />
        </div>
      </AppCard>

      {/* Headline metrics — Sales / Orders / Customers / Plan. */}
      <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-2 tw:lg:grid-cols-4">
        <StatCard
          loading={detailLoading}
          icon={<Wallet size={18} />}
          iconClass="tw:bg-amber-50 tw:text-amber-600"
          value={<Amount value={detail?.totalSales ?? 0} decimalPlaces={0} />}
          label="Sales"
          sub={
            <>
              B2B <Amount value={detail?.b2bSales ?? 0} decimalPlaces={0} /> · B2C{" "}
              <Amount value={detail?.b2cSales ?? 0} decimalPlaces={0} />
            </>
          }
        />
        <StatCard
          loading={detailLoading}
          icon={<Package size={18} />}
          iconClass="tw:bg-orange-50 tw:text-orange-600"
          value={totalOrders}
          label="Orders"
          sub={`B2B ${combinedB2B} · B2C ${detail?.b2cposOrders ?? 0} · Club ${clubOrders}`}
        />
        <StatCard
          loading={detailLoading}
          icon={<Users size={18} />}
          iconClass="tw:bg-blue-50 tw:text-blue-600"
          value={detail?.customersCount ?? 0}
          label="Customers"
          sub={`${detail?.buyersCount ?? 0} SK buyers`}
        />
        <StatCard
          loading={detailLoading}
          icon={<CreditCard size={18} />}
          iconClass="tw:bg-emerald-50 tw:text-emerald-600"
          value={planName || "No active plan"}
          label="Plan"
          sub={
            plan?.planInfo?.type ? (
              <AppPopover
                triggerContent={
                  <button
                    type="button"
                    className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-medium tw:text-gray-400 tw:underline tw:decoration-dotted tw:underline-offset-2 tw:hover:text-primary"
                  >
                    <Eye size={10} />
                    View Details
                  </button>
                }
                side="top"
                align="start"
              >
                <div className="tw:min-w-[260px]">
                  <div className="tw:mb-2 tw:text-sm tw:font-bold tw:text-purple-800">
                    {planName}
                  </div>
                  {plan?.status && (
                    <KeyValue
                      label="Status"
                      size="xs"
                      horizontal
                      labelClassName="tw:w-24"
                    >
                      <AppBadge variant="primary">{plan.status}</AppBadge>
                    </KeyValue>
                  )}
                  <KeyValue
                    label="Validity"
                    size="xs"
                    horizontal
                    labelClassName="tw:w-24"
                  >
                    <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-600">
                      <DateFormat
                        value={plan.planStartAt || null}
                        formatStr="dd MMM yyyy"
                      />
                      <span>-</span>
                      <DateFormat
                        value={plan.planEndAt || null}
                        formatStr="dd MMM yyyy"
                      />
                    </div>
                  </KeyValue>
                  <KeyValue
                    label="Purchase Limit"
                    size="xs"
                    horizontal
                    labelClassName="tw:w-24"
                    valueClassName="tw:text-blue-600 tw:font-semibold"
                  >
                    <Amount value={planLimit} decimalPlaces={0} />
                  </KeyValue>
                  <KeyValue
                    label="Used"
                    size="xs"
                    horizontal
                    labelClassName="tw:w-24"
                    valueClassName="tw:text-red-600 tw:font-semibold"
                  >
                    <Amount value={planUsed} decimalPlaces={0} />
                  </KeyValue>
                  <KeyValue
                    label="Available"
                    size="xs"
                    horizontal
                    labelClassName="tw:w-24"
                    valueClassName="tw:text-green-600 tw:font-semibold"
                  >
                    <Amount
                      value={plan?.availableAmount ?? 0}
                      decimalPlaces={0}
                    />
                  </KeyValue>
                  {plan?.planInfo?.operationalFeeInfo && (
                    <KeyValue
                      label="Operational Fee"
                      size="xs"
                      horizontal
                      labelClassName="tw:w-24"
                    >
                      <span className="tw:text-xs">
                        {plan.planInfo.operationalFeeInfo.value}{" "}
                        <span className="tw:text-gray-500">
                          {plan.planInfo.operationalFeeInfo.type}
                        </span>
                      </span>
                    </KeyValue>
                  )}
                </div>
              </AppPopover>
            ) : (
              "—"
            )
          }
        />
      </div>
    </div>
  );
};

export default StoreSnapshot;
