import { useTranslation } from "react-i18next";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";

type CourierDetails = {
  shipmentType: "courier" | "selfShipment";
  courierName?: string;
  awbNo?: string;
  deliveryPersonName?: string;
  deliveryPersonContact?: string;
  vehicle?: string;
  shippedOn?: string;
  deliveredOn?: string;
};

type Props = {
  data: CourierDetails | null;
  className?: string;
};

const ShipmentDetail = ({ data, className }: Props) => {
  const { t } = useTranslation(["common"]);

  if (Object.keys(data || {}).length === 0) return null;

  return (
    <div
      className={`tw:border tw:rounded-lg tw:p-4 tw:bg-gray-50 ${className}`}
    >
      <div className="tw:text-sm tw:font-medium tw:mb-2">{t("shipmentDetails")}</div>
      {data?.shipmentType === "courier" && (
        <div className="tw:grid tw:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4">
          <KeyValue label={t("courierName")} size="sm">
            {data?.courierName || "N/A"}
          </KeyValue>
          <KeyValue label={t("awbNo")} size="sm">
            {data?.awbNo || "N/A"}
          </KeyValue>
          <KeyValue label={t("personName")} size="sm">
            {data?.deliveryPersonName || "N/A"}
          </KeyValue>
          <KeyValue label={t("personContactNo")} size="sm">
            {data?.deliveryPersonContact || "N/A"}
          </KeyValue>
        </div>
      )}

      {data?.shipmentType === "selfShipment" && (
        <div className="tw:grid tw:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4">
          <KeyValue label={t("personName")} size="sm">
            {data?.deliveryPersonName || "N/A"}
          </KeyValue>
          <KeyValue label={t("contactNo")} size="sm">
            {data?.deliveryPersonContact || "N/A"}
          </KeyValue>
          <KeyValue label={t("vehicleNo")} size="sm">
            {data?.vehicle || "N/A"}
          </KeyValue>
          <KeyValue label={t("awbNo")} size="sm">
            {data?.awbNo || "N/A"}
          </KeyValue>
          {data?.shippedOn && (
            <KeyValue label={t("shippedOn")} size="sm">
              <DateFormat
                value={data.shippedOn}
                formatStr="dd MMM yyyy hh:mm a"
              />
            </KeyValue>
          )}
          {data?.deliveredOn && (
            <KeyValue label={t("deliveredOn")} size="sm">
              <DateFormat
                value={data.deliveredOn}
                formatStr="dd MMM yyyy hh:mm a"
              />
            </KeyValue>
          )}
        </div>
      )}
    </div>
  );
};

export default ShipmentDetail;
