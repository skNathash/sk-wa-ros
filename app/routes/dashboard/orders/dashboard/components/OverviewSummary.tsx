import { Activity } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

type Props = {
  totalOrders: number;
  uniqueCustomers: number;
  value: number;
  title?: string;
  icon?: React.ReactNode;
  iconClassName?: string;
  loading?: boolean;
};

const OverviewSummary = ({
  totalOrders,
  uniqueCustomers,
  value,
  title = "Overview",
  icon = <Activity />,
  iconClassName = "tw:text-purple-600",
  loading = false,
}: Props) => {
  return (
    <AppCard
      title={title}
      icon={icon}
      iconClassName={iconClassName}
      className="tw:mb-0"
    >
      <div className="tw:grid tw:grid-cols-3 tw:gap-4">
        <div className="tw:text-center">
          <div className="tw:text-base tw:font-bold tw:text-green-600">
            {loading ? <AppSpinner /> : totalOrders}
          </div>
          <div className="tw:text-xs tw:uppercase">Total Orders</div>
        </div>

        <div className="tw:text-center">
          <div className="tw:text-base tw:font-bold tw:text-blue-600">
            {loading ? <AppSpinner /> : uniqueCustomers}
          </div>
          <div className="tw:text-xs tw:uppercase">Customers</div>
        </div>

        <div className="tw:text-center">
          <div className="tw:text-base tw:font-bold tw:text-orange-600">
            {loading ? <AppSpinner /> : <Amount value={value} />}
          </div>
          <div className="tw:text-xs tw:uppercase">Total Value</div>
        </div>
      </div>
    </AppCard>
  );
};

export default OverviewSummary;
