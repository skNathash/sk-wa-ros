import clsx from "clsx";
import { CreditCard } from "lucide-react";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";
import OmsService from "~/services/OmsService";

export const ALL_STATUS = "All";

const STATUS_OPTIONS = [
  { name: "All", value: ALL_STATUS, statusColor: "primary", statuses: [] },
  ...OmsService.getOrderStatuses(),
];

type OrderStatusProps = {
  /** Currently applied status value (`"All"` for no status filter). */
  value?: string;
  onChange: (value: string) => void;
  /** Per-status counts keyed by status value, plus `All`. */
  counts?: Record<string, number>;
  /** Payment-due toggle — independent of the status selection. */
  paymentDue?: boolean;
  onPaymentDueChange?: (next: boolean) => void;
  /** Badge for the payment-due chip. */
  paymentDueCount?: number;
  className?: string;
};

const OrderStatus = ({
  value = ALL_STATUS,
  onChange,
  counts,
  paymentDue = false,
  onPaymentDueChange,
  paymentDueCount,
  className,
}: OrderStatusProps) => {
  return (
    <FilterChipGroup className={clsx("tw:min-w-0", className)}>
      {STATUS_OPTIONS.map((option) => (
        <FilterChip
          key={option.value}
          active={value === option.value}
          count={counts?.[option.value]}
          onClick={() => onChange(option.value)}
        >
          {option.name}
        </FilterChip>
      ))}

      {onPaymentDueChange && (
        <>
          <span
            aria-hidden
            className="tw:mx-1 tw:h-5 tw:w-px tw:shrink-0 tw:self-center tw:bg-gray-200"
          />
          <FilterChip
            active={paymentDue}
            count={paymentDueCount}
            leadingIcon={<CreditCard />}
            onClick={() => onPaymentDueChange(!paymentDue)}
          >
            Payment due
          </FilterChip>
        </>
      )}
    </FilterChipGroup>
  );
};

export default OrderStatus;
export type { OrderStatusProps };
