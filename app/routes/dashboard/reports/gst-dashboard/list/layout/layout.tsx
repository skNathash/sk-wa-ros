import { format, startOfMonth, sub } from "date-fns";
import { useEffect, useState } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Outlet, useLocation, useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import Summary from "./components/Summary";
import { defaultSummaryData } from "./helper";
import ReportService from "~/services/ReportService";
import AuthService from "~/services/AuthService";
import MiscService from "~/services/MiscService";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Reports",
    redirect: {
      path: "/dashboard/reports",
    },
  },
  {
    label: "GST Dashboard",
  },
];

const tabs: TabItem[] = [
  {
    name: "Products Level",
    key: "products-level",
  },
  {
    name: "HSN Summary",
    key: "hsn-summary",
  },
  {
    name: "Rate Summary",
    key: "rate-summary",
  },
  {
    name: "Reports",
    key: "reports",
  },
];

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const defaultDateRange = [startOfMonth(new Date()), new Date()];

const Layout = () => {
  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedDate, setSelectedDate] = useState<Date | Date[]>(
    defaultDateRange,
  );

  const [summary, setSummary] = useState<any[]>([...defaultSummaryData]);

  const dateFrom = searchParams?.get("dateFrom");
  const dateTo = searchParams?.get("dateTo");

  useEffect(() => {
    if (!dateFrom && !dateTo) {
      setSearchParams({
        dateFrom: defaultDateRange[0].toISOString(),
        dateTo: defaultDateRange[1].toISOString(),
      });
    }

    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      setSelectedDate([fromDate, toDate]);

      loadSummary();
    }
  }, [dateFrom, dateTo]);

  let activeTab = "products-level";
  if (location.pathname.includes("hsn-summary")) {
    activeTab = "hsn-summary";
  } else if (location.pathname.includes("rate-summary")) {
    activeTab = "rate-summary";
  } else if (location.pathname.includes("gst-dashboard/reports")) {
    activeTab = "reports";
  } else {
    activeTab = "products-level";
  }

  const onTabChange = (tab: TabItem) => {
    const params = {
      dateFrom: dateFrom || "",
      dateTo: dateTo || "",
    };
    if (tab.key === "products-level") {
      appNav.to("/dashboard/reports/gst-dashboard/products-level", params);
    } else if (tab.key === "hsn-summary") {
      appNav.to("/dashboard/reports/gst-dashboard/hsn-summary", params);
    } else if (tab.key === "rate-summary") {
      appNav.to("/dashboard/reports/gst-dashboard/rate-summary", params);
    } else if (tab.key === "reports") {
      appNav.to("/dashboard/reports/gst-dashboard/reports", params);
    }
  };

  const handleDateChange = (value: Date[] | Date) => {
    if (!Array.isArray(value) || value.length !== 2) return;
    setSearchParams({
      dateFrom: format(value[0], "yyyy-MM-dd"),
      dateTo: format(value[1], "yyyy-MM-dd"),
    });
  };

  const loadSummary = async () => {
    if (!dateFrom || !dateTo) {
      return;
    }

    const fid = AuthService.getLoggedInUserId();
    const params = {
      startDate: format(new Date(dateFrom), "yyyy-MM-dd"),
      endDate: format(new Date(dateTo), "yyyy-MM-dd"),
    };
    const r = await ReportService.getGstDashboardCardSummary(fid, params);
    const d = r?.data?.data || {};
    const formatted: Record<string, number> = {
      gstCollected: d.TotalGSTCollected || 0,
      gstInwarded: d.TotalGSTInwarded || 0,
      gstPayable: d.NetGSTLiable || 0,
      finalGstToPay: d.NetGSTPayable || 0,
      uniqueHsnCodes: d.TotalHSNCodes || 0,
    };
    setSummary(
      defaultSummaryData.map((item) => ({
        ...item,
        value: formatted[item.valueKey] || 0,
      })),
    );
  };

  return (
    <>
      <AppHeader title="GST Dashboard" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:mb-4">
            <div>
              <AppBreadcrumbs data={breadcrumbs} />
              <div className="tw:text-sm tw:text-gray-500">
                Analyze GST inward, collected, and net tax obligations.
              </div>
            </div>

            <div>
              <AppDateInput
                callback={handleDateChange}
                value={selectedDate}
                dateConfig={dateConfig}
                size="sm"
                hideClose={true}
              />
            </div>
          </div>
          <Summary summary={summary} />

          <AppTab
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            className="tw:mb-4"
          />
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default Layout;
