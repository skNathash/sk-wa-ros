import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import { buildReminderModalDataFromRequest } from "../../helper";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";

const Collect = () => {
  const { t } = useTranslation();
  const { isMobile } = useScreenView();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [viewType, setViewType] = useState<ViewToggleType>("list");
  const [reminderModal, setReminderModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: {} });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<any>({});

  const applyFilter = useCallback(async () => {
    setLoading(true);
    const params = prepareParams(filterRef.current, paginationRef.current);
    const result = await getData(params);
    setData(result || []);
    const totalCount = await getCount(params);
    paginationRef.current = {
      ...paginationRef.current,
      totalRecords: totalCount,
    };
    setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    setLoading(false);
  }, []);

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
  }, [applyFilter]);

  const handleAction = useCallback((payload: { action: string; data: any }) => {
    if (payload.action === "send-reminder") {
      setReminderModal({
        show: true,
        data: buildReminderModalDataFromRequest(payload.data),
      });
    }
  }, []);

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
      <div className="tw:flex tw:justify-between tw:items-center tw:mb-4">
        <div>
          <div className="tw:text-base tw:font-semibold">
            {t("dueCollection")}
          </div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>
        <ViewToggle viewType={viewType} callback={setViewType} />
      </div>
      {isMobile || viewType === "card" ? (
        <MobileView
          data={data}
          loading={loading}
          loadMore={loadMore}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          hasMoreData={hasMoreData}
          callback={handleAction}
        />
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
            callback={handleAction}
          />
        </AppCard>
      )}

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

export default Collect;
