import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import KeyValue from "~/components/core/key-value/KeyValue";

type Props = {
  item: any;
  callback: (payload: { action: string; data?: any }) => void;
};

const Item = ({ item, callback }: Props) => {
  return (
    <AppCard>
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-5 tw:gap-4 tw:items-center">
        <KeyValue label="Reference ID" size="sm">
          {item.referenceId || item._id || "--"}
        </KeyValue>
        <KeyValue label="Amount" size="sm">
          <Amount value={item.depositedAmount || 0} decimalPlaces={2} />
        </KeyValue>
        <KeyValue label="Payment Mode" size="sm">
          {item.paymentMode || "--"}
        </KeyValue>
        <KeyValue label="Date" size="sm">
          <DateFormat value={item.createdAt} />
        </KeyValue>
        <KeyValue label="Status" size="sm">
          <AppBadge variant={item._statusColor} size="sm">
            {item._statusDisplay || "--"}
          </AppBadge>
        </KeyValue>
      </div>
      <Divider />
      <div className="tw:mt-4 tw:flex tw:gap-2 tw:justify-between">
        <AppButton
          size="small"
          color="secondary"
          noShadow
          fill="outline"
          onClick={() => {
            callback({ action: "viewOrders", data: item });
          }}
        >
          View Orders
        </AppButton>
        {item.status === "Created" ? (
          <AppButton
            size="small"
            color="primary"
            noShadow
            onClick={() => {
              callback({ action: "uploadReceipt", data: item });
            }}
          >
            Upload Receipt
          </AppButton>
        ) : null}
      </div>
    </AppCard>
  );
};

export default Item;
