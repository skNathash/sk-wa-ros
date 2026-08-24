import { Activity } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useTheme from "~/hooks/useTheme";
import ChannelCard from "./theme2/ChannelCard";

type Props = {
  totalOrders: number;
  uniqueCustomers: number;
  value: number;
  title?: string;
  icon?: React.ReactNode;
  iconClassName?: string;
  loading?: boolean;
  /** Lane colour for the theme-2 card (dot + count). */
  dotClass?: string;
  numberClass?: string;
};

const OverviewSummary = ({
  totalOrders,
  uniqueCustomers,
  value,
  title = "Overview",
  icon = <Activity />,
  iconClassName = "tw:text-purple-600",
  loading = false,
  dotClass,
  numberClass,
}: Props) => {
  const isTheme2 = useTheme() === "theme-2";

  if (isTheme2) {
    return (
      <ChannelCard
        title={title}
        totalOrders={totalOrders}
        uniqueCustomers={uniqueCustomers}
        value={value}
        dotClass={dotClass}
        numberClass={numberClass}
        icon={icon}
        loading={loading}
      />
    );
  }

  return (
    <AppCard
      title={title}
      icon={icon}
      iconClassName={iconClassName}
      noPadding
      headerClassName="tw:px-3 tw:pt-3"
      className="tw:mb-0"
    >
      <div className="tw:grid tw:grid-cols-3 tw:gap-4 tw:px-3 tw:pb-3">
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
