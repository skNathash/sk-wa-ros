import { ChevronDown, PrinterIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import VendorService from "~/services/VendorService";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import Summary from "./components/Summary";
import {
  defaultSummary,
  getAccountsSummary,
  getCount,
  getData,
  prepareParams,
} from "./helper";
import RecordPaymentViewModal from "~/shared/accounts/modals/record-payment/view/RecordPaymentViewModal";
import { useTranslation } from "react-i18next";
import AppLink from "~/components/core/link/AppLink";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["VENDOR.VIEW-STATEMENT"]);
}

const defaultSort: SortProps = {
  key: "paymentDate",
  value: "desc",
};

const breadcrumbs = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  { label: "Vendor List", redirect: { path: "/dashboard/vendor/list" } },
  { label: "Vendor Statement" },
];

const VendorStatement = () => {
  const { t } = useTranslation(["common", "menu"]);
  const { isMobile } = useScreenView();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<any>(null);

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([...defaultSummary]);

  const [loadingData, setLoadingData] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [paymentViewModal, setPaymentViewModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: null,
  });

  const [showFilters, setShowFilters] = useState<boolean>(false);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({});

  useEffect(() => {
    setShowFilters(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    const fetchData = async () => {
      const vendor = await VendorService.getDetail(id || "");
      if (vendor?.data?.data?._id) {
        setVendor(vendor?.data?.data);
        filterRef.current = {
          ...filterRef.current,
          vendorId: id,
        };
        applyFilter();
      } else {
        setVendor(null);
      }
    };
    if (id) {
      fetchData();
    }
  }, [id]);

  const applyFilter = useCallback(async () => {
    setLoadingData(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    loadSummary();

    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        defaultSort,
      );

      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoadingData(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setSummary(
      defaultSummary.map((item) => ({
        ...item,
        loading: true,
      })),
    );
    const response = await getAccountsSummary(filterRef.current.vendorId);
    setSummary(
      defaultSummary.map((item) => ({
        ...item,
        value: response[item.apiKey as keyof typeof response] || 0,
        loading: false,
      })),
    );
  }, []);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        defaultSort,
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const onFilterChange = useCallback(
    (data: any) => {
      filterRef.current = {
        ...filterRef.current,
        ...data.formData,
        vendorId: id,
      };
      applyFilter();
    },
    [id],
  );

  const handleItemCallback = useCallback(
    (data: { action: string; data?: any }) => {
      if (data.action === "viewPayment" && data.data.sourceType === "PAYMENT") {
        setPaymentViewModal({
          show: true,
          data: data.data,
        });
      }
    },
    [],
  );

  const handleRecordPaymentViewModalCallback = useCallback(
    (data: { action: string; data?: any }) => {
      setPaymentViewModal({
        show: false,
        data: null,
      });
    },
    [],
  );

  const handlePrintStatement = async () => {
    const params = prepareParams(
      filterRef.current,
      paginationRef.current,
      defaultSort,
    );
    const result = await getData({ ...params, outputType: "download" });
  };

  return (
    <>
      <AppHeader title="Vendor Statement" />
      <div className="page-bg app-page page-padding">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
          <SectionTabs
            sectionKey="supply"
            activeTab="vendors"
            variant="chips"
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="vendors"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:mb-4 tw:gap-2">
                <AppBreadcrumbs data={breadcrumbs} />
                <div>
                  <AppButton
                    color="primary"
                    className="tw:text-white tw:hidden"
                    disabled={!vendor?._id}
                    onClick={handlePrintStatement}
                  >
                    <PrinterIcon size={16} />
                    Print Statement
                  </AppButton>
                </div>
              </div>
              {vendor?._id ? (
                <>
                  <div className="tw:mb-4">
                    <div className="tw:text-2xl tw:font-bold tw:flex tw:items-center tw:gap-2 tw:mb-2">
                      <AppLink
                        asLink={true}
                        href={`/dashboard/vendor/view/${vendor?._id}`}
                        className="tw:text-2xl tw:font-bold"
                      >
                        {vendor?.name}
                      </AppLink>
                      {vendor._vendorType && (
                        <VendorTypeBadge
                          type={vendor._vendorType}
                          color={vendor._vendorTypeColor}
                          description={vendor._vendorTypeInfo}
                        />
                      )}
                    </div>
                    <div className="tw:text-sm">{vendor?._fullAddress}</div>
                  </div>
                  <AppCard>
                    <Filter
                      callback={onFilterChange}
                      showFilters={showFilters}
                    />

                    <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                      <div>
                        <PaginationSummary
                          loadingTotalRecords={loadingData}
                          paginationConfig={paginationRef.current}
                          fwSize="sm"
                          loadedCount={data.length}
                        />
                      </div>
                      {isMobile && (
                        <div>
                          <AppButton
                            onClick={() => setShowFilters(!showFilters)}
                            fill="clear"
                            size="small"
                            className="tw:!px-0"
                          >
                            {showFilters ? t("hideFilters") : t("showFilters")}
                            <ChevronDown
                              className={`tw:transition-transform ${
                                showFilters ? "tw:rotate-180" : ""
                              }`}
                            />
                          </AppButton>
                        </div>
                      )}
                    </div>
                  </AppCard>
                  <AppCard noPadding>
                    <Summary summary={summary} />
                    {isMobile ? (
                      <MobileView
                        data={data}
                        loading={loadingData}
                        callback={handleItemCallback}
                      />
                    ) : (
                      <DesktopView
                        data={data}
                        loading={loadingData}
                        callback={handleItemCallback}
                      />
                    )}
                    {hasMoreData && !loading && (
                      <div className="tw:text-center tw:mt-4">
                        <AppButton
                          onClick={loadMore}
                          disabled={loadingMore}
                          size="small"
                          color="light"
                          fill="outline"
                        >
                          {loadingMore ? "Loading..." : "Load More"}
                        </AppButton>
                      </div>
                    )}
                  </AppCard>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <RecordPaymentViewModal
        show={paymentViewModal.show}
        callback={handleRecordPaymentViewModalCallback}
        transactionId={paymentViewModal.data?.transactionId}
      />
    </>
  );
};

export default VendorStatement;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Vendor Statement"),
    },
  ];
}
