import { Calendar, CreditCard, Eye, User } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import { Tag } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import Amount from "~/components/core/amount/Amount";
import { useTranslation } from "react-i18next";
import AppLink from "~/components/core/link/AppLink";

type MobileViewProps = {
  loading?: boolean;
  data: any[];
};

const MobileView: React.FC<MobileViewProps> = ({ loading, data }) => {
  const { t } = useTranslation(["common"]);
  return (
    <div>
      {loading ? (
        <div className="tw:text-center tw:py-8 tw:text-slate-500">
          <div className="tw:animate-spin tw:inline-block tw:w-6 tw:h-6 tw:border-2 tw:border-slate-300 tw:border-t-slate-600 tw:rounded-full tw:mb-2"></div>
          <div>{t("loadingTransactions")}</div>
        </div>
      ) : data && data.length > 0 ? (
        data.map((item) => (
          <div
            key={item.orderId}
            className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:mb-4 tw:bg-white tw:shadow-sm"
          >
            <div className="tw:flex tw:justify-between tw:gap-4 tw:mb-4">
              <AppBadge variant="outline" className="tw:text-xs">
                {item.orderType}
              </AppBadge>
              <AppBadge variant={item._typeColor || "default"}>
                {item.status}
              </AppBadge>
            </div>

            <div className="tw:mb-4">
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                <span className="tw:text-xs tw:text-slate-500 tw:font-medium">
                  {t("orderId")}:
                </span>
              </div>
              <span className="tw:bg-gray-100 tw:rounded-lg tw:p-2 tw:text-sm">
                <code>{item.orderRefNo}</code>
              </span>
            </div>

            <div className="tw:mb-4">
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                <span className="tw:text-xs tw:text-slate-500 tw:font-medium">
                  {t("amount")}:
                </span>
              </div>
              <Amount
                value={item.orderAmount}
                decimalPlaces={2}
                className="tw:text-lg tw:font-semibold"
              />
            </div>

            <Divider />

            <div className="tw:flex tw:gap-4 tw:items-center tw:mb-2">
              <User className="tw:text-slate-400 tw:w-4 tw:h-4" />
              <div className="tw:flex-1">
                <div className="tw:text-xs tw:text-slate-500 tw:font-medium tw:mb-1">
                  {t("customer")}:
                </div>
                {item.customerInfo?.isGuestCustomer ? (
                  <AppBadge variant="default">{t("walkinCustomer")}</AppBadge>
                ) : (
                  <AppLink
                    asLink
                    href={`/dashboard/network/view/b2c/${item.customerInfo?.customerId}`}
                    className="tw:text-sm tw:text-blue-600 hover:tw:text-blue-800"
                  >
                    {item.customerInfo?.name}
                  </AppLink>
                )}
              </div>
            </div>

            <div className="tw:flex tw:gap-4 tw:items-center tw:mb-2">
              <Calendar className="tw:text-slate-400 tw:w-4 tw:h-4" />
              <div className="tw:flex-1">
                <div className="tw:text-xs tw:text-slate-500 tw:font-medium tw:mb-1">
                  {t("date")}:
                </div>
                <span className="tw:text-sm">
                  <DateFormat value={item.orderedDate} />
                </span>
              </div>
            </div>

            <div className="tw:flex tw:gap-4 tw:items-center tw:mb-2">
              <Tag className="tw:text-slate-400 tw:w-4 tw:h-4" />
              <div className="tw:flex-1">
                <div className="tw:text-xs tw:text-slate-500 tw:font-medium tw:mb-1">
                  {t("items")}:
                </div>
                <span className="tw:text-sm">
                  {item.itemsCount} {t("items")}
                </span>
              </div>
            </div>

            <div className="tw:flex tw:gap-4 tw:items-center tw:mb-2">
              <CreditCard className="tw:text-slate-400 tw:w-4 tw:h-4" />
              <div className="tw:flex-1">
                <div className="tw:text-xs tw:text-slate-500 tw:font-medium tw:mb-1">
                  {t("payment")}:
                </div>
                <span className="tw:text-sm">{item.paymentMethod}</span>
              </div>
            </div>

            <Divider />

            <div className="tw:flex tw:justify-center tw:mb-2">
              <AppLink
                href={`/dashboard/orders/view/${item.orderId}`}
                asLink
                className="tw:w-full"
              >
                <AppButton
                  color="light"
                  fill="outline"
                  size="small"
                  className="tw:w-full"
                >
                  <Eye />
                  {t("view")}
                </AppButton>
              </AppLink>
            </div>
          </div>
        ))
      ) : (
        <div className="tw:text-center tw:py-8 tw:text-slate-500">
          <div className="tw:text-4xl tw:mb-2">📊</div>
          <div>{t("noTransactionsFound")}</div>
        </div>
      )}
    </div>
  );
};

export default MobileView;
