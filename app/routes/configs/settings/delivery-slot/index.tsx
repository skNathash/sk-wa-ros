import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { endOfWeek, format, set, startOfWeek } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import { AppPaneMain } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import SettingsSidePane from "~/shared/settings/components/settings-side-pane/SettingsSidePane";
import { settingsSectionTabs } from "~/shared/settings/components/settings-side-pane/helper";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import PosService from "~/services/PosService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import Actions from "./components/Actions";
import CloneModal from "./modals/CloneModal";
import DeliverySlotManageModal from "./modals/DeliverySlotManageModal";
import useAppToast from "~/hooks/useAppToast";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import AuthService from "~/services/AuthService";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CONFIGS.DELIVERY-SLOT"]);
}

type ConfigModalData = {
  selectedDate: Date;
  slabs: Array<any>;
  mode: "add" | "edit";
  slabEditIndex: number;
  startTime: Date;
};

const plugins = [timeGridPlugin, interactionPlugin];

const dayHeaderFormat: any = {
  weekday: "short",
  month: "short",
  day: "numeric",
};

const defaultBreadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "Configs",
    langKey: "configs",
    redirect: { path: "/configs/settings" },
  },
  { label: "Delivery Slot", langKey: "deliverySlot" },
];

const DeliverySlot = () => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const appToast = useAppToast();

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Array<any>>([]);

  const [busyLoader, setBusyLoader] = useState({
    show: false,
    msg: "",
  });

  const [configModal, setConfigModal] = useState<{
    show: boolean;
    data: ConfigModalData;
  }>({
    show: false,
    data: {
      selectedDate: new Date(),
      slabs: [],
      mode: "add",
      slabEditIndex: -1,
      startTime: new Date(),
    },
  });

  const [cloneModal, setCloneModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: null,
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    successCb?: () => void;
    cancelCb?: () => void;
    type?: "alert" | "confirm";
    okText?: string;
    cancelText?: string;
  }>({
    show: false,
    title: "",
    description: "",
    successCb: () => {},
    cancelCb: () => {},
    type: "confirm",
    okText: "Continue",
    cancelText: "Cancel",
  });

  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    if (isMobile) {
      calendarRef.current?.getApi().changeView("timeGridDay");
    } else {
      calendarRef.current?.getApi().changeView("timeGridWeek");
    }
  }, [isMobile]);

  useEffect(() => {
    setStartDate(startOfWeek(new Date()));
    setEndDate(endOfWeek(new Date()));
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      const fetchData = async () => {
        const data = await getData(startDate, endDate);
        setEvents(data.data);
        setIsInitialLoad(false);
      };
      fetchData();
    }
  }, [startDate, endDate]);

  const handleDateClick = (info: any) => {
    openConfigModal(info);
  };

  const navigateToWeek = async (direction: "prev" | "next") => {
    const calendarApi = calendarRef.current?.getApi();
    if (direction == "next") {
      calendarApi?.next();
    } else {
      calendarApi?.prev();
    }

    const s = calendarApi?.view.currentStart;
    const e = calendarApi?.view.currentEnd;

    if (!s || !e) {
      return;
    }

    const from = set(s, { hours: 0, minutes: 0, seconds: 0 });
    const to = set(e, { hours: 23, minutes: 59, seconds: 59 });

    setStartDate(from);
    setEndDate(to);

    const data = await getData(from, to);
    setEvents(data.data);
    setIsInitialLoad(false);
  };

  const handleConfigModalCallback = async (a: {
    action: "submit" | "close";
    data?: any;
  }) => {
    setConfigModal({
      show: false,
      data: {
        selectedDate: new Date(),
        slabs: [],
        mode: "add",
        slabEditIndex: -1,
        startTime: new Date(),
      },
    });

    if (a.action == "submit") {
      if (startDate && endDate) {
        setBusyLoader({
          show: true,
          msg: t("pleaseWait"),
        });
        const data = await getData(startDate, endDate);
        setEvents(data.data);
        setIsInitialLoad(false);
        setBusyLoader({
          show: false,
          msg: "",
        });
      }
    }
  };

  const handleActionsCallback = async (action: "add" | "import") => {
    if (action === "import") {
      setCloneModal({
        show: true,
        data: null,
      });
    }
  };

  const eventClick = async (ev: any) => {
    const info = {
      date: ev.event.start,
      dateStr: format(ev.event.start, "yyyy-MM-dd"),
      jsEvent: ev.jsEvent,
      view: ev.view,
      event: ev.event,
    };

    openConfigModal(info);
  };

  const openConfigModal = async (info: any) => {
    const today = new Date();
    const clickDate = info.event?.start || info.date;

    if (clickDate < today) {
      appToast.show({
        msg: "You cannot edit past time slots.",
        color: "warning",
      });
      return;
    }

    const openModal = async (slabs: Array<any>) => {
      let existingSlabIndex = -1;

      if (info.event) {
        // If clicking on existing event, use its data
        const p = info.event.extendedProps;
        existingSlabIndex = p.subIndex;
      } else {
        // Calculate clicked time for empty slot clicks
        const clickedHour = info.date.getHours();
        const clickedMinutes = info.date.getMinutes();
        const clickedTime = clickedHour + clickedMinutes / 60;

        existingSlabIndex = (slabs || []).findIndex(
          (slab: any) => clickedTime >= slab.from && clickedTime < slab.to,
        );
      }

      const modalConfig: ConfigModalData = {
        selectedDate: new Date(info.dateStr),
        slabs: slabs || [],
        mode: existingSlabIndex !== -1 ? "edit" : "add",
        slabEditIndex: existingSlabIndex,
        startTime: clickDate,
      };

      setConfigModal({
        show: true,
        data: modalConfig,
      });
    };

    const params = {
      filter: {
        // franchiseId: AuthService.getLoggedInUserId(),
        date: {
          $gte: set(info.date, { hours: 0, minutes: 0, seconds: 0 }),
          $lte: set(info.date, { hours: 23, minutes: 59, seconds: 59 }),
        },
      },
    };
    const res = await PosService.getDeliveryTimeSlot(params);
    if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
      openModal(res.data.data[0].slab || []);
    } else {
      openModal([]);
    }
  };

  const handleCloneModalCallback = async (a: {
    action: "submit" | "close";
    data?: any;
  }) => {
    setCloneModal({ show: false, data: null });

    if (a.action == "submit") {
      if (startDate && endDate) {
        setBusyLoader({
          show: true,
          msg: t("pleaseWait"),
        });
        const data = await getData(startDate, endDate);
        setEvents(data.data);
        setIsInitialLoad(false);
        setBusyLoader({
          show: false,
          msg: "",
        });
      }
    }
  };

  const handleRefreshConfig = async () => {
    if (startDate && endDate) {
      setBusyLoader({
        show: true,
        msg: t("pleaseWait"),
      });
      const data = await getData(startDate, endDate);
      setEvents(data.data);
      setIsInitialLoad(false);
      setBusyLoader({
        show: false,
        msg: "",
      });
    }
  };

  const confirmAutoFill = () =>
    setAppAlertDialog({
      show: true,
      title: "Auto-fill Slots",
      description: "Next 30 days slots will be auto filled from today's date.",
      type: "confirm",
      okText: "Continue",
      cancelText: "Cancel",
      successCb: () => autoFillNext30Days(),
      cancelCb: () =>
        setAppAlertDialog((prev) => ({
          ...prev,
          show: false,
        })),
    });

  const autoFillNext30Days = async () => {
    setAppAlertDialog((prev) => ({ ...prev, show: false }));
    setBusyLoader({ show: true, msg: t("pleaseWait") });

    try {
      const franchiseId = AuthService.getLoggedInUserId() || "";
      if (!franchiseId) {
        throw new Error("franchiseId not found");
      }

      const resp = await CommonService.cloneDailyDeliveryTimeSlot({
        franchiseId,
      });

      if (resp?.statusCode === 200) {
        appToast.show({
          msg: resp.data.message || "Next 30 days slots have been cloned.",
          color: "success",
        });
      } else {
        appToast.show({ msg: "Failed to auto-fill slots.", color: "danger" });
      }

      if (startDate && endDate) {
        const data = await getData(startDate, endDate);
        setEvents(data.data);
        setIsInitialLoad(false);
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Something went wrong.",
        color: "danger",
      });
    } finally {
      setBusyLoader({ show: false, msg: "" });
    }
  };

  return (
    <>
      <AppHeader
        title={t("deliverySlotConfiguration")}
        sectionKey="profile"
        activeTab="settings"
        mobileLead="menu"
      />
      <div
        className={`app-page page-bg tw:p-4 ${isMobile ? "has-footer" : ""}`}
      >
        <div className="app-container">
          {/* Settings menu on mobile — theme-2 only (see theme-2.css); the
              desktop equivalent is the side pane below. */}
          <SectionTabs
            tabs={settingsSectionTabs}
            activeTab={"delivery-slot"}
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail. Settings is a tab of the Profile
                section, so the rail keeps listing the profile entries with
                "Settings" highlighted; moving between the individual config
                pages is the side pane's job. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="profile"
                  activeTab="settings"
                  title={t("settings.title")}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Full span: in theme-2 desktop the pane is lifted out of the
                    grid, so the main column owns all 12 columns. */}
                <AppPaneMain className="tw:lg:col-span-12">
                  <div className="tw:flex tw:flex-col tw:lg:flex-row tw:lg:justify-between tw:lg:items-start tw:gap-4 tw:mb-4">
                    <div className="tw:flex-1 tw:min-w-0">
                      <AppBreadcrumbs data={defaultBreadcrumbs} />
                      <div className="hide-in-theme-2 tw:text-gray-500 tw:text-xs">
                        {t("deliverySlotDescription")}
                      </div>
                    </div>
                    {/* Desktop action rail — on mobile the auto-fill CTA moves
                        into the sticky footer below. */}
                    <div className="tw:shrink-0 tw:hidden tw:md:block">
                      <div className="tw:flex tw:gap-2 tw:items-center">
                        <Actions callback={handleActionsCallback} />
                        <div>
                          <AppButton
                            size="small"
                            color="primary"
                            onClick={confirmAutoFill}
                          >
                            Auto fill next 30 days
                          </AppButton>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isInitialLoad ? (
                    <AppCard noPadding className="delivery-slot-sheet">
                      <div className="delivery-slot-sheet-body tw:p-4">
                        <div className="tw:h-[calc(100vh-200px)] tw:flex tw:items-center tw:justify-center">
                          <BusyLoader show={true} message={t("loading")} />
                        </div>
                      </div>
                    </AppCard>
                  ) : (
                    <AppCard noPadding className="delivery-slot-sheet">
                      <div className="delivery-slot-sheet-body tw:p-4">
                        <div className="tw:h-[calc(100vh-200px)]">
                          <FullCalendar
                            ref={calendarRef}
                            plugins={plugins}
                            initialView="timeGridWeek"
                            slotDuration="00:30:00"
                            slotMinTime="00:00:00"
                            height="100%"
                            expandRows={true}
                            allDaySlot={false}
                            editable={true}
                            selectable={true}
                            eventStartEditable={false}
                            dayHeaderFormat={dayHeaderFormat}
                            dateClick={handleDateClick}
                            eventContent={(info) => {
                              return {
                                html: `<div class="tw:text-[10px]"> ${info.timeText}, ${info.event.title} </div>`,
                              };
                            }}
                            eventClick={eventClick}
                            events={events}
                            customButtons={{
                              prev: {
                                text: t("prevWeek"),
                                click: () => navigateToWeek("prev"),
                              },
                              next: {
                                text: t("nextWeek"),
                                click: () => navigateToWeek("next"),
                              },
                            }}
                            headerToolbar={{
                              left: "title",
                              center: "",
                              right: "prev,next", // 'today' is removed here
                            }}
                          />
                        </div>
                      </div>
                    </AppCard>
                  )}
                </AppPaneMain>

                <SettingsSidePane activeKey="delivery-slot" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA — the desktop header button doesn't fit the narrow layout. */}
      <div className="app-footer tw:md:hidden">
        <div className="app-container">
          <AppButton className="tw:w-full" onClick={confirmAutoFill}>
            Auto fill next 30 days
          </AppButton>
        </div>
      </div>

      <DeliverySlotManageModal
        show={configModal.show}
        callback={handleConfigModalCallback}
        data={configModal.data}
      />

      <CloneModal
        show={cloneModal.show}
        callback={handleCloneModalCallback}
        data={cloneModal.data}
      />

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        type={appAlertDialog.type}
        okText={appAlertDialog.okText}
        cancelText={appAlertDialog.cancelText}
        onConfirm={appAlertDialog.successCb}
        onCancel={appAlertDialog.cancelCb}
      />

      <BusyLoader show={busyLoader.show} />
    </>
  );
};

const getData = async (from: Date, to: Date) => {
  const p = {
    filter: {
      // franchiseId: AuthService.getLoggedInUserId(),
      date: {
        $gte: set(from, { hours: 0, minutes: 0, seconds: 0 }),
        $lte: set(to, { hours: 23, minutes: 59, seconds: 59 }),
      },
    },
  };
  const resp = await PosService.getDeliveryTimeSlot(p);
  let ev: Array<any> = [];

  (resp.data?.data || []).forEach((x: any, k1: number) => {
    if (!x.date) {
      return;
    }

    (x.slab || []).forEach((e: any, k2: number) => {
      const startDate = set(x.date, {
        hours: e.from,
        minutes: Math.round((e.from % 1) * 100),
        seconds: 0,
      });

      const now = new Date();
      const isPast = startDate < now;

      ev.push({
        mainIndex: k1,
        subIndex: k2,
        date: x.date,
        start: startDate.toISOString(),
        end: set(x.date, {
          hours: e.to,
          minutes: Math.round((e.to % 1) * 100),
          seconds: 0,
        }).toISOString(),
        title: `Max. ${e.ordersLimit} shipments`,
        classNames: isPast ? ["tw:bg-gray-100"] : [],
        backgroundColor: isPast ? "#f3f4f6" : undefined,
        borderColor: isPast ? "#e5e7eb" : undefined,
        textColor: isPast ? "#767676" : undefined,
      });
    });
  });

  return {
    data: ev,
    raw: resp.data,
  };
};

export default DeliverySlot;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle(
        "Delivery Slot Configuration",
      ),
    },
  ];
}
