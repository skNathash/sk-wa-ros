import {
  Download,
  FileText,
  Users,
  Tag,
  List,
  ShoppingCart,
  BarChart,
  Globe,
} from "lucide-react";
import { useState } from "react";
import { startOfMonth, endOfMonth, differenceInMonths } from "date-fns";
import AppCard from "~/components/core/card/AppCard";
import { useSearchParams } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import { prepareParams, downloadReport } from "./helper";
import { SectionLabel } from "../components/ui";
import useAppToast from "~/hooks/useAppToast";
import { useTranslation } from "react-i18next";

const reports = [
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
];

const GstDashboardReports = () => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const [busyloader, setBusyloader] = useState({ show: false });

  const [searchParams] = useSearchParams();

  const onDownload = (data: any, fileType: string) => {
    // Read dates from URL search params (dateFrom, dateTo), fallback to current month
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const startDate = dateFrom ? new Date(dateFrom) : startOfMonth(new Date());
    const endDate = dateTo ? new Date(dateTo) : endOfMonth(new Date());

    const diffInMonths = differenceInMonths(endDate, startDate);
    if (diffInMonths > 3) {
      appToast.show({
        msg: "Date range cannot exceed 3 months.",
        color: "danger",
      });
      return;
    }

    const params = prepareParams({ startDate, endDate, fileType });
    setBusyloader({ show: true });

    try {
      const result = downloadReport(data.dataKey, params);
      setBusyloader({ show: false });

      if (result && result.success) {
        console.log("Report download initiated successfully");
      } else {
        appToast.show({ msg: t("linkNotFound"), color: "danger" });
      }
    } catch (error) {
      setBusyloader({ show: false });
      appToast.show({ msg: t("linkNotFound"), color: "danger" });
    }
  };

  return (
    <>
      <div className="app-page page-bg">
        <div className="app-container tw:py-4 tw:space-y-6">
          {reports.map((report) => (
            <section key={report.titleKey}>
              <SectionLabel>{t(report.titleKey)}</SectionLabel>
              <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-3">
                {report.children.map((child: any) => (
                  <AppCard
                    key={child.titleKey}
                    noPadding
                    bodyClassName="tw:flex tw:flex-col tw:flex-1 tw:p-4"
                    className="tw:mb-0 tw:h-full tw:rounded-xl tw:border tw:border-gray-200 tw:shadow-none tw:transition-colors tw:hover:border-violet-300"
                  >
                    <div className="tw:flex tw:items-start tw:gap-2.5 tw:mb-3">
                      <span className="tw:inline-flex tw:items-center tw:justify-center tw:shrink-0 tw:rounded-lg tw:bg-violet-100 tw:text-violet-700 tw:p-2">
                        <child.icon size={16} />
                      </span>
                      <div className="tw:min-w-0">
                        <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:leading-snug">
                          {t(child.titleKey)}
                        </div>
                        <div className="tw:text-xs tw:text-gray-500 tw:leading-relaxed tw:mt-1">
                          {t(child.descriptionKey)}
                        </div>
                      </div>
                    </div>

                    <div className="tw:mt-auto tw:pt-3 tw:border-t tw:border-gray-100 tw:flex tw:items-center tw:justify-end">
                      {child.isCommingSoon ? (
                        <span className="tw:text-xs tw:font-medium tw:text-gray-400">
                          Coming soon
                        </span>
                      ) : (
                        <AppButton
                          size="small"
                          color="primary"
                          fill="outline"
                          onClick={() => onDownload(child, "xlsx")}
                          className="tw:rounded-lg tw:font-medium"
                        >
                          <Download size={14} className="tw:mr-1.5" />
                          {t("download")}
                        </AppButton>
                      )}
                    </div>
                  </AppCard>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <BusyLoader show={busyloader.show} />
    </>
  );
};

export default GstDashboardReports;
