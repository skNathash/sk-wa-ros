import {
  addMonths,
  endOfMonth,
  isAfter,
  set,
  startOfMonth,
  sub,
} from "date-fns";
import {
  BarChart,
  Box,
  Building2,
  Coins,
  CreditCard,
  Download,
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

  const [reports, setReports] = useState<any[]>(getReports(t));

  const appToast = useAppToast();

  const [busyloader, setBusyloader] = useState({
    show: false,
  });

  const [dateRange, setDateRange] = useState<Date[]>([
    startOfMonth(new Date()),
    endOfMonth(new Date()),
  ]);

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
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-end tw:mb-4">
            <div className="tw:md:flex-1">
              <AppBreadcrumbs data={breadcrumbs} />
              <PageDescription description="reports" className="tw:mb-4" />
            </div>
          </div>
          {/* <AppCard>
            <div className="tw:flex tw:gap-2">
              <AppSelect name="year" options={years} register={register} />
              <AppSelect name="month" options={months} register={register} />
            </div>
          </AppCard> */}

          <AppCard className="tw:border-l-4 tw:border-l-blue-600">
            <div className="tw:flex tw:justify-between tw:items-center">
              <div>
                <div className="tw:text-lg tw:font-bold tw:flex tw:items-center tw:gap-2">
                  <Building2 className="tw:text-blue-600" />
                  GST Dashboard
                </div>
                <div className="tw:text-xs tw:text-gray-500">
                  Analyze GST inward, collected, and net tax obligations.
                </div>
              </div>
              <div>
                <AppButton
                  size="small"
                  color="primary"
                  onClick={() =>
                    appNav.to("/dashboard/reports/gst-dashboard/products-level")
                  }
                >
                  <Eye />
                  View
                </AppButton>
              </div>
            </div>
          </AppCard>

          <AppDateInput
            callback={handleDateChange}
            value={dateRange}
            dateConfig={dateConfig}
            placeholder="Select date range"
            hideClose={true}
            label="Select date range"
          />

          {reports.map((report) => (
            <div key={report.titleKey}>
              <div>
                <h2 className="tw:text-lg tw:font-bold tw:mb-4 tw:mt-8">
                  {t(report.titleKey)}
                </h2>
              </div>
              <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
                {report.children.map((child: any) => (
                  <AppCard key={child.titleKey} className="tw:mb-0">
                    <div className="tw:text-sm tw:font-bold tw:flex tw:items-center tw:mb-2">
                      <child.icon className="tw:mr-2 tw:text-lg" />
                      {t(child.titleKey)}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500 tw:mb-4">
                      {t(child.descriptionKey)}
                    </div>
                    <div>
                      {child.isCommingSoon ? (
                        <div className="tw:text-xs tw:text-slate-700 tw-font-medium tw:text-end tw:py-2">
                          Coming soon
                        </div>
                      ) : (
                        <>
                          <ReportDownloadOption
                            view="grid"
                            callback={() => {
                              onDownload(child, "xlsx");
                            }}
                          />
                          <div className="tw:flex tw:flex-wrap tw:gap-2 tw:items-center tw:justify-end">
                            {/* <AppButton
                              size="small"
                              color="primary"
                              fill="outline"
                              onClick={() => onDownload(child, "xlsx")}
                            >
                              <Download className="tw:mr-2" />
                              {t("download")}
                            </AppButton> */}
                            {/* <AppButton
                              size="small"
                              color="primary"
                              fill="outline"
                              onClick={() => onDownload(child, "xlsx")}
                            >
                              <Download className="tw:mr-2" />
                              {t("downloadAsExcel")}
                            </AppButton> */}
                          </div>
                        </>
                      )}
                    </div>
                  </AppCard>
                ))}
              </div>
            </div>
          ))}
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

const getReports = (t: any) => {
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

const getDateFilter = (month: number, year: number) => {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  return {
    $gte: set(startDate, { hours: 0, minutes: 0, seconds: 0 }),
    $lte: set(endDate, { hours: 23, minutes: 59, seconds: 59 }),
  };
};

export default Reports;
