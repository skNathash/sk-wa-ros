import { ArrowLeft, Download, FileText } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import {
  defaultFilter,
  getCount,
  getData,
  prepareParams,
  type FilterFormData,
} from "./helper";
import { API } from "~/constants";

const PlatformFeeStatement = () => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();
  const { isMobile } = useScreenView();
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();

  const [data, setData] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setView] = useState<ViewToggleType>("list");
  const [downloadingStatement, setDownloadingStatement] = useState(false);
  const [setupFeeInvoice, setSetupFeeInvoice] = useState<any>(null);

  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const methods = useForm<FilterFormData>({
    defaultValues: defaultFilter,
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const applyFilter = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setData([]);
    try {
      const params = prepareParams(methods.getValues(), paginationRef.current, {
        key: "createdAt",
        value: "desc",
      });
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const statementData = await getData(params);
      setData(statementData);
      setHasMoreData(statementData.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error fetching statement data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(methods.getValues(), paginationRef.current, {
        key: "createdAt",
        value: "desc",
      });
      const statementData = await getData(params);
      setData((prev) => [...prev, ...statementData]);
      setHasMoreData(statementData.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error loading more data:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, methods]);

  const handleFilterChange = () => {
    applyFilter();
  };

  useEffect(() => {
    methods.setValue("dateFrom", dateFrom);
    methods.setValue("dateTo", dateTo);
    applyFilter();
  }, [dateFrom, dateTo, methods]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await FranchiseService.getPlanStatement({
          page: 1,
          limit: 100,
        });
        const p = (res?.data?.data || []).map((item: any) => ({
          label: item.planName,
          value: item._id,
        }));
        setPlans(p);
        const defaultPlanId = FranchiseService.getPlanId();
        if (defaultPlanId) {
          methods.setValue("planId", defaultPlanId);
        }
      } catch (err) {
        console.error("Error fetching plans", err);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchSetupFeeInvoice = async () => {
      try {
        const res = await FranchiseService.getServiceFeePlanSubscriptions({
          filter: { isSetupFeePaid: true },
        });
        const list = res?.data?.data || [];
        const item = Array.isArray(list) ? list[0] : list;
        setSetupFeeInvoice(item || null);
      } catch (err) {
        console.error("Error fetching setup fee invoice", err);
      }
    };

    fetchSetupFeeInvoice();
  }, []);

  const handleCallback = async (data: { action: string; data: any }) => {
    if (data.action === "download") {
      const res = await FranchiseService.getPlatformPlanDetails(
        data.data.subscriptionId
      );
      const d = res.data.data?.invoiceDocumentId || "";
      if (!d) {
        appToast.show({
          color: "error",
          msg: "Failed to download plan details",
        });
        return;
      }

      CommonService.assetDownload(d);
    }
  };

  const downloadSetupFeeInvoice = () => {
    const docId = setupFeeInvoice?.invoiceDocumentId || "";
    if (!docId) {
      appToast.show({
        color: "error",
        msg: "Failed to download setup fee invoice",
      });
      return;
    }
    CommonService.assetDownload(docId);
  };

  const downloadStatement = async () => {
    setDownloadingStatement(true);
    try {
      const params = prepareParams(
        methods.getValues(),
        {
          activePage: 1,
          rowsPerPage: 10000, // large number to get all
          startSlNo: 1,
          endSlNo: 10000,
          totalRecords: 0,
        },
        {
          key: "createdAt",
          value: "desc",
        }
      );

      const response = await FranchiseService.getPlanStatement({
        ...params,
        outputType: "download",
      });
      const downloadUrl = response.data?.data?.fileName || "";

      if (!downloadUrl) {
        appToast.show({
          color: "error",
          msg: "Failed to download statement",
        });
        return;
      }

      CommonService.windowOpenHandler(
        FranchiseService.downloadPlanStatement(downloadUrl),
        () => {}
      );

      appToast.show({
        color: "success",
        msg: "Statement downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading statement:", error);
      appToast.show({
        color: "error",
        msg: "Failed to download statement",
      });
    } finally {
      setDownloadingStatement(false);
    }
  };

  return (
    <>
      <div className="tw:mb-3">
        <span
          className="tw:text-sm tw:text-primary tw:cursor-pointer tw:inline-flex tw:items-center tw:gap-1"
          onClick={() =>
            appNav.to("/dashboard/accounts/platform-fee", {
              tab: "commission-invoices",
              subtab: "available-plans",
              dateFrom,
              dateTo,
            })
          }
        >
          <ArrowLeft size={16} /> Back to Plans
        </span>
      </div>

      <div className="tw:mb-4">
        <FormProvider {...methods}>
          <Filter callback={handleFilterChange} plans={plans} />
          {/* pass plans to filter for plan dropdown */}
        </FormProvider>
      </div>

      <div className="tw:flex tw:flex-col-reverse tw:gap-3 tw:md:flex-row tw:md:gap-2 tw:md:justify-between tw:md:items-center tw:mb-4">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>
        <div className="tw:flex tw:items-center tw:gap-3 tw:justify-end">
          {setupFeeInvoice && (
            <AppButton
              fill="outline"
              size="small"
              onClick={downloadSetupFeeInvoice}
            >
              <span className="tw:inline-flex tw:items-center tw:gap-1">
                <FileText size={14} />
                Setup Fee Invoice
              </span>
            </AppButton>
          )}
          <AppButton
            fill="outline"
            size="small"
            onClick={downloadStatement}
            disabled={loading || downloadingStatement}
          >
            <span className="tw:inline-flex tw:items-center tw:gap-1">
              <Download size={14} />
              {downloadingStatement
                ? t("common:downloading")
                : t("common:download")}
            </span>
          </AppButton>
          <ViewToggle
            viewType={view}
            callback={setView}
            showOnlyIcon={isMobile}
          />
        </div>
      </div>

      {isMobile || view === "card" ? (
        <MobileView
          data={data}
          loading={loading}
          onLoadMore={loadMore}
          hasMore={hasMoreData}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          callback={handleCallback}
        />
      ) : (
        <AppCard noPadding={true}>
          <DesktopView
            data={data}
            loading={loading}
            loadMore={loadMore}
            loadingMore={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            hasMoreData={hasMoreData}
            callback={handleCallback}
          />
        </AppCard>
      )}
      <BusyLoader
        show={downloadingStatement}
        message="Downloading statement..."
      />
    </>
  );
};

export default PlatformFeeStatement;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Platform Fee Statement"),
    },
  ];
}
