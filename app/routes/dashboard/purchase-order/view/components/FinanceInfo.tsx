import React, { useState } from "react";
import { ChevronDown, ChevronUp, IndianRupee, InfoIcon } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppBadge from "~/components/core/badge/AppBadge";
import AppPopover from "~/components/core/popover/AppPopover";
import Divider from "~/components/core/divider/Divider";
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

const FinanceInfo: React.FC<FinanceInfoProps> = ({ financeInfo }) => {
  const { isMobile } = useScreenView();

  const [isExpanded, setIsExpanded] = useState(isMobile ? false : true);

  const handleExpand = () => {
    if (!isMobile) {
      return;
    }
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
      className={clsx(!isExpanded ? "tw:!pb-2" : "")}
      title={
        <div
          className={
            isMobile
              ? "tw:flex tw:justify-between tw:w-full tw:sm:cursor-pointer"
              : ""
          }
          onClick={handleExpand}
        >
          <div className="tw:flex-1">Financial Summary</div>
          {isMobile ? (
            <div>
              <button>
                {isExpanded ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
            </div>
          ) : null}
        </div>
      }
      icon={<IndianRupee size={16} />}
    >
      <div
        className={clsx(
          "tw:space-y-4 tw:text-sm",
          isExpanded ? "tw:block" : "tw:hidden"
        )}
      >
        <div className="tw:flex tw:justify-between tw:items-center">
          <div className="tw:text-gray-500">Total Products</div>
          <div className="tw:font-medium">{financeInfo.totalProducts}</div>
        </div>
        <div className="tw:flex tw:justify-between tw:items-center">
          <div className="tw:text-gray-500">Total Units</div>
          <div className="tw:font-medium">{financeInfo.totalUnits}</div>
        </div>
        <div className="tw:flex tw:justify-between tw:items-center">
          <div className="tw:text-gray-500">Order Value</div>
          <div className="tw:font-semibold tw:text-lg tw:text-blue-600">
            <Amount value={financeInfo.orderValue} decimalPlaces={2} />
          </div>
        </div>
        {financeInfo.commissionDetails?.skCommission ? (
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:text-gray-500">Platform Fee</div>
            <div className="tw:font-medium">
              <Amount
                value={financeInfo.commissionDetails.skCommission}
                decimalPlaces={2}
              />
            </div>
          </div>
        ) : null}
        {financeInfo.subscriptionPlanInfo?.subscribedAmount ? (
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:text-gray-500">Subscription Fee</div>
            <div className="tw:font-medium">
              <Amount
                value={financeInfo.subscriptionPlanInfo.subscribedAmount}
                decimalPlaces={2}
              />
            </div>
          </div>
        ) : null}
        {financeInfo.invoiceNo && (
          <>
            <Divider className="tw:!my-2" />
            <div className="tw:flex tw:justify-between tw:items-center">
              <div className="tw:text-gray-500">Invoice #</div>
              <div className="tw:flex tw:items-center tw:gap-2">
                <div className="tw:font-medium">{financeInfo.invoiceNo}</div>
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
            </div>
            <div className="tw:flex tw:justify-between tw:items-center">
              <div className="tw:text-gray-500">Invoice Amount</div>
              <div className="tw:font-medium">
                <Amount value={financeInfo.invoiceAmount} decimalPlaces={2} />
              </div>
            </div>

            {/* <Divider className="tw:!my-2" /> */}
          </>
        )}

        <div className="tw:flex tw:justify-between tw:items-center tw:hidden">
          <div className="tw:text-gray-500">Payment Status</div>
          <div className="tw:flex tw:items-center tw:gap-2">
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
        </div>
        {/* <div className="tw:text-green-600 tw:font-medium tw:text-sm tw:mt-4">
          {financeInfo.allItemsReceived
            ? "✓ All items received"
            : "Items pending"}
        </div> */}
      </div>
    </AppCard>
  );
};

export default FinanceInfo;
