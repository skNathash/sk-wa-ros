import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  InfoIcon,
  Wallet,
} from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppBadge from "~/components/core/badge/AppBadge";
import AppPopover from "~/components/core/popover/AppPopover";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import useScreenView from "~/hooks/useScreenView";
import clsx from "clsx";

interface FinanceInfoProps {
  financeInfo: {
    totalProducts: number;
    totalUnits: number;
    orderValue: number;
    invoiceNo: string;
    invoiceAmount: number;
    paymentStatus: string;
    allItemsReceived: boolean;
    paymentSummary?: Array<{
      paymentMode: string;
      orderAmount: number;
      amount: number;
      referenceNo: string;
      paymentDate: string;
    }>;
    invoiceDetails?: {
      refno: string;
      remarks: string;
      invoiceDate: string;
      documentAssetIds: string[];
      amount: number;
    };
    commissionDetails?: {
      skCommission: number;
    } | null;
    subscriptionPlanInfo?: {
      subscribedAmount?: number | null;
    } | null;
  };
}

const InfoRow = ({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={clsx(
      "tw:flex tw:justify-between tw:items-center tw:gap-3 tw:py-2.5",
      className,
    )}
  >
    <span className="tw:text-sm tw:text-gray-500 tw:shrink-0">{label}</span>
    <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:text-right tw:min-w-0">
      {children}
    </div>
  </div>
);

const FinanceInfo: React.FC<FinanceInfoProps> = ({ financeInfo }) => {
  const { isMobile } = useScreenView();

  const [isExpanded, setIsExpanded] = useState(isMobile ? false : true);

  const handleExpand = () => {
    if (!isMobile) return;
    setIsExpanded(!isExpanded);
  };

  if (!financeInfo) return null;

  const hasPaymentInfo =
    financeInfo.paymentSummary && financeInfo.paymentSummary.length > 0;
  const paymentInfo = hasPaymentInfo ? financeInfo.paymentSummary![0] : null;

  const hasInvoiceInfo =
    financeInfo.invoiceDetails &&
    Object.keys(financeInfo.invoiceDetails).length > 0;
  const invoiceInfo = hasInvoiceInfo ? financeInfo.invoiceDetails : null;

  return (
    <AppCard
      className={clsx("tw:h-full tw:mb-0!", !isExpanded && "tw:pb-2!")}
      headerClassName="tw:border-b tw:border-gray-100 tw:pb-3"
      iconClassName="tw:mr-0!"
      title={
        // `flex-1 min-w-0` — not `w-full`: this row is a flex sibling of the
        // card's icon, so a full-width child overflows the header by the icon
        // and gap and the chevron lands outside the card's padding (clipped by
        // `overflow-clip`) instead of aligned with the values below.
        <div
          className={
            isMobile
              ? "tw:flex tw:flex-1 tw:min-w-0 tw:items-center tw:justify-between tw:gap-2 tw:sm:cursor-pointer"
              : ""
          }
          onClick={handleExpand}
        >
          <div className="tw:min-w-0 tw:truncate">Financial Summary</div>
          {isMobile ? (
            <button
              type="button"
              aria-label="Toggle financial details"
              className="tw:shrink-0 tw:text-gray-400"
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          ) : null}
        </div>
      }
      icon={<Wallet size={16} className="tw:text-gray-500" />}
    >
      <div
        className={clsx(
          "tw:divide-y tw:divide-gray-100",
          isExpanded ? "tw:block" : "tw:hidden",
        )}
      >
        <InfoRow label="Total Products">{financeInfo.totalProducts}</InfoRow>

        <InfoRow label="Total Units">{financeInfo.totalUnits}</InfoRow>

        <InfoRow label="Order Value">
          <span className="tw:text-lg tw:font-bold tw:text-emerald-600">
            <Amount value={financeInfo.orderValue} decimalPlaces={2} />
          </span>
        </InfoRow>

        {financeInfo.commissionDetails?.skCommission ? (
          <InfoRow label="Platform Fee">
            <Amount
              value={financeInfo.commissionDetails.skCommission}
              decimalPlaces={2}
            />
          </InfoRow>
        ) : null}

        {financeInfo.subscriptionPlanInfo?.subscribedAmount ? (
          <InfoRow label="Subscription Fee">
            <Amount
              value={financeInfo.subscriptionPlanInfo.subscribedAmount}
              decimalPlaces={2}
            />
          </InfoRow>
        ) : null}

        {financeInfo.invoiceNo && (
          <>
            <InfoRow label="Invoice #">
              <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
                <span>{financeInfo.invoiceNo}</span>
                {hasInvoiceInfo && (
                  <AppPopover
                    triggerContent={
                      <InfoIcon className="tw:text-blue-500 tw:w-4 tw:h-4 tw:cursor-pointer tw:hover:text-blue-600" />
                    }
                    side="top"
                    align="center"
                  >
                    <div className="tw:p-3 tw:space-y-2 tw:min-w-[200px]">
                      <div className="tw:font-medium tw:text-gray-900 tw:border-b tw:pb-2">
                        Invoice Details
                      </div>
                      {invoiceInfo?.invoiceDate && (
                        <div className="tw:flex tw:justify-between tw:items-center">
                          <span className="tw:text-gray-600 tw:text-sm">
                            Invoice Date:
                          </span>
                          <span className="tw:font-medium tw:text-sm">
                            <DateFormat
                              value={invoiceInfo.invoiceDate}
                              formatStr="dd MMM yyyy"
                            />
                          </span>
                        </div>
                      )}
                      {invoiceInfo?.amount && (
                        <div className="tw:flex tw:justify-between tw:items-center">
                          <span className="tw:text-gray-600 tw:text-sm">
                            Amount:
                          </span>
                          <span className="tw:font-medium tw:text-sm">
                            <Amount
                              value={invoiceInfo.amount}
                              decimalPlaces={2}
                            />
                          </span>
                        </div>
                      )}
                      {invoiceInfo?.remarks && (
                        <div className="tw:flex tw:justify-between tw:items-start">
                          <span className="tw:text-gray-600 tw:text-sm">
                            Remarks:
                          </span>
                          <span className="tw:font-medium tw:text-sm tw:text-right tw:max-w-[120px]">
                            {invoiceInfo.remarks}
                          </span>
                        </div>
                      )}
                      {invoiceInfo?.documentAssetIds &&
                        invoiceInfo.documentAssetIds.length > 0 && (
                          <div className="tw:flex tw:justify-between tw:items-center">
                            <span className="tw:text-gray-600 tw:text-sm">
                              Documents:
                            </span>
                            <span className="tw:font-medium tw:text-sm">
                              {invoiceInfo.documentAssetIds.length} file(s)
                            </span>
                          </div>
                        )}
                    </div>
                  </AppPopover>
                )}
              </div>
            </InfoRow>

            <InfoRow label="Invoice Amount">
              <Amount value={financeInfo.invoiceAmount} decimalPlaces={2} />
            </InfoRow>
          </>
        )}

        {financeInfo.paymentStatus ? (
          <InfoRow label="Payment Status" className="tw:hidden">
            <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
              <AppBadge
                variant={
                  financeInfo.paymentStatus.toLowerCase() === "paid"
                    ? "success"
                    : "danger"
                }
                className="tw:uppercase"
              >
                {financeInfo.paymentStatus}
              </AppBadge>
              {hasPaymentInfo && (
                <AppPopover
                  triggerContent={
                    <InfoIcon className="tw:text-blue-500 tw:w-4 tw:h-4 tw:cursor-pointer tw:hover:text-blue-600" />
                  }
                  side="top"
                  align="center"
                >
                  <div className="tw:p-3 tw:space-y-2 tw:min-w-[200px]">
                    <div className="tw:font-medium tw:text-gray-900 tw:border-b tw:pb-2">
                      Payment Details
                    </div>
                    {paymentInfo?.referenceNo && (
                      <div className="tw:flex tw:justify-between tw:items-center">
                        <span className="tw:text-gray-600 tw:text-sm">
                          Reference ID:
                        </span>
                        <span className="tw:font-medium tw:text-sm">
                          {paymentInfo.referenceNo}
                        </span>
                      </div>
                    )}
                    {paymentInfo?.paymentDate && (
                      <div className="tw:flex tw:justify-between tw:items-center">
                        <span className="tw:text-gray-600 tw:text-sm">
                          Payment Date:
                        </span>
                        <span className="tw:font-medium tw:text-sm">
                          <DateFormat
                            value={paymentInfo.paymentDate}
                            formatStr="dd MMM yyyy"
                          />
                        </span>
                      </div>
                    )}
                    {paymentInfo?.paymentMode && (
                      <div className="tw:flex tw:justify-between tw:items-center">
                        <span className="tw:text-gray-600 tw:text-sm">
                          Payment Mode:
                        </span>
                        <span className="tw:font-medium tw:text-sm">
                          {paymentInfo.paymentMode}
                        </span>
                      </div>
                    )}
                    {paymentInfo?.amount && (
                      <div className="tw:flex tw:justify-between tw:items-center">
                        <span className="tw:text-gray-600 tw:text-sm">
                          Amount:
                        </span>
                        <span className="tw:font-medium tw:text-sm">
                          <Amount value={paymentInfo.amount} decimalPlaces={2} />
                        </span>
                      </div>
                    )}
                  </div>
                </AppPopover>
              )}
            </div>
          </InfoRow>
        ) : null}
      </div>
    </AppCard>
  );
};

export default FinanceInfo;
