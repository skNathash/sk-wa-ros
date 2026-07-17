import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import type {
  PaginationState,
  SortProps,
  ViewToggleType,
} from "~/types/CommonTypes";
import Filter from "./components/Filter";
import DesktopView from "./components/item/DesktopView";
import MobileView from "./components/item/MobileView";
import Summary from "./components/Summary";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import { getCount, getData, prepareParams } from "./helper";
import { AuthService } from "~/services/AuthService";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["NETWORK.VIEW-USERS"]);
}

const B2b = () => {
  const { isMobile } = useScreenView();
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [view, setView] = useState<ViewToggleType>("list");

  const [primaryBusinessOptions, setPrimaryBusinessOptions] = useState<any[]>(
    [],
  );

  const [whatsappModal, setWhatsappModal] = useState<{
    show: boolean;
    data?: any;
    users?: { name?: string; mobile?: string }[];
    categories?: string[];
    templateFor?: string[];
    ignoreCategories?: string[];
  }>({
    show: false,
    data: undefined,
    users: [],
    categories: undefined,
    templateFor: undefined,
    ignoreCategories: undefined,
  });

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    endSlNo: 10,
    rowsPerPage: 10,
    startSlNo: 1,
    totalRecords: 0,
  });
  const sortRef = useRef<{ key: string; value: "asc" | "desc" }>({
    key: "name",
    value: "asc",
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
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
      const result = await getData(params);
      setData(result || []);
      const countResponse = await getCount(params);
      paginationRef.current.totalRecords = countResponse?.total || 0;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
      // build summary directly from count response (no extra API call)
      setSummary({
        total: countResponse?.total || 0,
        approved: countResponse?.approved || 0,
        pending: countResponse?.pending || 0,
        rejected: countResponse?.rejected || 0,
        registeredThisWeek: countResponse?.registeredThisWeek || 0,
      });
    } catch (e) {
      setData([]);
      setHasMoreData(false);
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

  // Initial load
  useEffect(() => {
    const fetchPrimaryBusiness = async () => {
      const response = await CommonService.getBusinessCategories();
      const formattedOptions = (response?.data?.data || []).map(
        (item: any) => ({
          value: item._id,
          label: item.name,
        }),
      );
      formattedOptions.unshift({
        value: "choose",
        label: "All Business Types",
      });
      setPrimaryBusinessOptions(formattedOptions);
    };
    fetchPrimaryBusiness();

    applyFilter();
  }, []);

  const onFilterChange = useCallback((data: any) => {
    filterRef.current = {
      ...filterRef.current,
      ...data.formData,
    };
    applyFilter();
  }, []);

  const handleSort = useCallback(({ key, value }: SortProps) => {
    sortRef.current = { key, value: value || "asc" };
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
            franchiseId: AuthService.getLoggedInUserId(),
            customerId: user._id,
          },
        },
        users: [{ name: user.name, mobile: user.mobile }],
        categories: [],
        ignoreCategories: ["Invite", "payLater"],
        templateFor: ["B2B"],
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
        setWhatsappModal((s) => ({ ...s, show: false, category: undefined }));
        appToast.show({ msg: "WhatsApp message sent", color: "success" });
      }

      if (a.action === "send_error") {
        setWhatsappModal((s) => ({ ...s, show: false, category: undefined }));
        appToast.show({ msg: "Failed to send WhatsApp", color: "danger" });
      }
    },
    [appToast],
  );

  return (
    <>
      <Summary summary={summary} />

      <Filter
        callback={onFilterChange}
        showFilters={true}
        primaryBusinessOptions={primaryBusinessOptions}
      />

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
          <MobileView data={data} onAction={handleAction} />
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
            sortKey={sortRef.current.key}
            sortValue={sortRef.current.value}
            onSort={handleSort}
            loadMore={loadMore}
            loadingMore={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            hasMoreData={hasMoreData}
            onAction={handleAction}
          />
        </AppCard>
      )}
      <WhatsappTemplateModal
        show={!!whatsappModal.show}
        data={whatsappModal.data}
        users={whatsappModal.users}
        categories={whatsappModal.categories}
        templateFor={whatsappModal.templateFor}
        callback={handleWhatsappCallback}
      />
    </>
  );
};

export default B2b;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Retailers Directory"),
    },
  ];
}
