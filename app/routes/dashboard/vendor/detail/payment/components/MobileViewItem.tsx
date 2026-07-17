import {
  Calendar,
  BadgeDollarSign,
  FileText,
  ArrowRight,
  Tag,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";

type Props = {
  data: any;
  callback: (a: { action: string; data: any }) => void;
};

const MobileViewItem = ({ data, callback }: Props) => {
  const { t } = useTranslation(["common"]);

  return (
    <div
      onClick={() => callback({ action: "view", data })}
      className="tw:cursor-pointer"
    >
      <div className="tw:border tw:border-gray-200 tw:rounded-md tw:p-4 tw:text-sm tw:h-full tw:mb-4">
        {/* Block 1: Date, Type, PO ID */}
        <div className="tw:flex tw:justify-between tw:items-start tw:mb-3">
          <div>
            {/* PO ID */}
            <div className="tw:text-sm tw:font-semibold tw:text-gray-700 tw:mb-1">
              <AppLink
                asLink
                href={`/dashboard/purchase-order/view/${data?.sourceId}`}
              >
                {data.sourceReference}
              </AppLink>
            </div>
            {/* Date */}
            <div className="tw:text-sm tw:text-gray-500 tw:flex tw:items-center tw:gap-2">
              <Calendar size={16} className="tw:text-gray-400" />
              <DateFormat value={data.transactionDate} />
            </div>
          </div>
          {/* Type */}
          <div className="tw:flex tw:flex-col tw:items-end">
            <AppBadge variant={data.sourceVariantColor || "default"}>
              {data._sourceTypeLbl || "-"}
            </AppBadge>
          </div>
        </div>

        {/* Block 2: Status, Amount */}
        <div className="tw:mb-3">
          <div className="tw:text-xs tw:font-semibold tw:text-gray-600 tw:mb-1">
            {t("paymentDetails")}
          </div>
          <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
            {/* Status */}
            <div className="tw:flex tw:items-center tw:gap-2">
              <Tag size={16} className="tw:text-gray-400" />
              {data.status ? (
                <AppBadge
                  variant={data._statusColor || "default"}
                  className="tw:flex tw:items-center tw:gap-1 tw:uppercase"
                >
                  {data._status}
                </AppBadge>
              ) : (
                <span>-</span>
              )}
            </div>
            {/* Amount */}
            <div className="tw:flex tw:items-center tw:gap-2">
              <CreditCard size={16} className="tw:text-gray-400" />
              <span className="tw:font-semibold">
                <Amount value={data.amount ?? 0} />
              </span>
            </div>
          </div>
        </div>

        {/* Block 3: Remarks */}
        {data.description && (
          <div className="tw:mb-3">
            <div className="tw:text-xs tw:font-semibold tw:text-gray-600 tw:mb-1">
              Remarks
            </div>
            <div className="tw:flex tw:items-start tw:gap-2">
              <MessageSquare size={16} className="tw:text-gray-400 tw:mt-0.5" />
              <span className="tw:text-sm tw:text-gray-600 tw:flex-1">
                {data.description}
              </span>
            </div>
          </div>
        )}

        {/* Block 4: Action Buttons */}
        <div className="tw:flex tw:gap-2">
          <AppButton
            size="small"
            color="light"
            noShadow={true}
            onClick={(e) => {
              e.stopPropagation();
              callback({ action: "view", data });
            }}
            className="tw:flex-1"
            fill="outline"
          >
            {t("viewDetails")}
            <ArrowRight size={16} className="tw:ml-2" />
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default MobileViewItem;
