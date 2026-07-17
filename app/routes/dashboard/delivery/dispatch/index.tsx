import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";

import { produce } from "immer";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppToast from "~/hooks/useAppToast";
import AssignDeliveryPersonModal from "~/modals/feature/delivery/assign-delivery/AssignDeliveryPersonModal";
import DeliveryAssignOtpVerifyModal from "~/modals/feature/delivery/DeliveryAssignOtpVerifyModal";
import DispatchMethodModal from "./components/DispatchMethodModal";
import SellerService from "~/services/SellerService";
import Item from "./components/Item";
import { AppInput } from "~/components/core/form";
import { useForm } from "react-hook-form";
import { debounce } from "lodash";
import PageAccessService from "~/services/PageAccessService";
import CommonService from "~/services/CommonService";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { useTranslation } from "react-i18next";
import AuthService from "~/services/AuthService";
import ItemLoader from "./components/ItemLoader";
import { Search } from "lucide-react";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["DELIVERY.DISPATCH"]);
}

const Dispatch = () => {
  const { t } = useTranslation(["common"]);
  const { register, getValues } = useForm({
    defaultValues: {
      search: "",
    },
  });
  const appToast = useAppToast();

  const [data, setData] = useState<any[]>([]);
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
    { show: false }
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
        (result || []).length >= paginationRef.current.rowsPerPage
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
        (result || []).length >= paginationRef.current.rowsPerPage
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
        setBusyloader({ show: true, message: "Loading order details..." });
        const response = await SellerService.getSellerOrderDetail(
          args.data.orderId
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
    [appToast]
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
              (item: any) => item._id === orderId || item.orderId === orderId
            );
            if (index !== -1) {
              if (!draft[index].invoices) draft[index].invoices = [{}];
              if (!draft[index].invoices[0].shippingDetails)
                draft[index].invoices[0].shippingDetails = {};
              draft[index].invoices[0].shippingDetails.isApproved = true;
              draft[index].status = "Pending Shipment";
            }
          })
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
    [dispatchMethodModal.data, applyFilter]
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
    [assignModal.data]
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
          })
        );

        setOtpModal({ show: false });

        // Refresh the data to ensure we have the latest status
        setTimeout(() => {
          applyFilter();
        }, 1000);
      }
    },
    [otpModal.data, appToast, applyFilter]
  );

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
      <AppInput
        register={register}
        name="search"
        placeholder={t("searchByOrderIdCustomerNameMobile")}
        className="tw:w-full tw:mb-4"
        onChange={handleSearchChange}
        leftIcon={<Search size={16} />}
      />

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

      {loading ? (
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
