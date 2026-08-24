import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, getDispatchSummary, prepareParams } from "./helper";

import { produce } from "immer";
import { debounce } from "lodash";
import { Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import { AppInput } from "~/components/core/form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PageDescription from "~/components/core/page-description/PageDescription";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import AssignDeliveryPersonModal from "~/modals/feature/delivery/assign-delivery/AssignDeliveryPersonModal";
import DeliveryAssignOtpVerifyModal from "~/modals/feature/delivery/DeliveryAssignOtpVerifyModal";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import SellerService from "~/services/SellerService";
import DeliveryTabs from "~/shared/delivery/components/delivery-tabs/DeliveryTabs";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import CardView from "./components/CardView";
import DispatchMethodModal from "./components/DispatchMethodModal";
import Item from "./components/Item";
import ItemLoader from "./components/ItemLoader";
import DispatchSummary from "./components/theme2/DispatchSummary";
import DispatchTrackerMap from "./components/theme2/DispatchTrackerMap";
import type { DispatchSummaryTile } from "./components/theme2/helper";
import {
  defaultLiveRunners,
  defaultLiveShipments,
  defaultTrackerMarkers,
} from "./components/theme2/helper";
import LiveShipmentFeed from "./components/theme2/LiveShipmentFeed";

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

const Dispatch = () => {
  const { t } = useTranslation(["common"]);
  const isTheme2 = useTheme() === "theme-2";
  const { isMobile } = useScreenView();
  // Toggled from the mobile-only search action in the delivery layout AppHeader.
  const { showSearch = false } = useOutletContext<{ showSearch?: boolean }>();
  const { register, getValues } = useForm({
    defaultValues: {
      search: "",
    },
  });
  const appToast = useAppToast();
  const navigate = useNavigate();

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<DispatchSummaryTile[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [busyloader, setBusyloader] = useState({
    show: false,
    message: "",
  });

  // Modal states
  const [dispatchMethodModal, setDispatchMethodModal] = useState<{
    show: boolean;
    data?: any;
  }>({ show: false });
  const [assignModal, setAssignModal] = useState<{ show: boolean; data?: any }>(
    { show: false },
  );
  const [otpModal, setOtpModal] = useState<{ show: boolean; data?: any }>({
    show: false,
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
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
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
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "orderDate",
        value: "desc",
      });
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
    applyFilter();
  }, []);

  // Counters for the theme-2 summary strip.
  useEffect(() => {
    if (!isTheme2) return;
    setSummaryLoading(true);
    getDispatchSummary()
      .then(setSummary)
      .catch(() => setSummary([]))
      .finally(() => setSummaryLoading(false));
  }, [isTheme2]);

  const onFilterChange = useCallback((data: any) => {
    filterRef.current = {
      ...filterRef.current,
      ...data.formData,
    };
    applyFilter();
  }, []);

  // Handler for Item callback
  const handleItemCallback = useCallback(
    async (args: { action: string; data?: any }) => {
      if (AuthService.isMasterLogin()) {
        appToast.show({
          msg: t("youAreNotAuthorizedToDoThisAction"),
          color: "error",
        });
        return;
      }

      if (args.action === "assign") {
        // theme-2 works the assignment on its own desk instead of the modal
        // chain — hand the order over through the query string.
        if (isTheme2) {
          navigate(
            `/dashboard/delivery/assign-runner?orderId=${args.data.orderId}`,
          );
          return;
        }

        setBusyloader({ show: true, message: "Loading order details..." });
        const response = await SellerService.getSellerOrderDetail(
          args.data.orderId,
        );
        setBusyloader({ show: false, message: "" });

        if (response.statusCode === 200 && response.data?.data?._id) {
          const orderDetails = response.data?.data;
          // Open DispatchMethodModal to choose delivery method
          setDispatchMethodModal({
            show: true,
            data: {
              invoiceId: orderDetails.invoices?.[0]?.id,
              orderAmount: orderDetails?.orderAmount,
              orderId: orderDetails?._id,
              orderType: orderDetails?.orderType,
              orderRefNo: args.data.orderRefNo,
            },
          });
        } else {
          appToast.show({
            msg: response.data?.message || "Failed to load order details",
            color: "danger",
          });
        }
      } else if (args.action === "verify-otp") {
        // Show OTP verification modal for existing pending shipment
        setOtpModal({
          show: true,
          data: {
            orderId: args.data.orderId,
            orderRefNo: args.data.orderRefNo,
            assignmentResponse: {
              shipmentId: args.data.invoices?.[0]?.shippingDetails?.shipmentId,
            },
            deliveryPersonName:
              args.data.invoices?.[0]?.shippingDetails?.name || undefined,
            deliveryPersonContact:
              args.data.invoices?.[0]?.shippingDetails?.contact || undefined,
          },
        });
      }
    },
    [appToast, isTheme2, navigate],
  );

  // Handler for DispatchMethodModal callback
  const handleDispatchMethodModalCallback = useCallback(
    (args: { action: string; data?: any }) => {
      if (args.action === "close") {
        setDispatchMethodModal({ show: false });
      } else if (args.action === "deliveryAssigned") {
        // Self-shipment path from DispatchMethodModal should not open OTP.
        // Mark as approved in list and update status.
        setData(
          produce((draft) => {
            const orderId =
              args.data?.orderId || dispatchMethodModal.data?.orderId;
            const index = draft.findIndex(
              (item: any) => item._id === orderId || item.orderId === orderId,
            );
            if (index !== -1) {
              if (!draft[index].invoices) draft[index].invoices = [{}];
              if (!draft[index].invoices[0].shippingDetails)
                draft[index].invoices[0].shippingDetails = {};
              draft[index].invoices[0].shippingDetails.isApproved = true;
              draft[index].status = "Pending Shipment";
            }
          }),
        );
        setDispatchMethodModal({ show: false });
        // Optionally refresh from server after a short delay
        setTimeout(() => applyFilter(), 800);
      } else if (args.action === "openAssignModal") {
        // Close dispatch method modal first, then open assign modal
        setDispatchMethodModal({ show: false });
        setAssignModal({
          show: true,
          data: {
            ...dispatchMethodModal.data,
            ...args.data,
          },
        });
      }
    },
    [dispatchMethodModal.data, applyFilter],
  );

  // Handler for AssignDeliveryPersonModal callback
  const handleAssignModalCallback = useCallback(
    (args: { action: string; data?: any }) => {
      if (args.action === "close") {
        setAssignModal({ show: false });
      } else if (args.action === "submit") {
        // Show OTP verification modal after successful assignment
        setOtpModal({
          show: true,
          data: {
            ...assignModal.data,
            ...args.data,
          },
        });
        setAssignModal({ show: false });
      }
    },
    [assignModal.data],
  );

  // Handler for OtpVerifyModal callback
  const handleOtpModalCallback = useCallback(
    (args: { action: string; data?: any }) => {
      if (args.action === "close" || args.action === "back") {
        setOtpModal({ show: false });
      } else if (args.action === "success") {
        // Handle successful OTP verification
        appToast.show({
          msg: "OTP verified successfully!",
          color: "success",
        });

        // Update the order status in the list - mark as approved
        setData(
          produce((draft) => {
            const orderId = otpModal.data?.orderId;

            const index = draft.findIndex((item: any) => item._id === orderId);
            if (index !== -1) {
              // Update the isApproved status to true
              if (draft[index].invoices?.[0]?.shippingDetails) {
                draft[index].invoices[0].shippingDetails.isApproved = true;
              }
            }
          }),
        );

        setOtpModal({ show: false });

        // Refresh the data to ensure we have the latest status
        setTimeout(() => {
          applyFilter();
        }, 1000);
      }
    },
    [otpModal.data, appToast, applyFilter],
  );

  const handleSearchChange = useCallback(
    debounce(() => {
      filterRef.current = {
        ...filterRef.current,
        search: getValues("search"),
      };
      applyFilter();
    }, 500),
    [applyFilter, getValues],
  );

  return (
    <>
      {/* Sub-nav + search on one full-bleed white strip pinned under the app
          header — the top block every reworked section page opens with. */}
      {!isTheme2 ? (
        <DeliveryTabs
          activeTab="dispatch"
          variant={isTheme2 ? "pills" : undefined}
        />
      ) : null}

      {/* theme-2 drops the breadcrumb block; the strip above is the page's
          whole top section there. */}
      <div className="hide-in-theme-2">
        <AppBreadcrumbs data={breadcrumbs} />
        <PageDescription description="lastMileDelivery" className="tw:mb-4" />
      </div>
      {/* Counters the dispatch desk watches while working the list. */}
      {isTheme2 && (
        <DispatchSummary
          data={summary}
          loading={summaryLoading}
          className={`tw:max-lg:-mt-4 ${
            isMobile && showSearch ? "tw:mb-0" : "tw:mb-4"
          }`}
        />
      )}

      {/* Mobile search appears after the summary strip, inside a white
          container. */}
      {isMobile && showSearch && (
        <div className="tw:-ml-4 tw:-mr-4 tw:mb-4 tw:flex tw:items-center tw:gap-2 tw:bg-white tw:px-4 tw:py-3">
          <div className="tw:flex-1">
            <AppInput
              register={register}
              name="search"
              placeholder={t("searchByOrderIdCustomerNameMobile")}
              className="tw:w-full"
              onChange={handleSearchChange}
              leftIcon={<Search size={16} />}
            />
          </div>
        </div>
      )}

      {/* Live tracking surface + shipment feed — theme-2 desktop only; phones
          skip mounting the map entirely. */}
      {isTheme2 && !isMobile && (
        <div className="tw:mb-4 tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-3">
          <DispatchTrackerMap
            className="tw:lg:col-span-2"
            liveCount={10}
            runnerCount={4}
            markers={defaultTrackerMarkers}
            runners={defaultLiveRunners}
          />
          <LiveShipmentFeed
            className="tw:lg:col-span-1"
            shipments={defaultLiveShipments}
            autoRefreshSeconds={5}
          />
        </div>
      )}

      {/* Desktop search sits above the pagination summary block. */}
      {!isMobile && (
        <div className="tw:mb-4 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-3">
          <AppInput
            register={register}
            name="search"
            placeholder={t("searchByOrderIdCustomerNameMobile")}
            className="tw:w-full"
            onChange={handleSearchChange}
            leftIcon={<Search size={16} />}
          />
        </div>
      )}

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
          {Array.from({ length: 6 }).map((_, index) => (
            <ItemLoader key={index} />
          ))}
        </div>
      ) : data.length === 0 ? (
        <NoData />
      ) : (
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
          {data.map((item) => (
            <Item key={item._id} data={item} callback={handleItemCallback} />
          ))}
        </div>
      )}
      {hasMoreData && !loading && data.length > 0 && (
        <div className="tw:text-center tw:mt-4">
          <LoadMoreButton
            loadMore={loadMore}
            loadedCount={data.length}
            loading={loadingMore}
            totalCount={paginationRef.current.totalRecords}
          />
        </div>
      )}
      <DispatchMethodModal
        show={dispatchMethodModal.show}
        callback={handleDispatchMethodModalCallback}
        data={dispatchMethodModal.data}
      />
      <AssignDeliveryPersonModal
        show={assignModal.show}
        callback={handleAssignModalCallback}
        type="self-shipment"
        data={assignModal.data}
      />
      <DeliveryAssignOtpVerifyModal
        show={otpModal.show}
        callback={handleOtpModalCallback}
        data={otpModal.data}
      />
      <BusyLoader show={busyloader.show} message={busyloader.message} />
    </>
  );
};

export default Dispatch;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Dispatch"),
    },
  ];
}
