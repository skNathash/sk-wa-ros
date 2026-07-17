import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import AppTab from "~/components/core/tab/AppTab";
import useScreenView from "~/hooks/useScreenView";
import type {
  PaginationState,
  TabItem,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import {
  defaultFilterFormData,
  getCount,
  getData,
  prepareParams,
} from "./helper";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import MobileView from "./components/MobileView";
import ViewEmailMessageModal from "~/shared/notifications/modals/view-email/ViewEmailMessageModal";
import ViewWhatsappModal from "~/shared/notifications/modals/view-whatsapp/ViewWhatsappModal";

const tabs: TabItem[] = [
  {
    key: "whatsappGeneric",
    name: "Whatsapp Generic",
  },
  // {
  //   key: "whatsappLocal",
  //   name: "Whatsapp Local",
  // },
  {
    key: "sms",
    name: "SMS",
  },
  {
    key: "email",
    name: "Email",
  },
];

type NotificationLogsProps = {
  mobileNo: string;
  userId: string;
  type: "b2b" | "b2c";
  email?: string;
};

const NotificationLogs = ({
  mobileNo,
  userId,
  type,
  email,
}: NotificationLogsProps) => {
  const [activeTab, setActiveTab] = useState<TabItem["key"]>("whatsappGeneric");
  const formMethods = useForm({
    defaultValues: defaultFilterFormData,
  });

  const { getValues, setValue } = formMethods;

  const { isMobile } = useScreenView();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setView] = useState<ViewToggleType>("list");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [whatsappData, setWhatsappData] = useState<{
    message: string;
    headerImage?: string;
  } | null>(null);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const handleTabChange = (tab: TabItem) => {
    setValue("tab", tab.key);
    setActiveTab(tab.key);
  };

  const getFilterData = () => {
    const values: Record<string, any> = getValues();
    return {
      ...values,
      mobileNo,
      userId,
      type,
      email,
    };
  };

  const applyFilter = async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(getFilterData(), paginationRef.current);
      const result = await getData(activeTab, params);
      setData(result || []);
      const totalRecords = await getCount(activeTab, params);
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
  };

  const handleFilterChange = () => {
    applyFilter();
  };

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(getFilterData(), paginationRef.current);
      const result = await getData(activeTab, params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  };

  const handleViewCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action === "view-email") {
      setEmailMsg(data?.message || "");
    }
    if (action === "view-whatsapp") {
      setWhatsappData({
        message: data?.message || "",
        headerImage: data?.headerImage,
      });
    }
  };

  const handleEmailModalCallback = () => {
    setEmailMsg(null);
  };

  useEffect(() => {
    applyFilter();
  }, [activeTab, mobileNo, userId, type]);

  return (
    <>
      <AppTab
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className="tw:mb-4"
      />

      <FormProvider {...formMethods}>
        <Filter callback={handleFilterChange} />
      </FormProvider>

      <div className="tw:mb-4 tw:flex tw:items-center tw:justify-between">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>
        <div>
          <ViewToggle viewType={view} callback={setView} />
        </div>
      </div>

      {isMobile || view === "card" ? (
        <MobileView
          data={data}
          loading={loading}
          hasMoreData={hasMoreData}
          loadingMore={loadingMore}
          loadMore={loadMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          activeTab={activeTab}
          callback={handleViewCallback}
        />
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            hasMoreData={hasMoreData}
            loadingMore={loadingMore}
            loadMore={loadMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            activeTab={activeTab}
            callback={handleViewCallback}
          />
        </AppCard>
      )}

      <ViewEmailMessageModal
        show={emailMsg !== null}
        callback={handleEmailModalCallback}
        msg={emailMsg || ""}
      />

      <ViewWhatsappModal
        show={whatsappData !== null}
        callback={() => setWhatsappData(null)}
        msg={whatsappData?.message || ""}
        headerImg={whatsappData?.headerImage}
      />
    </>
  );
};

export default NotificationLogs;
