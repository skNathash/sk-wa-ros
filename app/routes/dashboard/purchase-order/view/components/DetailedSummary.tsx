import { List } from "lucide-react";
import type { SwiperOptions } from "swiper/types";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";

interface DetailedSummaryProps {
  summaryData?: any;
  poCharge?: number | null;
}

const DetailedSummary = ({ summaryData, poCharge }: DetailedSummaryProps) => {
  if (!summaryData) return null;

  const summaryItems: Array<{
    label: string;
    value: number;
    type: "count" | "amount";
    color:
      | "primary"
      | "secondary"
      | "success"
      | "danger"
      | "warning"
      | "info"
      | "light"
      | "dark";
  }> = [
    {
      label: "PO Value",
      value: summaryData.value || 0,
      type: "amount",
      color: "success",
    },
    {
      label: "Requested Items",
      value: summaryData.stock || 0,
      type: "count",
      color: "primary",
    },
    {
      label: "Received Items",
      value: summaryData.receivedStock || 0,
      type: "count",
      color: "success",
    },
  ];

  // Add conditional items
  if (summaryData.looseStock > 0) {
    summaryItems.push(
      {
        label: "Loose Stock Requested",
        value: summaryData.looseStock || 0,
        type: "count",
        color: "secondary",
      },
      {
        label: "Loose Stock Received",
        value: summaryData.receivedLooseStock || 0,
        type: "count",
        color: "success",
      }
    );
  }

  if (summaryData.invoiceValue > 0) {
    summaryItems.push({
      label: "Invoice Value",
      value: summaryData.invoiceValue,
      type: "amount",
      color: "info",
    });
  }

  if (summaryData.pendingPayment > 0) {
    summaryItems.push({
      label: "Pending Payment",
      value: summaryData.pendingPayment,
      type: "amount",
      color: "warning",
    });
  }

  return (
    <AppCard title="Summary" icon={<List />}>
      <div className="tw:grid tw:md:grid-cols-2 tw:gap-x-4 tw:gap-y-2">
        {summaryItems.map((item) => (
          <KeyValue
            label={item.label}
            key={item.label}
            horizontal
            labelClassName="tw:w-1/2"
            size="sm"
          >
            :{" "}
            <span className={getColor(item.color)}>
              {item.type === "amount" ? (
                <Amount value={item.value} decimalPlaces={2} />
              ) : (
                item.value.toLocaleString()
              )}
            </span>
          </KeyValue>
        ))}

        {poCharge ? (
          <KeyValue
            label="Platform Fee"
            horizontal
            labelClassName="tw:w-1/2"
            size="sm"
          >
            :{" "}
            <Amount
              value={poCharge}
              decimalPlaces={2}
              className="tw:text-red-500"
            />
          </KeyValue>
        ) : null}
      </div>
    </AppCard>
  );
};

const getColor = (color: string) => {
  switch (color) {
    case "primary":
      return "tw:text-primary";
    case "secondary":
      return "tw:text-secondary";
    case "success":
      return "tw:text-green-500";
    case "danger":
      return "tw:text-red-500";
    case "warning":
      return "tw:text-yellow-500";
    case "info":
      return "tw:text-blue-500";
    case "light":
      return "tw:text-gray-500";
    case "dark":
      return "tw:text-gray-800";
  }
};

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 10,
};

export default DetailedSummary;
