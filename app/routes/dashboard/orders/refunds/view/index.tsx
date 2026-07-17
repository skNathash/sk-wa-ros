import {
  BadgeIndianRupee,
  CheckCircle2,
  HandCoins,
  Info,
  Package,
  ScrollText,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppBadge from "~/components/core/badge/AppBadge";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppTab from "~/components/core/tab/AppTab";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import CommonService from "~/services/CommonService";
import OmsService from "~/services/OmsService";
import RefundSettlementModal from "~/shared/orders/refund-settlement/RefundSettlementModal";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import Logs from "./components/Logs";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: { path: "/dashboard" },
    langKey: "dashboard",
  },
  {
    label: "Orders",
    redirect: { path: "/dashbord/orders/dashboard" },
  },
  {
    label: "Order Refunds",
    langKey: "orderRefunds",
    redirect: { path: "/dashboard/orders/refunds/list" },
  },
  { label: "Order Refund Details", langKey: "orderRefundDetails" },
];

const TABS: TabItem[] = [
  { key: "basic", name: "Basic", icon: <Info size={14} /> },
  { key: "logs", name: "Logs", icon: <ScrollText size={14} /> },
];

interface SectionProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: string;
}

const Section = ({ title, children, action, icon, subtitle }: SectionProps) => (
  <AppCard>
    <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:mb-4 tw:pb-3 tw:border-b tw:border-slate-100">
      <div className="tw:flex tw:items-center tw:gap-2.5 tw:min-w-0">
        {icon ? (
          <span className="tw:flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-lg tw:bg-slate-100 tw:text-slate-600 tw:shrink-0">
            {icon}
          </span>
        ) : null}
        <div className="tw:flex tw:flex-col tw:min-w-0">
          <h3 className="tw:text-base tw:font-semibold tw:text-slate-900 tw:leading-tight tw:tracking-tight">
            {title}
          </h3>
          {subtitle ? (
            <span className="tw:text-xs tw:text-slate-500 tw:leading-tight tw:mt-0.5">
              {subtitle}
            </span>
          ) : null}
        </div>
      </div>
      {action}
    </div>
    {children}
  </AppCard>
);

const RefundView = () => {
  const { id } = useParams();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("basic");
  const [payOpen, setPayOpen] = useState(false);

  const [imgPreview, setImgPreview] = useState<{
    show: boolean;
    images: { id: string }[];
    initialImageId: string;
  }>({ show: false, images: [], initialImageId: "" });

  const fetchRefund = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const resp = await OmsService.getSellerRefundSettlements({
        filter: { _id: id },
      });
      const rows = Array.isArray(resp?.data?.data) ? resp.data.data : [];
      const formatted = OmsService.formatRefundResponse(rows);
      setData(formatted[0] || null);
    } catch (e) {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRefund();
  }, [fetchRefund]);

  const openImagePreview = (proofs: string[], initial: string) => {
    setImgPreview({
      show: true,
      images: (proofs || []).map((p) => ({ id: p })),
      initialImageId: initial,
    });
  };

  const closeImagePreview = () => {
    setImgPreview({ show: false, images: [], initialImageId: "" });
  };

  const renderHero = () => {
    const customerName = data.customerInfo?.name;
    const orderRef = data.orderRefNo || data.orderId;
    const customerLink =
      data.customerInfo?.customerId || data.customerInfo?.refId
        ? `/dashboard/network/view/${
            data.customerInfo?.customerType === "Retailer" ? "b2b" : "b2c"
          }/${data.customerInfo?.customerId || data.customerInfo?.refId}`
        : null;
    const paymentCount = Array.isArray(data.paymentMode)
      ? data.paymentMode.length
      : 0;
    return (
      <AppCard>
        {/* Status ribbon */}
        <div className="tw:-mx-4 tw:-mt-4 tw:sm:-mx-6 tw:sm:-mt-6 tw:mb-5 tw:px-4 tw:sm:px-6 tw:py-2.5 tw:bg-slate-50 tw:border-b tw:border-slate-100 tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:gap-x-3 tw:gap-y-1.5 tw:rounded-t-[inherit]">
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap tw:min-w-0">
            <AppBadge variant={data._statusColor || "secondary"}>
              {data.displayStatus || data.status || "-"}
            </AppBadge>
            {data.orderType ? (
              <AppBadge variant={data._typeColor || "secondary"}>
                {data.orderType}
              </AppBadge>
            ) : null}
            {data.source ? (
              <AppBadge variant="secondary">{data.source}</AppBadge>
            ) : null}
          </div>
          <span className="tw:sm:ml-auto tw:text-[11px] tw:uppercase tw:tracking-wider tw:text-slate-500 tw:tabular-nums tw:break-all tw:min-w-0 tw:sm:text-right">
            {data.refundSettlementId || "—"}
          </span>
        </div>

        {/* At-a-glance row */}
        <div className="tw:grid tw:gap-5 tw:grid-cols-1 tw:sm:grid-cols-3 tw:divide-y tw:sm:divide-y-0 tw:sm:divide-x tw:divide-slate-100">
          <div className="tw:flex tw:flex-col tw:gap-1 tw:sm:pr-5 tw:pb-5 tw:sm:pb-0">
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:uppercase tw:tracking-wider tw:text-slate-500">
              <Wallet size={12} />
              <span>Refund amount</span>
            </div>
            <div className="tw:text-[32px] tw:leading-none tw:font-semibold tw:text-rose-600 tw:tabular-nums">
              <Amount
                value={Number(data.refundAmount ?? 0)}
                decimalPlaces={2}
              />
            </div>
            {paymentCount > 0 ? (
              <div className="tw:text-xs tw:text-slate-500 tw:tabular-nums">
                across {paymentCount} payment{paymentCount === 1 ? "" : "s"}
              </div>
            ) : null}
          </div>

          <div className="tw:flex tw:flex-col tw:gap-1 tw:sm:px-5 tw:py-5 tw:sm:py-0 tw:min-w-0">
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:uppercase tw:tracking-wider tw:text-slate-500">
              <UserIcon size={12} />
              <span>Customer</span>
            </div>
            <div className="tw:text-base tw:font-semibold tw:text-slate-900 tw:wrap-break-word tw:leading-snug">
              {customerName ? (
                customerLink ? (
                  <AppLink asLink href={customerLink}>
                    {customerName}
                  </AppLink>
                ) : (
                  customerName
                )
              ) : (
                <span className="tw:text-slate-400 tw:font-normal">—</span>
              )}
            </div>
            <div className="tw:text-xs tw:text-slate-500 tw:flex tw:gap-2 tw:flex-wrap">
              {data.customerInfo?.customerType ? (
                <span>{data.customerInfo.customerType}</span>
              ) : null}
              {data.customerInfo?.mobile ? (
                <span className="tw:tabular-nums">
                  · {data.customerInfo.mobile}
                </span>
              ) : null}
            </div>
          </div>

          <div className="tw:flex tw:flex-col tw:gap-1 tw:sm:pl-5 tw:pt-5 tw:sm:pt-0 tw:min-w-0">
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:uppercase tw:tracking-wider tw:text-slate-500">
              <Package size={12} />
              <span>Order</span>
            </div>
            <div className="tw:text-base tw:font-semibold tw:text-slate-900 tw:wrap-break-word tw:leading-snug">
              {orderRef ? (
                data.orderId ? (
                  <AppLink
                    asLink
                    href={`/dashboard/orders/view/${data.orderId}`}
                  >
                    {orderRef}
                  </AppLink>
                ) : (
                  orderRef
                )
              ) : (
                <span className="tw:text-slate-400 tw:font-normal">—</span>
              )}
            </div>
            <div className="tw:text-xs tw:text-slate-500">
              {data.sellerInfo?.sellerName ? (
                <span>from {data.sellerInfo.sellerName}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="tw:mt-5 tw:pt-3 tw:border-t tw:border-slate-100 tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1 tw:text-xs tw:text-slate-500">
          {data.createdAt ? (
            <span>
              <span className="tw:text-slate-400">Created </span>
              <span className="tw:text-slate-700 tw:tabular-nums">
                <DateFormat
                  value={data.createdAt}
                  formatStr="dd MMM yyyy, hh:mm a"
                />
              </span>
              {data.createdBy?.name ? (
                <span className="tw:text-slate-500">
                  {" "}
                  by{" "}
                  <span className="tw:text-slate-700 tw:font-medium">
                    {data.createdBy.name}
                  </span>
                  {data.createdBy.userType
                    ? ` (${data.createdBy.userType})`
                    : ""}
                </span>
              ) : null}
            </span>
          ) : null}
          {data.submittedAt ? (
            <>
              <span className="tw:text-slate-300">·</span>
              <span>
                <span className="tw:text-slate-400">Submitted </span>
                <span className="tw:text-slate-700 tw:tabular-nums">
                  <DateFormat
                    value={data.submittedAt}
                    formatStr="dd MMM yyyy, hh:mm a"
                  />
                </span>
                {data.submittedBy?.name ? (
                  <span className="tw:text-slate-500">
                    {" "}
                    by{" "}
                    <span className="tw:text-slate-700 tw:font-medium">
                      {data.submittedBy.name}
                    </span>
                  </span>
                ) : null}
              </span>
            </>
          ) : null}
          {data.paymentRemarks ? (
            <>
              <span className="tw:text-slate-300">·</span>
              <span className="tw:italic tw:wrap-break-word">
                “{data.paymentRemarks}”
              </span>
            </>
          ) : null}
        </div>
      </AppCard>
    );
  };

  const renderPayNow = () => {
    if (data.status !== "Pending") return null;
    const customerName = data.customerInfo?.name;
    const amount = Number(data.refundAmount ?? 0);
    return (
      <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:gap-3 tw:px-3.5 tw:py-2.5 tw:rounded-lg tw:bg-amber-50 tw:border tw:border-amber-200/70">
        <span className="tw:flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-md tw:bg-amber-500 tw:text-white tw:shrink-0">
          <HandCoins size={16} strokeWidth={2.25} />
        </span>
        <div className="tw:flex tw:flex-col tw:min-w-0 tw:flex-1">
          <div className="tw:text-sm tw:font-semibold tw:text-slate-900 tw:leading-snug tw:wrap-break-word">
            Pay{" "}
            <span className="tw:text-amber-700 tw:tabular-nums">
              <Amount value={amount} decimalPlaces={2} />
            </span>
            {customerName ? (
              <>
                {" "}
                to <span>{customerName}</span>
              </>
            ) : (
              " to customer"
            )}
          </div>
          <span className="tw:text-[11px] tw:text-slate-500 tw:leading-tight">
            Settle offline, then record method, reference & proof.
          </span>
        </div>
        <AppButton
          color="warning"
          onClick={() => setPayOpen(true)}
          className="tw:font-semibold! tw:gap-1.5! tw:shrink-0"
        >
          <BadgeIndianRupee size={16} />
          Pay Now
        </AppButton>
      </div>
    );
  };

  const renderBasic = () => (
    <div className="tw:flex tw:flex-col tw:gap-3 tw:sm:gap-4">
      {renderHero()}
      {renderPayNow()}

      {/* <div className="tw:grid tw:gap-3 tw:grid-cols-1 tw:md:grid-cols-2">
        <Section
          title="Customer"
          icon={<UserIcon size={16} />}
          subtitle="Buyer getting money back"
        >
          <div className={fieldGrid}>
            <Field label="Name">
              {data.customerInfo?.name ? (
                data.customerInfo?.customerId || data.customerInfo?.refId ? (
                  <AppLink
                    asLink
                    href={`/dashboard/network/view/${
                      data.customerInfo?.customerType === "Retailer"
                        ? "b2b"
                        : "b2c"
                    }/${data.customerInfo?.customerId || data.customerInfo?.refId}`}
                  >
                    {data.customerInfo.name}
                  </AppLink>
                ) : (
                  data.customerInfo.name
                )
              ) : null}
            </Field>
            <Field label="Ref Id">{data.customerInfo?.refId}</Field>
            <Field label="Type">{data.customerInfo?.customerType}</Field>
            <Field label="Mobile">{data.customerInfo?.mobile}</Field>
            <Field label="Email">{data.customerInfo?.email}</Field>
          </div>
        </Section>

        <Section
          title="Seller"
          icon={<Store size={16} />}
          subtitle="Shop paying the money back"
        >
          <div className={fieldGrid}>
            <Field label="Name">{data.sellerInfo?.sellerName}</Field>
            <Field label="Ref Id">{data.sellerInfo?.sellerRefId}</Field>
            <Field label="Mobile">{data.sellerInfo?.mobile}</Field>
            <Field label="Email">{data.sellerInfo?.email}</Field>
          </div>
        </Section>
      </div> */}

      {/* {data.submittedBy?.name || data.createdBy?.name ? (
        <Section
          title="Activity"
          icon={<ClipboardList size={16} />}
          subtitle="Who started and sent this refund"
        >
          <div className={fieldGrid}>
            {data.createdBy?.name ? (
              <Field label="Created By">
                {data.createdBy.name}
                {data.createdBy.userType ? (
                  <span className="tw:text-slate-500 tw:font-normal">
                    {" "}
                    ({data.createdBy.userType})
                  </span>
                ) : null}
              </Field>
            ) : null}
            {data.submittedBy?.name ? (
              <Field label="Submitted By">{data.submittedBy.name}</Field>
            ) : null}
          </div>
        </Section>
      ) : null} */}

      {Array.isArray(data.paymentMode) && data.paymentMode.length > 0 ? (
        <Section
          title="Payment mode"
          icon={<Wallet size={16} />}
          action={
            data.submittedAt ? (
              <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:px-2 tw:py-1 tw:rounded-full tw:bg-emerald-50 tw:border tw:border-emerald-200/70 tw:text-[11px] tw:font-medium tw:text-emerald-700">
                <CheckCircle2 size={12} strokeWidth={2.5} />
                <span>Paid</span>
                <span className="tw:text-emerald-600/80 tw:tabular-nums">
                  ·{" "}
                  <DateFormat
                    value={data.submittedAt}
                    formatStr="dd MMM, hh:mm a"
                  />
                </span>
              </span>
            ) : (
              <span className="tw:text-xs tw:text-slate-500 tw:tabular-nums">
                {data.paymentMode.length} entr
                {data.paymentMode.length === 1 ? "y" : "ies"}
              </span>
            )
          }
        >
          <div className="tw:flex tw:flex-col tw:gap-3">
            {data.paymentMode.map((pm: any, idx: number) => (
              <div
                key={pm._id || idx}
                className="tw:rounded-lg tw:border tw:border-slate-100 tw:bg-slate-50/60"
              >
                <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:justify-between tw:gap-2 tw:px-4 tw:py-3 tw:bg-white tw:border-b tw:border-slate-100 tw:rounded-t-lg">
                  <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
                    {pm.type ? (
                      <span className="tw:text-sm tw:font-semibold tw:text-slate-900">
                        {pm.type}
                      </span>
                    ) : null}
                    {pm.paidVia ? (
                      <span className="tw:text-xs tw:text-slate-500">
                        via {pm.paidVia}
                      </span>
                    ) : null}
                    {pm.refNo ? (
                      <span className="tw:text-xs tw:text-slate-500 tw:tabular-nums">
                        · {pm.refNo}
                      </span>
                    ) : null}
                  </div>
                  <div className="tw:text-sm tw:font-semibold tw:text-slate-900 tw:tabular-nums">
                    <Amount value={pm.amount} decimalPlaces={2} />
                  </div>
                </div>
                {data.submittedAt ? (
                  <div className="tw:flex tw:items-center tw:gap-2 tw:px-4 tw:py-2 tw:bg-emerald-50/60 tw:text-[12px] tw:text-emerald-800">
                    <CheckCircle2
                      size={13}
                      strokeWidth={2.5}
                      className="tw:text-emerald-600 tw:shrink-0"
                    />
                    <span className="tw:font-medium">Paid</span>
                    <span className="tw:text-emerald-700/80 tw:tabular-nums">
                      <DateFormat
                        value={data.submittedAt}
                        formatStr="dd MMM yyyy, hh:mm a"
                      />
                    </span>
                    {data.submittedBy?.name ? (
                      <span className="tw:text-emerald-700/70">
                        by{" "}
                        <span className="tw:font-medium tw:text-emerald-800">
                          {data.submittedBy.name}
                        </span>
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="tw:flex tw:items-center tw:gap-2 tw:px-4 tw:py-2 tw:bg-amber-50/60 tw:text-[12px] tw:text-amber-800">
                    <HandCoins
                      size={13}
                      strokeWidth={2.5}
                      className="tw:text-amber-600 tw:shrink-0"
                    />
                    <span className="tw:font-medium">Awaiting payment</span>
                  </div>
                )}
                {Array.isArray(pm.proof) && pm.proof.length > 0 ? (
                  <div className="tw:px-4 tw:py-3">
                    <div className="tw:text-[11px] tw:uppercase tw:tracking-wider tw:text-slate-500 tw:mb-2">
                      Proof ({pm.proof.length})
                    </div>
                    <div className="tw:grid tw:gap-2 tw:grid-cols-[repeat(auto-fill,minmax(88px,1fr))] tw:sm:grid-cols-[repeat(auto-fill,minmax(72px,1fr))]">
                      {pm.proof.map((p: string, i: number) => (
                        <button
                          type="button"
                          key={i}
                          className="tw:aspect-square tw:border tw:border-slate-200 tw:rounded-md tw:overflow-hidden tw:cursor-pointer tw:hover:border-slate-400 tw:transition-colors tw:bg-white"
                          onClick={() => openImagePreview(pm.proof, p)}
                        >
                          <ImgRender
                            assetId={p}
                            className="tw:w-full tw:h-full tw:object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );

  return (
    <>
      <AppHeader title="Order Refund Details" />
      <div className="page-bg tw:p-3 tw:sm:p-4 app-page">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-3" />

          {loading ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-40">
              <AppSpinner />
            </div>
          ) : !data ? (
            <AppCard>
              <NoData />
            </AppCard>
          ) : (
            <>
              <AppTab
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab.key)}
                className="tw:mb-3"
              />

              {activeTab === "basic" ? renderBasic() : null}
              {activeTab === "logs" ? (
                <Logs logs={data.auditLog || []} />
              ) : null}
            </>
          )}
        </div>
      </div>
      <ImgPreviewModal
        show={imgPreview.show}
        callback={closeImagePreview}
        images={imgPreview.images}
        initialImageId={imgPreview.initialImageId}
      />
      <RefundSettlementModal
        show={payOpen}
        orderId={data?.orderId}
        refundSettlementId={data?._id}
        pendingRefundAmount={Number(data?.refundAmount ?? 0)}
        callback={(d) => {
          setPayOpen(false);
          if (d.action === "submit") {
            fetchRefund();
          }
        }}
      />
    </>
  );
};

export default RefundView;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Order Refund Details"),
    },
  ];
}
