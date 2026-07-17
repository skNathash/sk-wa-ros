import { endOfMonth, sub } from "date-fns";
import { ChartLine } from "lucide-react";
import { useEffect, useState } from "react";
import type { DayPickerProps } from "react-day-picker";
import AppCard from "~/components/core/card/AppCard";
import AppChart from "~/components/core/chart/AppChart";
import AppSelect from "~/components/core/form/AppSelect";
import ExpenseService from "~/services/ExpenseService";
import MiscService from "~/services/MiscService";

const chartConfig = {
  amount: {
    label: "Total Amount",
    color: "#60a5fa",
  },
};

const Analytics = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<any[]>([]);

  const dt = new Date();

  const [months, setMonths] = useState<{ label: string; value: string }[]>([
    { label: "January", value: "0" },
    { label: "February", value: "1" },
    { label: "March", value: "2" },
    { label: "April", value: "3" },
    { label: "May", value: "4" },
    { label: "June", value: "5" },
    { label: "July", value: "6" },
    { label: "August", value: "7" },
    { label: "September", value: "8" },
    { label: "October", value: "9" },
    { label: "November", value: "10" },
    { label: "December", value: "11" },
  ]);

  const [years, setYears] = useState<{ label: string; value: string }[]>([]);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    dt.getMonth()?.toString() || "0"
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    dt.getFullYear().toString()
  );

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    let years: { label: string; value: string }[] = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push({
        label: "" + i,
        value: "" + i,
      });
    }
    setYears(years);
  }, []);

  useEffect(() => {
    applyFilter();
  }, [selectedMonth, selectedYear]);

  const applyFilter = async () => {
    try {
      setLoading(true);

      const startDate = new Date(
        Number(selectedYear),
        Number(selectedMonth),
        1
      );
      const endDate = new Date(
        Number(selectedYear),
        Number(selectedMonth) + 1,
        0
      );

      const response = await ExpenseService.getAnalytics({
        groupByCondition: "category",
        filter: {
          createdAt: {
            $gte: startDate.toISOString(),
            $lte: endOfMonth(endDate).toISOString(),
          },
        },
      });

      const monthResponse = await ExpenseService.getTransactions({
        filter: {
          createdAt: {
            $gte: startDate.toISOString(),
            $lte: endOfMonth(endDate).toISOString(),
          },
        },
      });

      setChartData(
        (response.data?.data || []).map((item: any) => ({
          category: item.categoryName,
          amount: item.totalAmount || 0,
        }))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
  };

  return (
    <AppCard
      title={
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-center tw:justify-between tw:gap-2 tw:w-full">
          <div className="card-title">Expense Analytics</div>
          <div className="tw:flex tw:gap-2 tw:mb-4">
            <AppSelect
              options={months}
              value={selectedMonth}
              onChange={handleMonthChange}
            />

            <AppSelect
              options={years}
              value={selectedYear}
              onChange={handleYearChange}
            />
          </div>
        </div>
      }
      icon={<ChartLine />}
    >
      {!loading && chartData.length === 0 ? (
        <div className="tw:flex tw:items-center tw:justify-center tw:h-[200px] tw:text-sm tw:text-gray-500 tw:border tw:border-dashed tw:border-gray-200 tw:rounded-lg">
          No data found
        </div>
      ) : (
        <AppChart
          config={chartConfig}
          data={chartData}
          className="tw:h-[200px] tw:w-full tw:border tw:border-gray-200 tw:rounded-lg"
          xAxisDataKey="category"
        />
      )}
    </AppCard>
  );
};

export default Analytics;

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};
