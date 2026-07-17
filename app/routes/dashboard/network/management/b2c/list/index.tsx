import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import Filter from "./components/Filter";
import DesktopView from "./components/item/DesktopView";
import MobileView from "./components/item/MobileView";
import Summary from "./components/Summary";
import { getCount, getData, getSummary, prepareParams } from "./helper";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import AuthService from "~/services/AuthService";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["NETWORK.VIEW-USERS"]);
}

const B2c = () => {
  const { isMobile } = useScreenView();

  const { t } = useTranslation(["common"]);
  const { to } = useAppNav();
  const appToast = useAppToast();

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [view, setView] = useState<ViewToggleType>("list");

  const [whatsappModal, setWhatsappModal] = useState<{
    show: boolean;
    data?: any;
    users?: { name?: string; mobile?: string }[];
    categories?: string[];
    ignoreCategories?: string[];
    templateFor?: string[];
  }>({
    show: false,
    data: undefined,
    users: [],
    categories: undefined,
    ignoreCategories: undefined,
    templateFor: undefined,
  });

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    endSlNo: 10,
    rowsPerPage: 10,
    startSlNo: 1,
    totalRecords: 0,
  });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      // fetch data and counts
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);

      // fetch summary based on current filters
      const summaryData = await getSummary(filterRef.current || {});
      setSummary(summaryData || {});
    } catch (e) {
      setData([]);
      setHasMoreData(false);
      setSummary({});
    } finally {
      setLoading(false);
    }
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
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params);
      setData((prev) => [...prev, ...result]);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  useEffect(() => {
    applyFilter();
  }, []);

  const onFilterChange = useCallback((data: any) => {
    filterRef.current = {
      ...filterRef.current,
      ...data.formData,
    };
    applyFilter();
  }, []);

  const handleAction = useCallback((arg: { action: string; data?: any }) => {
    if (arg.action === "openWhatsapp") {
      const user = arg.data;
      setWhatsappModal({
        show: true,
        data: {
          dynamicData: {
            customerName: user?.name,
            orderId: "-",
            franchiseName: AuthService.getLoggedInUser()?.name || "",
          },
        },
        users: [{ name: user.name, mobile: user.mobile }],
        categories: [],
        // leave ignoreCategories empty by default; callers can set if needed
        ignoreCategories: ["Invite", "payLater"],
        templateFor: ["B2C"],
      });
    }
  }, []);

  const handleWhatsappCallback = useCallback(
    (a: { action: string; data?: any }) => {
      if (a.action === "close") {
        setWhatsappModal((s) => ({ ...s, show: false, category: undefined }));
        return;
      }

      if (a.action === "send") {
        // bubble up the action or handle send here
        // For now just close the modal
        setWhatsappModal((s) => ({ ...s, show: false, category: undefined }));
        appToast.show({ msg: "WhatsApp message sent", color: "success" });
      }

      if (a.action === "send_error") {
        setWhatsappModal((s) => ({ ...s, show: false, category: undefined }));
        appToast.show({ msg: "Failed to send WhatsApp", color: "danger" });
      }
    },
    [appToast]
  );

  return (
    <>
      <Summary summary={summary} />

      <Filter callback={onFilterChange} showFilters={showFilters} />

      <div className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:mb-4">
        <div className="tw:flex-1">
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <ViewToggle viewType={view} callback={setView} />
        </div>
      </div>

      {isMobile || view === "card" ? (
        <>
          <MobileView
            data={data}
            onView={(item: any) =>
              to(`/dashboard/network/view/b2c/${item._id}`)
            }
            callback={handleAction}
          />
          {hasMoreData && !loading && (
            <div className="tw:text-center tw:mt-4">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
              />
            </div>
          )}
        </>
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            loadMore={loadMore}
            loadingMore={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            hasMoreData={hasMoreData}
            onAction={handleAction}
          />
        </AppCard>
      )}

      {/* <div className="tw:md:w-1/3">
          <Insight />
        </div> */}
      <WhatsappTemplateModal
        show={!!whatsappModal.show}
        data={whatsappModal.data}
        users={whatsappModal.users}
        categories={whatsappModal.categories}
        templateFor={whatsappModal.templateFor}
        callback={handleWhatsappCallback}
        ignoreCategories={whatsappModal.ignoreCategories}
      />
    </>
  );
};

export default B2c;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Customer Directory"),
    },
  ];
}
