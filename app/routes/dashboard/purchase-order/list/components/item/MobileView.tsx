import { Calendar, CheckCircle, Dot, Eye, IndianRupee } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import AppLink from "~/components/core/link/AppLink";
import Rbac from "~/components/core/rbac/Rbac";
import PurchaseOrderService from "~/services/PurchaseOrderService";

const rbacRoles = {
  receive: ["PURCHASE-ORDER.RECEIVE"],
};

type Props = {
  data: any;
  callback: (a: { action: string; data: any }) => void;
  tab?: string; // Added for compatibility
};

const MobileView = ({ data, callback }: Props) => {
  const { t } = useTranslation(["common"]);
  const formattedData = PurchaseOrderService.formatPurchaseOrderData(data);

  return (
    <div className="tw:border tw:border-gray-200 tw:rounded-md tw:p-4 tw:text-sm tw:mb-4">
      <div className="tw:flex tw:justify-between tw:items-start tw:mb-3">
        <div className="tw:flex tw:flex-col tw:gap-1">
          <AppBadge variant="light">
            <AppLink asLink href={`/dashboard/purchase-order/view/${data._id}`}>
              <code>{data.orderId}</code>
            </AppLink>
          </AppBadge>
          {formattedData._sourceType && (
            <AppBadge variant={formattedData._sourceType.color as any}>
              {formattedData._sourceType.name}
            </AppBadge>
          )}
        </div>
        <AppBadge variant={formattedData._statusColor as any}>
          {formattedData._statusLabel}
        </AppBadge>
      </div>
      <div className="tw:font-semibold">
        <AppLink
          asLink
          href={`/dashboard/vendor/view/${data.vendorDetails?.id}`}
        >
          {data.vendorDetails?.name}
        </AppLink>
      </div>
      <div className="tw:flex tw:gap-1 tw:text-sm tw:text-gray-500 tw:items-center">
        {data.items?.length} {t("items")}
        <span>
          <Dot size={14} />
        </span>
        <span className="tw:text-gray-500">
          {formattedData._totalQuantity} {t("items")}
        </span>
      </div>

      <Divider />

      <div className="tw:grid tw:grid-cols-2 tw:gap-2">
        <div className="tw:flex tw:gap-1 tw:items-center">
          <Calendar size={12} className="tw:text-gray-400" />
          <div>
            <div className="tw:text-xs tw:text-gray-500">Ordered Date</div>
            <div className="tw:text-sm">
              <DateFormat value={data.createdAt} formatStr="dd MMM yyyy" />
              <div className="tw:text-xs tw:text-gray-500">
                <DateFormat value={data.createdAt} formatStr="hh:mm a" />
              </div>
            </div>
          </div>
        </div>

        <div className="tw:flex tw:gap-1 tw:items-center">
          <Calendar size={12} className="tw:text-gray-400" />
          <div>
            <div className="tw:text-xs tw:text-gray-500">Delivery Date</div>
            <div className="tw:text-sm">
              <DateFormat
                value={data.expectedDeliveryDate}
                formatStr="dd MMM yyyy"
              />
              <div className="tw:text-xs tw:text-gray-500">
                <DateFormat
                  value={data.expectedDeliveryDate}
                  formatStr="hh:mm a"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="tw:flex tw:gap-1 tw:items-center">
          <IndianRupee size={12} className="tw:text-gray-400" />
          <div>
            <div className="tw:text-xs tw:text-gray-500">Total Amount</div>
            <div className="tw:text-sm">
              <Amount value={data.payableAmount || data.totalAmount || 0} />
            </div>
          </div>
        </div>
      </div>

      <Divider />

      <div className="tw:grid tw:grid-cols-2 tw:gap-2">
        <AppButton
          size="small"
          color="light"
          noShadow={true}
          onClick={() => callback({ action: "view", data: data })}
          className="tw:w-full"
          fill="outline"
        >
          <Eye />
          {t("viewDetails")}
        </AppButton>

        <Rbac roles={rbacRoles.receive}>
          {data._canReceive &&
            (data.status === "Approved" ||
              data.status === "Partially Received") && (
              <AppButton
                size="small"
                color="success"
                noShadow={true}
                onClick={() => callback({ action: "receive", data: data })}
                className="tw:w-full"
              >
                <CheckCircle />
                Receive
              </AppButton>
            )}
        </Rbac>
      </div>
    </div>
  );
};

export default MobileView;
