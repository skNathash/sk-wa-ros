import { useCallback, useEffect, useRef, useState } from "react";
import PageAccessService from "~/services/PageAccessService";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import Item from "./components/Item";
import CardView from "./components/CardView";
import { getCount, getData, prepareParams } from "./helper";
import MarkAsDeliveredModal from "~/shared/logistics/modals/mark-as-delivered/MarkAsDeliveredModal";
import { useForm } from "react-hook-form";
import { debounce } from "lodash";
import { AppInput } from "~/components/core/form/AppInput";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import CommonService from "~/services/CommonService";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { useTranslation } from "react-i18next";
import AuthService from "~/services/AuthService";
import useAppToast from "~/hooks/useAppToast";
import useTheme from "~/hooks/useTheme";
import { Search } from "lucide-react";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import PageDescription from "~/components/core/page-description/PageDescription";
import DeliveryTabs from "~/shared/delivery/components/delivery-tabs/DeliveryTabs";
import PageTopBar from "~/shared/layout/page-top-bar/PageTopBar";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Delivery Management",
    langKey: "deliveryManagement",
  },
];

export async function clientLoader() {
  return PageAccessService.canAccessPage(["DELIVERY.DISPATCH"]);
}

export default function InTransit() {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();
  const isTheme2 = useTheme() === "theme-2";

  const { register, getValues } = useForm({
    defaultValues: {
      search: "",
    },
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Modal state
  const [modal, setModal] = useState<{ show: boolean; data: any | null }>({
    show: false,
    data: null,
  });

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({});

  // Item callback handler
  const handleItemCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (AuthService.isMasterLogin()) {
      appToast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "error",
      });
      return;
    }
    if (action === "mark-delivered") {
      setModal({ show: true, data });
    }
  };

  // Modal callback handler
  const handleModalCallback = ({
    action,
    data: modalData,
  }: {
    action: string;
    data?: any;
  }) => {
    setModal({ show: false, data: null });
    if (action === "submit") {
      setModal({ show: false, data: null });
      // Update the record status to "Delivered" in the local data
      if (modal.data?.orderId) {
        setData((prevData) =>
          prevData.map((item) =>
            item.orderId === modal.data.orderId
              ? { ...item, status: "Delivered" }
              : item
          )
        );
      }
      // Refresh the data to get updated status from server
      applyFilter();
    }
  };

  // Apply filter (initial load or filter change)
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
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "orderDate",
        value: "desc",
      });
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };
    const params = prepareParams(filterRef.current, paginationRef.current, {
      key: "orderDate",
      value: "desc",
    });
    const result = await getData(params);
    setData([...data, ...result]);
    setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    setLoadingMore(false);
  };

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const handleSearchChange = useCallback(
    debounce(() => {
      filterRef.current = {
        ...filterRef.current,
        search: getValues("search"),
      };
      applyFilter();
    }, 500),
    [applyFilter, getValues]
  );

  return (
    <>
      {/* Sub-nav + search on one full-bleed white strip pinned under the app
          header — the top block every reworked section page opens with. */}
      <PageTopBar
        lead={
          <DeliveryTabs
            activeTab="in-transit"
            variant={isTheme2 ? "pills" : undefined}
          />
        }
        trail={
          <AppInput
            register={register}
            name="search"
            placeholder={t("searchByOrderIdCustomerNameMobile")}
            className="tw:w-full"
            onChange={handleSearchChange}
            leftIcon={<Search size={16} />}
          />
        }
      />

      {/* theme-2 drops the breadcrumb block; the strip above is the page's
          whole top section there. */}
      <div className="hide-in-theme-2">
        <AppBreadcrumbs data={breadcrumbs} />
        <PageDescription description="lastMileDelivery" className="tw:mb-4" />
      </div>

      {!loading && data.length > 0 && (
        <div className="tw:mb-4">
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>
      )}

      {/* theme-2 runs one card everywhere — a single column on phones, three
          across on desktop; every other theme keeps its own cards. */}
      {isTheme2 ? (
        <CardView data={data} loading={loading} callback={handleItemCallback} />
      ) : loading ? (
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="tw:bg-white tw:p-4 tw:rounded-lg tw:border tw:border-gray-200"
            >
              <div className="tw:animate-pulse">
                <div className="tw:flex tw:items-start tw:mb-4">
                  <div className="tw:w-16 tw:h-16 tw:bg-gray-200 tw:rounded tw:mr-4"></div>
                  <div className="tw:flex-1">
                    <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:mb-2"></div>
                    <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:mb-2"></div>
                    <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/2"></div>
                  </div>
                </div>
                <div className="tw:space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div
                      key={j}
                      className="tw:flex tw:justify-between tw:items-center"
                    >
                      <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/4"></div>
                      <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/3"></div>
                    </div>
                  ))}
                </div>
                <div className="tw:mt-4 tw:h-8 tw:bg-gray-200 tw:rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <NoData />
      ) : (
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
          {data.map((item) => (
            <Item key={item._id} item={item} callback={handleItemCallback} />
          ))}
        </div>
      )}

      {hasMoreData && !loading && data.length > 0 && (
        <div className="tw:flex tw:justify-center tw:mt-4">
          <LoadMoreButton
            loadMore={loadMore}
            loadedCount={data.length}
            loading={loadingMore}
            totalCount={paginationRef.current.totalRecords}
          />
        </div>
      )}

      {/* Mark Delivery Modal */}
      <MarkAsDeliveredModal
        show={modal.show}
        callback={handleModalCallback}
        orderId={modal.data?.orderId || ""}
      />
    </>
  );
}

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("In Transit"),
    },
  ];
}
