import { produce } from "immer";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useParams, useSearchParams } from "react-router";
import { format, parseISO, isValid } from "date-fns";
import { Zap } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import PaylaterService from "~/services/PaylaterService";
import AuthService from "~/services/AuthService";
import PaylaterManageWalletModal from "~/shared/accounts/modals/paylater/manage-wallet/PaylaterManageWalletModal";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import useAppNav from "~/hooks/useAppNav";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";
import CommonService from "~/services/CommonService";

const Wallets = () => {
  const { isMobile } = useScreenView();
  const { type } = useParams();
  const nav = useAppNav();

  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get("status") || "All";

  const methods = useForm({
    defaultValues: {
      search: "",
      status: urlStatus,
      kycStatus: "",
      alpha: "",
    },
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [viewType, setViewType] = useState<ViewToggleType>("list");

  const [manageModal, setManageModal] = useState<{
    show: boolean;
    data: any | null;
  }>({ show: false, data: null });

  const [reminderModal, setReminderModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: {} });

  const handleAssignPaylater = () => {
    nav.to("/dashboard/paylater/assign", { type: type || "b2b" });
  };

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({});

  const handleAction = useCallback((payload: { action: string; data: any }) => {
    if (payload.action === "manage") {
      setManageModal({ show: true, data: payload.data });
    } else if (payload.action === "view") {
    } else if (payload.action === "send-reminder") {
      const item = payload.data;
      const user = AuthService.getLoggedInUser() || {};

      // Get franchise name
      const franchiseName = user?.name;

      // Format due date - check for validityEndDate or similar field
      let formattedDueDate = "";
      if (item.validityEndDate) {
        try {
          const dateValue =
            typeof item.validityEndDate === "string"
              ? parseISO(item.validityEndDate)
              : item.validityEndDate;
          if (isValid(dateValue)) {
            formattedDueDate = format(dateValue, "dd MMM yyyy");
          }
        } catch (e) {
          formattedDueDate = String(item.validityEndDate || "");
        }
      }

      // Prepare template data according to PaylaterNotificationTemplate interface
      const templateData = {
        customerName: item.userInfo?.name || "",
        franchiseName: franchiseName,
        amount: CommonService.formattedAmount(item.outstandingBalance || 0),
        dueDate: formattedDueDate,
        franchiseId: AuthService.getLoggedInUserId(),
        customerId: item.userInfo?._id,
      };

      // Prepare modal data
      const modalData = {
        data: {
          dynamicData: templateData,
        },
        users: [
          {
            name: item.userInfo?.name || "",
            mobile: item.userInfo?.mobile || "",
            type: "Customer",
          },
          ...(item.NomineeDetails || []).map((nominee: any) => ({
            name: nominee.name || "",
            mobile: nominee.mobile || "",
            type: "Nominee",
          })),
        ],
        categories: ["payLater"],
        templateFor: [type === "b2b" ? "B2B" : "B2C"],
      };

      setReminderModal({ show: true, data: modalData });
    }
  }, []);

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
      const params = prepareParams(
        methods.getValues(),
        paginationRef.current,
        {
          key: "",
          value: "asc",
        },
        type,
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
      setLoading(false);
    }
  }, [type]);

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
        {
          key: "",
          value: "asc",
        },
        type,
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
  }, [loadingMore, hasMoreData, type]);

  // Initial load
  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  // When `type` route param changes, reset pagination and filters
  useEffect(() => {
    // reset pagination and filter refs
    paginationRef.current = {
      activePage: 1,
      rowsPerPage: 10,
      startSlNo: 1,
      endSlNo: 10,
      totalRecords: 0,
    };
    filterRef.current = {
      status: urlStatus,
    };

    // reset form values in the Filter (if mounted)
    try {
      methods.reset({
        status: urlStatus || "",
      });
    } catch (e) {
      // ignore if form not yet mounted
    }

    // re-fetch for the new type
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, urlStatus]);

  // Filter change handler
  const onFilterChange = useCallback(
    (data: any) => {
      filterRef.current = {
        ...filterRef.current,
        ...data.formData,
      };
      applyFilter();
    },
    [applyFilter],
  );

  // Determine title based on type
  const getTitle = () => {
    if (type == "b2b") {
      return `B2B Customer Wallets (${data.length})`;
    }
    return `B2C Customer Wallets (${data.length})`;
  };

  const handleModalCallback = (payload: { action: string; data?: any }) => {
    setManageModal({ show: false, data: null });

    const updated = payload?.data;
    if (!updated?._id) return;

    const [formatted] = PaylaterService.formatPaylaterRequest([updated]) as any[];

    setData(
      produce((draft) => {
        const index = draft.findIndex((item) => item._id === updated._id);
        if (index !== -1) {
          draft[index] = {
            ...draft[index],
            ...formatted,
            viewBtnLink:
              formatted.status === "Pending"
                ? `/dashboard/paylater/view/${formatted._id}`
                : formatted.userRedirectionLink,
          };
        }
      }),
    );
  };

  const handleReminderModalCallback = useCallback(
    (payload: { action: string; data?: any }) => {
      if (payload.action === "close") {
        setReminderModal({ show: false, data: {} });
      } else if (payload.action === "send") {
        // Handle sending the reminder here
        // You can call a service method to send the notification

        setReminderModal({ show: false, data: {} });
        // TODO: Add actual API call to send reminder
      } else if (payload.action === "send_error") {
        setReminderModal({ show: false, data: {} });
      }
    },
    [],
  );

  return (
    <>
      <div className="tw:md:py-4">
        <FormProvider {...methods}>
          <Filter callback={onFilterChange} />
        </FormProvider>

        <div className="tw:flex tw:justify-between tw:items-center tw:mb-2 tw:md:mb-0">
          <div>
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loading}
              loadedCount={data.length}
              fwSize="sm"
            />
          </div>
          <div className="tw:flex tw:items-center tw:gap-2">
            <AppButton
              size="small"
              color="success"
              fill="solid"
              onClick={handleAssignPaylater}
            >
              <Zap size={14} />
              {AuthService.isManpowerLoggedIn()
                ? "Create PayLater Request"
                : "Assign PayLater"}
            </AppButton>
            <ViewToggle viewType={viewType} callback={setViewType} />
          </div>
        </div>
      </div>

      {isMobile || viewType === "card" ? (
        <MobileView data={data} loading={loading} callback={handleAction} />
      ) : (
        <AppCard noPadding>
          <DesktopView data={data} loading={loading} callback={handleAction} />
        </AppCard>
      )}
      {hasMoreData && !loading && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      <PaylaterManageWalletModal
        show={manageModal.show}
        callback={handleModalCallback}
        userId={manageModal.data?.userInfo?.id}
        routeType={type}
      />

      <WhatsappTemplateModal
        show={reminderModal.show}
        callback={handleReminderModalCallback}
        data={reminderModal.data.data}
        users={reminderModal.data.users}
        categories={reminderModal.data.categories}
        templateFor={reminderModal.data.templateFor}
      />
    </>
  );
};

export default Wallets;
