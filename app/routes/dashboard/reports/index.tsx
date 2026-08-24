import { addMonths, endOfMonth, isAfter, startOfMonth, sub } from "date-fns";
import {
  BarChart,
  Box,
  Building2,
  Coins,
  CreditCard,
  Eye,
  FilePlus,
  FileText,
  Globe,
  List,
  RotateCcw,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { DayPickerProps } from "react-day-picker";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import MiscService from "~/services/MiscService";
import PageAccessService from "~/services/PageAccessService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import { downloadReport, prepareParams } from "./helper";
import ReportDownloadOption from "~/shared/others/components/ReportDownloadOption";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import AccountsNavChips from "~/shared/accounts/components/accounts-nav-chips/AccountsNavChips";
import PayablesReceivablesSummary from "~/shared/accounts/components/payables-receivables-summary/PayablesReceivablesSummary";
import RecentEvents from "~/shared/insights/components/recent-events/RecentEvents";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";
import AccountsSidePane from "~/shared/accounts/components/accounts-side-pane/AccountsSidePane";

export async function clientLoader() {
  return PageAccessService.canAccessPage([]);
}

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const Reports = () => {
  const { t } = useTranslation(["common", "menu"]);

  const appNav = useAppNav();

  const reports = getReports();

  const appToast = useAppToast();

  const [busyloader, setBusyloader] = useState({
    show: false,
  });

  // Hydrate the shared date range from `month`/`year` query params (written
  // by the expense summary's month/year selects) when present; otherwise
  // default to the current month.
  const [searchParams] = useSearchParams();
  const [dateRange, setDateRange] = useState<Date[]>(() => {
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const month = Number(monthParam);
    const year = Number(yearParam);
    if (
      monthParam !== null &&
      yearParam !== null &&
      Number.isInteger(month) &&
      month >= 0 &&
      month <= 11 &&
      Number.isInteger(year) &&
      year > 0
    ) {
      const base = new Date(year, month, 1);
      return [startOfMonth(base), endOfMonth(base)];
    }
    return [startOfMonth(new Date()), endOfMonth(new Date())];
  });

  const onDownload = (data: any, fileType: string) => {
    const params = prepareParams({
      startDate: dateRange[0],
      endDate: dateRange[1] || dateRange[0],
      fileType,
    });
    setBusyloader({ show: true });

    try {
      const result = downloadReport(data.dataKey, params);
      setBusyloader({ show: false });

      if (result && result.success) {
        // The ReportService already handles opening the URL in a new tab
        console.log("Report download initiated successfully");
      } else {
        appToast.show({
          msg: t("linkNotFound"),
          color: "danger",
        });
      }
    } catch (error) {
      setBusyloader({ show: false });
      appToast.show({
        msg: t("linkNotFound"),
        color: "danger",
      });
    }
  };

  const isRangeOver3Months = (start: Date, end: Date) => {
    // Use date-fns to compute the allowed max end date (start + 3 months)
    const maxAllowed = addMonths(start, 3);
    // If end is after the maxAllowed date, it's over 3 months
    return isAfter(end, maxAllowed);
  };

  const handleDateChange = (value: Date | Date[]) => {
    const range = Array.isArray(value) ? value : [value];
    if (range.length === 2 && range[0] && range[1]) {
      const start = range[0];
      const end = range[1];
      if (isRangeOver3Months(start, end)) {
        appToast.show({
          msg: "Date range cannot exceed 3 months.",
          color: "danger",
        });
        return;
      }
    }
    setDateRange(range);
  };

  return (
    <>
      <AppHeader title={t("reports")} />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
          <SectionTabs
            sectionKey="business"
            activeTab="reports"
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab="reports"
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                <AppPaneMain className="tw:lg:col-span-12">
                  <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-end tw:mb-4">
                    <div className="tw:md:flex-1">
                      <AppBreadcrumbs data={breadcrumbs} />
                      <PageDescription
                        description="reports"
                        className="tw:mb-4"
                      />
                    </div>
                  </div>

                  {/* GST dashboard shortcut — the only report with an interactive view. */}
                  <AppCard className="theme-2-mobile-gap-top">
                    <div className="tw:flex tw:items-center tw:gap-3">
                      <div className="tw:shrink-0 tw:rounded-lg tw:bg-primary/10 tw:p-2.5 tw:text-primary">
                        <Building2 size={20} />
                      </div>
                      <div className="tw:min-w-0 tw:flex-1">
                        <div className="tw:text-sm tw:font-semibold">
                          GST Dashboard
                        </div>
                        <div className="tw:text-xs tw:text-muted-foreground tw:mt-0.5">
                          Analyze GST inward, collected, and net tax
                          obligations.
                        </div>
                      </div>
                      <AppButton
                        size="small"
                        color="primary"
                        fill="outline"
                        className="tw:shrink-0"
                        onClick={() =>
                          appNav.to(
                            "/dashboard/reports/gst-dashboard/products-level",
                          )
                        }
                      >
                        <Eye />
                        View
                      </AppButton>
                    </div>
                  </AppCard>

                  {/* Date range shared by every report download below. */}
                  <AppCard>
                    <div className="tw:text-sm tw:font-semibold tw:mb-1">
                      {t("dateRange")}
                    </div>
                    <div className="tw:text-xs tw:text-muted-foreground tw:mb-3">
                      Downloads include data within the selected range (up to 3
                      months).
                    </div>
                    <AppDateInput
                      callback={handleDateChange}
                      value={dateRange}
                      dateConfig={dateConfig}
                      placeholder="Select date range"
                      hideClose={true}
                      label="Select date range"
                    />
                  </AppCard>

                  {reports.map((report) => (
                    <section key={report.titleKey} className="tw:mt-8">
                      <h2 className="tw:text-base tw:font-semibold tw:mb-3">
                        {t(report.titleKey)}
                      </h2>
                      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4">
                        {report.children.map((child: any) => (
                          <AppCard key={child.titleKey} className="tw:mb-0">
                            <div className="tw:flex tw:items-start tw:gap-3">
                              <div className="tw:shrink-0 tw:rounded-lg tw:bg-primary/10 tw:p-2 tw:text-primary">
                                <child.icon size={18} />
                              </div>
                              <div className="tw:min-w-0 tw:flex-1">
                                <div className="tw:text-sm tw:font-semibold">
                                  {t(child.titleKey)}
                                </div>
                                <div className="tw:text-xs tw:text-muted-foreground tw:mt-0.5 tw:line-clamp-2">
                                  {t(child.descriptionKey)}
                                </div>
                              </div>
                            </div>
                            <div className="tw:mt-3">
                              {child.isCommingSoon ? (
                                <div className="tw:flex tw:justify-end">
                                  <span className="tw:rounded-full tw:bg-muted tw:px-2.5 tw:py-1 tw:text-xs tw:font-medium tw:text-muted-foreground">
                                    Coming soon
                                  </span>
                                </div>
                              ) : (
                                <ReportDownloadOption
                                  view="grid"
                                  callback={() => {
                                    onDownload(child, "xlsx");
                                  }}
                                />
                              )}
                            </div>
                          </AppCard>
                        ))}
                      </div>
                    </section>
                  ))}
                </AppPaneMain>
                {/* Shared accounts side pane — reports is reached from the
                    business section, so it carries the same chip nav and
                    at-a-glance blocks as the accounts pages. */}
                <AccountsSidePane />
              </div>
            </div>
          </div>
        </div>
      </div>
      <BusyLoader show={busyloader.show} />
    </>
  );
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Reports",
  },
];

const getReports = () => {
  return [
    {
      titleKey: "purchaseReports",
      children: [
        {
          titleKey: "report.inventory.title",
          descriptionKey: "report.inventory.description",
          icon: Box,
          dataKey: "inventory",
        },
        {
          titleKey: "report.stockLedger.title",
          descriptionKey: "report.stockLedger.description",
          icon: FilePlus,
          dataKey: "stockLedger",
        },
        {
          titleKey: "report.purchaseOrder.title",
          descriptionKey: "report.purchaseOrder.description",
          icon: FilePlus,
          dataKey: "purchaseOrder",
        },
        {
          titleKey: "report.commissionInvoice.title",
          descriptionKey: "report.commissionInvoice.description",
          icon: FileText,
          dataKey: "commissionInvoice",
          isCommingSoon: false,
        },
        // GST reports moved to GSTR-3
      ],
    },
    {
      titleKey: "salesReports",
      children: [
        {
          titleKey: "report.salesInvoice.title",
          descriptionKey: "report.salesInvoice.description",
          icon: CreditCard,
          dataKey: "salesInvoice",
          isCommingSoon: false,
        },
        {
          titleKey: "report.kingCoins.title",
          descriptionKey: "report.kingCoins.description",
          icon: Coins,
          dataKey: "kingCoins",
          isCommingSoon: false,
        },
        // GST reports moved to GSTR-3
      ],
    },
    {
      titleKey: "gstr1",
      children: [
        {
          titleKey: "report.gst1rB2B.title",
          descriptionKey: "report.gst1rB2B.description",
          icon: FileText,
          dataKey: "gst1rB2B",
          isCommingSoon: false,
        },
        {
          titleKey: "report.gst1rB2C.title",
          descriptionKey: "report.gst1rB2C.description",
          icon: Users,
          dataKey: "gst1rB2C",
          isCommingSoon: false,
        },
        {
          titleKey: "report.hsnB2B.title",
          descriptionKey: "report.hsnB2B.description",
          icon: Tag,
          dataKey: "hsnB2B",
          isCommingSoon: false,
        },
        {
          titleKey: "report.hsnB2C.title",
          descriptionKey: "report.hsnB2C.description",
          icon: List,
          dataKey: "hsnB2C",
          isCommingSoon: false,
        },
      ],
    },
    {
      titleKey: "gstr3",
      children: [
        {
          titleKey: "report.gstReportPurchase.title",
          descriptionKey: "report.gstReportPurchase.description",
          icon: ShoppingCart,
          dataKey: "gstReportPurchase",
          isCommingSoon: false,
        },
        {
          titleKey: "report.gstReportSales.title",
          descriptionKey: "report.gstReportSales.description",
          icon: BarChart,
          dataKey: "gstReportSales",
          isCommingSoon: false,
        },
        {
          titleKey: "report.gstReportB2B.title",
          descriptionKey: "report.gstReportB2B.description",
          icon: Users,
          dataKey: "gstReportB2B",
          isCommingSoon: false,
        },
        {
          titleKey: "report.gstReportB2C.title",
          descriptionKey: "report.gstReportB2C.description",
          icon: Globe,
          dataKey: "gstReportB2C",
          isCommingSoon: false,
        },
      ],
    },
    {
      titleKey: "report.returns.title",
      children: [
        {
          titleKey: "report.returns.title",
          descriptionKey: "report.returns.description",
          icon: RotateCcw,
          dataKey: "POSRETURNSREPORT",
          isCommingSoon: true,
        },
      ],
    },
  ];
};

export default Reports;
