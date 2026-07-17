import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { format, isSameDay } from "date-fns";
import { CalendarClock, Loader2, MapPin } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { AppDateInput } from "~/components/core/form";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import OmsService from "~/services/OmsService";
import useAppToast from "~/hooks/useAppToast";
import {
  formatDateStr,
  getUpcomingDates,
} from "~/routes/dashboard/orders/partial-order-request/create/helper";

interface ShipLaterModalProps {
  show: boolean;
  orderId: string;
  customerId: string;
  isB2C?: boolean;
  onClose: () => void;
  callback: (data: { action: string; data?: any }) => void;
}

interface FormValues {
  deliveryDate: Date | undefined;
  reason: string;
}

const ShipLaterModal: React.FC<ShipLaterModalProps> = ({
  show,
  orderId,
  customerId,
  isB2C = false,
  onClose,
  callback,
}) => {
  const appToast = useAppToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [hasRoutes, setHasRoutes] = useState<boolean | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reason, setReason] = useState("");

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { deliveryDate: undefined, reason: "" },
  });

  const manualDate = useWatch({ control, name: "deliveryDate" });
  const effectiveDate = hasRoutes ? selectedDate : manualDate;

  const upcomingDates = useMemo(() => {
    if (!routeData?.deliveryDays?.length) return [];
    return getUpcomingDates(routeData.deliveryDays);
  }, [routeData]);

  const loadRoute = useCallback(async () => {
    if (isB2C) {
      setRouteData(null);
      setHasRoutes(false);
      setLoading(false);
      return;
    }
    if (!customerId) return;
    setLoading(true);
    try {
      const resp = await DeliveryRoutesService.getRoutesList({
        page: 1,
        limit: 1,
        filter: {
          isActive: true,
          "usersLinked.id": customerId,
        },
      });

      const data = resp?.data?.data || [];
      if (Array.isArray(data) && data.length > 0) {
        setRouteData(data[0]);
        setHasRoutes(true);
      } else {
        setRouteData(null);
        setHasRoutes(false);
      }
    } catch (err) {
      console.error("Error loading delivery route:", err);
      setRouteData(null);
      setHasRoutes(false);
    } finally {
      setLoading(false);
    }
  }, [customerId, isB2C]);

  useEffect(() => {
    if (show) {
      setSelectedDate(null);
      setRouteData(null);
      setHasRoutes(null);
      setReason("");
      setSubmitting(false);
      reset({ deliveryDate: undefined, reason: "" });
      loadRoute();
    }
  }, [show, loadRoute, reset]);

  const submitRequest = async (
    expectedDeliveryDate: string,
    reasonText: string,
  ) => {
    setSubmitting(true);
    try {
      const resp: any = await OmsService.shipLaterRequest(orderId, {
        expectedDeliveryDate,
        reason: reasonText,
      });
      if (resp && (resp.statusCode === 200 || resp.statusCode === 201)) {
        appToast.show({
          msg: resp?.data?.message || "Request sent to the customer",
          color: "success",
        });
        callback({ action: "success", data: resp?.data });
      } else {
        appToast.show({
          msg: resp?.data?.message || "Could not send. Please try again.",
          color: "danger",
        });
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Could not send. Please try again.",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedDate) {
      appToast.show({
        msg: "Please pick a day first",
        color: "warning",
      });
      return;
    }
    const isoDate = new Date(formatDateStr(selectedDate)).toISOString();
    submitRequest(isoDate, reason);
  };

  const onManualSubmit = (data: FormValues) => {
    if (!data.deliveryDate) {
      appToast.show({
        msg: "Please pick a day first",
        color: "warning",
      });
      return;
    }
    const isoDate = new Date(formatDateStr(data.deliveryDate)).toISOString();
    submitRequest(isoDate, data.reason || "");
  };

  return (
    <AppModal show={show} callback={onClose} className="tw:max-h-[90vh]">
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-start tw:gap-3">
          <div className="tw:flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-lg tw:bg-blue-50 tw:text-blue-600 tw:shrink-0">
            <CalendarClock className="tw:w-5 tw:h-5" />
          </div>
          <div className="tw:min-w-0">
            <p className="tw:text-base tw:font-semibold tw:text-slate-900 tw:leading-tight">
              Deliver this order later
            </p>
            <p className="tw:text-xs tw:text-slate-500 tw:mt-0.5">
              We will keep the order, and send it on the day you pick.
            </p>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        {loading && (
          <div className="tw:flex tw:flex-col tw:justify-center tw:items-center tw:h-28">
            <Loader2 className="tw:w-6 tw:h-6 tw:text-blue-600 tw:animate-spin tw:mb-2" />
            <p className="tw:text-sm tw:text-slate-500">Please wait...</p>
          </div>
        )}

        {/* Route found - show route name + date grid */}
        {!loading && hasRoutes && routeData && (
          <div className="tw:space-y-4">
            <div className="tw:flex tw:items-center tw:gap-2 tw:bg-slate-50 tw:border tw:border-slate-200 tw:rounded-lg tw:px-3 tw:py-2">
              <MapPin className="tw:w-4 tw:h-4 tw:text-slate-500 tw:shrink-0" />
              <div className="tw:min-w-0">
                <p className="tw:text-[11px] tw:text-slate-500">
                  Delivery area
                </p>
                <p className="tw:text-sm tw:font-semibold tw:text-slate-800 tw:truncate">
                  {routeData.description ||
                    routeData.routeCode ||
                    "Not specified"}
                </p>
              </div>
            </div>

            {upcomingDates.length > 0 ? (
              <div>
                <p className="tw:text-sm tw:font-medium tw:text-slate-700 tw:mb-2">
                  Choose a day
                </p>
                <div className="tw:grid tw:grid-cols-3 tw:sm:grid-cols-4 tw:gap-1.5">
                  {upcomingDates.map((date) => {
                    const isSelected =
                      selectedDate && isSameDay(selectedDate, date);
                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={`tw:rounded-md tw:border tw:py-1.5 tw:px-1 tw:text-center tw:transition-colors tw:cursor-pointer ${
                          isSelected
                            ? "tw:border-blue-500 tw:bg-blue-50 tw:ring-1 tw:ring-blue-500"
                            : "tw:border-slate-200 tw:bg-white hover:tw:border-slate-300 hover:tw:bg-slate-50"
                        }`}
                      >
                        <p
                          className={`tw:text-[10px] tw:font-medium tw:leading-none ${isSelected ? "tw:text-blue-600" : "tw:text-slate-500"}`}
                        >
                          {format(date, "EEE")}
                        </p>
                        <p
                          className={`tw:text-sm tw:font-semibold tw:leading-tight tw:mt-0.5 ${isSelected ? "tw:text-blue-700" : "tw:text-slate-900"}`}
                        >
                          {format(date, "dd MMM")}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="tw:rounded-lg tw:border tw:border-dashed tw:border-slate-200 tw:bg-slate-50/60 tw:px-3 tw:py-3">
                <p className="tw:text-sm tw:font-medium tw:text-slate-700">
                  No delivery days set for this area.
                </p>
                <p className="tw:text-xs tw:text-slate-500 tw:mt-0.5">
                  Please ask your manager to add them.
                </p>
              </div>
            )}

            <div>
              <label className="tw:text-sm tw:font-medium tw:text-slate-700 tw:mb-1 tw:block">
                Add a note <span className="tw:text-slate-400 tw:font-normal">(optional)</span>
              </label>
              <textarea
                className="tw:w-full tw:border tw:border-slate-200 tw:rounded-lg tw:px-3 tw:py-2 tw:text-sm tw:resize-none"
                rows={2}
                placeholder="Stock coming next week"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* No routes - manual date picker */}
        {!loading && hasRoutes === false && (
          <div className="tw:space-y-4">
            <Controller
              name="deliveryDate"
              control={control}
              render={({ field }) => (
                <AppDateInput
                  label="Delivery day"
                  isRequired
                  value={field.value}
                  callback={(dt) => {
                    const date = Array.isArray(dt) ? dt[0] : dt;
                    field.onChange(date);
                  }}
                  dateConfig={{
                    mode: "single",
                    disabled: { before: new Date() },
                  }}
                />
              )}
            />

            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="tw:text-sm tw:font-medium tw:text-slate-700 tw:mb-1 tw:block">
                    Add a note <span className="tw:text-slate-400 tw:font-normal">(optional)</span>
                  </label>
                  <textarea
                    className="tw:w-full tw:border tw:border-slate-200 tw:rounded-lg tw:px-3 tw:py-2 tw:text-sm tw:resize-none"
                    rows={2}
                    placeholder="Stock coming next week"
                    value={field.value}
                    onChange={field.onChange}
                  />
                </div>
              )}
            />
          </div>
        )}
      </AppModal.Content>

      {!loading && effectiveDate && (
        <div className="tw:border-t tw:border-slate-100 tw:bg-blue-50/60 tw:px-4 tw:py-3 tw:space-y-2">
          <div className="tw:flex tw:items-center tw:gap-3">
            <div className="tw:flex tw:h-11 tw:w-11 tw:flex-col tw:items-center tw:justify-center tw:rounded-lg tw:bg-white tw:border tw:border-blue-200 tw:shrink-0">
              <span className="tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-blue-600 tw:leading-none">
                {format(effectiveDate, "MMM")}
              </span>
              <span className="tw:text-lg tw:font-bold tw:text-slate-900 tw:leading-tight">
                {format(effectiveDate, "dd")}
              </span>
            </div>
            <div className="tw:min-w-0">
              <p className="tw:text-xs tw:text-slate-600">
                We will deliver this order on
              </p>
              <p className="tw:text-sm tw:font-semibold tw:text-slate-900">
                {format(effectiveDate, "EEEE, dd MMM")}
              </p>
            </div>
          </div>
          <p className="tw:text-xs tw:text-slate-600 tw:leading-relaxed tw:pl-14">
            The customer will get a message and can say{" "}
            <span className="tw:font-semibold tw:text-emerald-700">yes</span>{" "}
            or{" "}
            <span className="tw:font-semibold tw:text-rose-700">no</span>{" "}
            to this day.
          </p>
        </div>
      )}

      {!loading && (
        <AppModal.Footer className="tw:flex tw:gap-3 tw:p-4 tw:bg-gray-50/50">
          <AppButton
            fill="outline"
            onClick={onClose}
            className="tw:flex-1 tw:border-gray-200"
            disabled={submitting}
          >
            Cancel
          </AppButton>
          {hasRoutes ? (
            <AppButton
              color="primary"
              onClick={handleConfirm}
              disabled={!selectedDate || submitting}
              className="tw:flex-[1.5]"
            >
              {submitting ? "Sending..." : "Send request"}
            </AppButton>
          ) : (
            <AppButton
              color="primary"
              onClick={handleSubmit(onManualSubmit)}
              disabled={submitting}
              className="tw:flex-[1.5]"
            >
              {submitting ? "Sending..." : "Send request"}
            </AppButton>
          )}
        </AppModal.Footer>
      )}
    </AppModal>
  );
};

export default ShipLaterModal;
