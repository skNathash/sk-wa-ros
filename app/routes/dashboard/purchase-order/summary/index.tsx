import { format, sub } from "date-fns";
import { ArrowRight, Plus, ScanLine, ScanText, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLocation, useSearchParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import Rbac from "~/components/core/rbac/Rbac";
import useAppNav from "~/hooks/useAppNav";
import SkReceivePackageModal from "~/shared/orders/modals/receive-package-details/sk/SkReceivePackageModal";
import ScanBoxModal from "~/shared/orders/modals/scan-box/ScanBoxModal";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import FranchiseService from "~/services/FranchiseService";
import PageHeader from "~/shared/page-header/PageHeader";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import CreatePoFab from "~/shared/purchase-order/components/CreatePoFab";
import PoListTabs from "../components/tabs/PoListTabs";
import Filter from "./components/Filter";
import SummaryCard from "./components/SummaryCard";
import {
  getData,
  getLastFourYearsDateRange,
  getNotReceivedCount,
  prepareFilterParams,
} from "./helper";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Purchase Orders",
    redirect: { path: "/dashboard/purchase-order/main" },
    langKey: "purchaseOrders",
  },
  {
    label: "Purchase Orders Summary",
    langKey: "purchaseOrdersSummary",
  },
];

const rbacRoles = {
  createPO: ["PURCHASE-ORDER.CREATE"],
  viewVendors: ["VENDOR.VIEW"],
};

const PurchaseOrderSummary = () => {
  const { t } = useTranslation(["common", "menu"]);

  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  type FormValues = {
    dateRange: Date[];
    vendorInfo?: Record<string, any>;
    search?: string;
  };

  const formMethods = useForm<FormValues>({
    defaultValues: {
      dateRange: [sub(new Date(), { days: 30 }), new Date()],
      vendorInfo: {},
      search: "",
    },
  });

  // watch vendorInfo from the Filter form so we can show selected vendor chip
  const vendorInfo = useWatch<any>({
    control: formMethods.control,
    name: "vendorInfo",
  });

  const clearSelectedVendor = () => {
    formMethods.setValue("vendorInfo", {});
    // update URL/query params after clearing vendor so filters sync
    handleFilter();
  };

  const [data, setData] = useState<any>(null);

  const [scanBoxModal, setScanBoxModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: null,
  });

  const [skReceivePackageModal, setSkReceivePackageModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: null,
  });

  const [planAlertDialog, setPlanAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const [isCheckingPlan, setIsCheckingPlan] = useState(false);

  const applyFilter = async () => {
    const formData = formMethods.getValues();
    const params = prepareFilterParams(formData);

    // Not Received summary ignores the selected date range, so fetch it
    // separately over the last 4 years and merge it into the dated result.
    const { startDate, endDate, ...paramsWithoutDate } = params;
    const notReceivedParams = {
      ...paramsWithoutDate,
      ...getLastFourYearsDateRange(),
    };

    const [data, notReceivedData, notReceivedCount] = await Promise.all([
      getData(params),
      getData(notReceivedParams),
      getNotReceivedCount(formData),
    ]);

    setData({
      ...data,
      notReceivedSummary: {
        ...notReceivedData?.notReceivedSummary,
        // Package-level count so the card's Total PO matches the Not Received
        // tab badge and list (a PO can span multiple shipment packages).
        totalPO: notReceivedCount,
      },
    });
  };

  const handleFilter = () => {
    const formData = formMethods.getValues();
    const params = getQueryParamsFromForm(formData);

    appNav.replace(location.pathname, params);
  };

  // When search params change in the URL, sync them into the form and apply filter
  useEffect(() => {
    const s = Object.fromEntries(Array.from(searchParams.entries()));

    const newFormValues: any = {};

    if (s.search) {
      newFormValues.search = s.search;
    }

    if (s.vendorId || s.vendorName) {
      newFormValues.vendorInfo = {
        vendorId: s.vendorId,
        name: s.vendorName,
        _id: s.vendorId,
      };
    }

    if (s.startDate && s.endDate) {
      try {
        newFormValues.dateRange = [new Date(s.startDate), new Date(s.endDate)];
      } catch (e) {
        // ignore parse errors
      }
    }

    // set form values silently
    Object.keys(newFormValues).forEach((k) => {
      formMethods.setValue(k as any, newFormValues[k]);
    });

    // apply filter after syncing form
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleScanBoxModalCallback = (a: { action: string; data?: any }) => {
    setScanBoxModal({ show: false, data: null });
    if (a.action === "receive") {
      setSkReceivePackageModal({
        show: true,
        data: {
          orderId: a.data.box?.response?.orderId,
          boxNo: a.data.barcode,
        },
      });
    }
  };

  const handleScanBox = () => {
    setScanBoxModal({ show: true, data: null });
  };

  const handleSkReceivePackageModalCallback = (a: {
    action: string;
    data?: any;
  }) => {
    setSkReceivePackageModal({ show: false, data: null });
  };

  const handleSummaryCardCallback = (a: { action: string; data?: any }) => {
    const formData = { ...formMethods.getValues(), groupByType: a.data.type };

    const params: Record<string, any> = getQueryParamsFromForm(formData);
    if (formData.groupByType) params.groupByType = formData.groupByType;

    if (a.action === "vendors") {
      appNav.to("/dashboard/purchase-order/summary-vendors", params);
    } else if (a.action === "po") {
      if (formData.groupByType === "notReceived") {
        // Not Received summary ignores the date range filter
        delete params.dateFrom;
        delete params.dateTo;
        appNav.to("/dashboard/purchase-order/not-received", params);
      } else {
        appNav.to("/dashboard/purchase-order/summary-po", params);
      }
    }
  };

  const getQueryParamsFromForm = (formData: any) => {
    const params: Record<string, any> = {};

    if (formData.search?.trim()) {
      params.search = formData.search.trim();
    }

    if (formData.vendorInfo?._id) {
      params.vendorId = formData.vendorInfo.vendorId || formData.vendorInfo._id;
      params.vendorName = formData.vendorInfo.name;
    }

    if (
      formData.dateRange &&
      Array.isArray(formData.dateRange) &&
      formData.dateRange.length === 2
    ) {
      params.dateFrom = format(formData.dateRange[0], "yyyy-MM-dd");
      params.dateTo = format(formData.dateRange[1], "yyyy-MM-dd");
    }

    return params;
  };

  const handleCreatePurchaseOrder = async () => {
    setIsCheckingPlan(true);
    try {
      const planResp = await FranchiseService.getActivePlan();

      if (
        !planResp ||
        !planResp.isPlanActive ||
        planResp.availableAmount <= 0
      ) {
        setPlanAlertDialog({
          show: true,
          title: "Buy Platform Fee Plan",
          description:
            "You need an active platform fee plan to create a purchase order. Please subscribe to a plan to continue.",
          onConfirm: () => {
            setPlanAlertDialog((prev) => ({ ...prev, show: false }));
            appNav.to(FranchiseService.getBuyPlanLink());
          },
          onCancel: () => {
            setPlanAlertDialog((prev) => ({ ...prev, show: false }));
          },
        });
        return;
      }

      appNav.to("/dashboard/purchase-order/vendors", {
        from: "po",
      });
    } finally {
      setIsCheckingPlan(false);
    }
  };

  return (
    <>
      <AppHeader
        title={t("purchaseOrders")}
        showAudioNote={true}
        audioNoteTitle={t("purchaseOrders")}
        audioFeature="po"
      />
      <div className="page-padding page-bg app-page has-footer theme-2-no-footer">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              `sticky` pins them under the header and breaks out of the page
              padding so the underline runs edge to edge. */}
          <SectionTabs
            sectionKey="supply"
            activeTab="purchase-orders"
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="purchase-orders"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="theme-2-mobile-hide tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:mb-4 tw:gap-3">
                <PageHeader
                  breadcrumbs={breadcrumbs}
                  title={t("purchaseOrdersSummary")}
                  description="purchaseOrder"
                />

                <div className="tw:hidden tw:md:flex tw:gap-2">
                  <AppButton
                    size="small"
                    onClick={() => appNav.to("/dashboard/scan/invoice-scan")}
                    noShadow={true}
                    fill="outline"
                    aria-label="SK Invoice AI"
                  >
                    <ScanText size={16} aria-hidden className="tw:mr-1" />
                    SK Invoice AI
                  </AppButton>
                  <Rbac roles={rbacRoles.viewVendors}>
                    <AppButton
                      size="small"
                      onClick={() => {
                        const params = getQueryParamsFromForm(
                          formMethods.getValues(),
                        );
                        appNav.to("/dashboard/vendor/list", params);
                      }}
                      noShadow={true}
                      fill="outline"
                    >
                      <Users className="tw:mr-1" size={16} aria-hidden />
                      {t("vendors")}
                    </AppButton>
                  </Rbac>
                  <Rbac roles={rbacRoles.createPO}>
                    <AppButton
                      size="small"
                      onClick={handleCreatePurchaseOrder}
                      noShadow={true}
                      isLoading={isCheckingPlan}
                      disabled={isCheckingPlan}
                    >
                      <Plus className="tw:mr-1" size={16} aria-hidden />
                      {t("createPO")}
                    </AppButton>
                  </Rbac>
                </div>
              </div>

              <PoListTabs activeTab="summary" className="tw:mb-4" />

              <FormProvider {...formMethods}>
                <Filter callback={handleFilter} />
              </FormProvider>

              {/* Show selected vendor chip with remove icon when vendorInfo is set */}
              {vendorInfo && vendorInfo?._id ? (
                <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2 tw:mb-4">
                  <div className="tw:text-sm tw:font-medium">
                    {t("selectedVendor")}
                  </div>
                  <AppBadge
                    variant="primary"
                    showClose={true}
                    onClose={clearSelectedVendor}
                  >
                    {vendorInfo.name}
                  </AppBadge>
                </div>
              ) : null}

              <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-4">
                <SummaryCard
                  title={t("overallSummary")}
                  poValue={data?.overallSummary?.totalPOValue}
                  totalPo={data?.overallSummary?.totalPO}
                  totalVendors={data?.overallSummary?.totalVendors}
                  type="total"
                  callback={handleSummaryCardCallback}
                />
                <SummaryCard
                  title={t("notReceivedSummary")}
                  poValue={data?.notReceivedSummary?.totalPOValue}
                  totalPo={data?.notReceivedSummary?.totalPO}
                  totalVendors={data?.notReceivedSummary?.totalVendors}
                  type="notReceived"
                  description={t("notReceivedDateRangeNote")}
                  callback={handleSummaryCardCallback}
                />
                <SummaryCard
                  title={t("receivedSummary")}
                  poValue={data?.receivedSummary?.totalPOValue}
                  totalPo={data?.receivedSummary?.totalPO}
                  totalVendors={data?.receivedSummary?.totalVendors}
                  type="received"
                  callback={handleSummaryCardCallback}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="app-footer theme-2-mobile-hide">
        <div className="tw:md:text-end">
          <AppButton
            color="primary"
            onClick={() => appNav.to("/dashboard/purchase-order/box-receive")}
            className="tw:font-semibold tw:w-full tw:md:w-auto"
            size="large"
          >
            <ScanLine size={16} />
            {t("scanBox")}
            <ArrowRight className="tw:ml-1" size={16} />
          </AppButton>
        </div>
      </div>

      <CreatePoFab showScan />

      <ScanBoxModal
        show={scanBoxModal.show}
        callback={handleScanBoxModalCallback}
      />

      <SkReceivePackageModal
        show={skReceivePackageModal.show}
        callback={handleSkReceivePackageModalCallback}
        orderId={skReceivePackageModal.data?.orderId}
        boxNo={skReceivePackageModal.data?.boxNo}
      />

      <AppAlertDialog
        title={planAlertDialog.title}
        description={planAlertDialog.description}
        show={planAlertDialog.show}
        onConfirm={planAlertDialog.onConfirm}
        onCancel={planAlertDialog.onCancel}
      />
    </>
  );
};

export default PurchaseOrderSummary;
