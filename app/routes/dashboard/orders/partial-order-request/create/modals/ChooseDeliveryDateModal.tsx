import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { format, isSameDay } from "date-fns";
import { Calendar, Loader2, MapPin } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { AppDateInput } from "~/components/core/form";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import {
  buildRouteInfo,
  formatDateStr,
  getUpcomingDates,
  type ChooseDeliveryConfirmPayload,
} from "../helper";

interface ChooseDeliveryDateModalProps {
  show: boolean;
  customerId: string;
  onClose: () => void;
  onConfirm: (payload: ChooseDeliveryConfirmPayload) => void;
}

interface FormValues {
  deliveryDate: Date | undefined;
}

const ChooseDeliveryDateModal: React.FC<ChooseDeliveryDateModalProps> = ({
  show,
  customerId,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [hasRoutes, setHasRoutes] = useState<boolean | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { deliveryDate: undefined },
  });

  const upcomingDates = useMemo(() => {
    if (!routeData?.deliveryDays?.length) return [];
    return getUpcomingDates(routeData.deliveryDays);
  }, [routeData]);

  const loadRoute = useCallback(async () => {
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
  }, [customerId]);

  useEffect(() => {
    if (show) {
      setSelectedDate(null);
      setRouteData(null);
      setHasRoutes(null);
      reset({ deliveryDate: undefined });
      loadRoute();
    }
  }, [show, loadRoute, reset]);

  const handleConfirm = () => {
    if (selectedDate && routeData) {
      onConfirm({
        deliveryDate: formatDateStr(selectedDate),
        routeInfo: buildRouteInfo(routeData, selectedDate),
      });
    }
  };

  const onManualSubmit = (data: FormValues) => {
    if (!data.deliveryDate) return;
    onConfirm({ deliveryDate: formatDateStr(data.deliveryDate) });
  };

  return (
    <AppModal show={show} callback={onClose}>
      <AppModal.Title onClose={onClose} noShadow>
        <div className="tw:flex tw:items-center tw:gap-2">
          <Calendar className="tw:w-5 tw:h-5 tw:text-indigo-500" />
          <span className="tw:text-base tw:font-semibold tw:text-gray-900">
            Choose Delivery Date
          </span>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:py-4">
        {loading && (
          <div className="tw:flex tw:flex-col tw:justify-center tw:items-center tw:h-28">
            <Loader2 className="tw:w-6 tw:h-6 tw:text-blue-600 tw:animate-spin tw:mb-2" />
            <p className="tw:text-sm tw:text-slate-500">Loading...</p>
          </div>
        )}

        {/* Route found - show route name + date grid */}
        {!loading && hasRoutes && routeData && (
          <div className="tw:space-y-4">
            {/* Route name */}
            <div className="tw:flex tw:items-center tw:gap-2 tw:bg-slate-50 tw:border tw:border-slate-200 tw:rounded-lg tw:px-3 tw:py-2">
              <MapPin className="tw:w-4 tw:h-4 tw:text-slate-500 tw:shrink-0" />
              <div className="tw:min-w-0">
                <p className="tw:text-[11px] tw:text-slate-500">
                  Delivery Route
                </p>
                <p className="tw:text-sm tw:font-semibold tw:text-slate-800 tw:truncate">
                  {routeData.description ||
                    routeData.routeCode ||
                    "Not specified"}
                </p>
              </div>
            </div>

            {/* Date grid */}
            {upcomingDates.length > 0 ? (
              <div>
                <p className="tw:text-xs tw:font-medium tw:text-slate-600 tw:mb-2">
                  Select a delivery date
                </p>
                <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:gap-2">
                  {upcomingDates.map((date) => {
                    const isSelected =
                      selectedDate && isSameDay(selectedDate, date);
                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={`tw:rounded-lg tw:border tw:p-2.5 tw:text-center tw:transition-all tw:cursor-pointer ${
                          isSelected
                            ? "tw:border-indigo-500 tw:bg-indigo-50 tw:ring-1 tw:ring-indigo-500"
                            : "tw:border-slate-200 tw:bg-white hover:tw:border-slate-300 hover:tw:bg-slate-50"
                        }`}
                      >
                        <p
                          className={`tw:text-xs tw:font-medium ${isSelected ? "tw:text-indigo-600" : "tw:text-slate-500"}`}
                        >
                          {format(date, "EEE")}
                        </p>
                        <p
                          className={`tw:text-sm tw:font-bold ${isSelected ? "tw:text-indigo-700" : "tw:text-slate-800"}`}
                        >
                          {format(date, "dd MMM")}
                        </p>
                        <p
                          className={`tw:text-[10px] ${isSelected ? "tw:text-indigo-500" : "tw:text-slate-400"}`}
                        >
                          {format(date, "yyyy")}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="tw:text-sm tw:text-slate-500 tw:text-center tw:py-4">
                No delivery days configured for this route.
              </p>
            )}
          </div>
        )}

        {/* No routes - manual date picker */}
        {!loading && hasRoutes === false && (
          <div className="tw:space-y-4">
            <p className="tw:text-xs tw:text-amber-700 tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-lg tw:px-3 tw:py-2">
              No delivery route assigned for this customer. Please select a date
              manually.
            </p>

            <Controller
              name="deliveryDate"
              control={control}
              rules={{ required: "Delivery date is required" }}
              render={({ field, fieldState }) => (
                <AppDateInput
                  label="Delivery Date"
                  isRequired
                  value={field.value}
                  callback={(dt) => {
                    const date = Array.isArray(dt) ? dt[0] : dt;
                    field.onChange(date);
                  }}
                  error={fieldState.error?.message}
                  dateConfig={{
                    mode: "single",
                    disabled: { before: new Date() },
                  }}
                />
              )}
            />
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer className="tw:flex tw:gap-3 tw:p-4 tw:bg-gray-50/50">
        <AppButton
          fill="outline"
          onClick={onClose}
          className="tw:flex-1 tw:border-gray-200"
        >
          Cancel
        </AppButton>
        {hasRoutes ? (
          <AppButton
            color="primary"
            onClick={handleConfirm}
            disabled={!selectedDate}
            className="tw:flex-[1.5]"
          >
            Confirm
          </AppButton>
        ) : (
          <AppButton
            color="primary"
            onClick={handleSubmit(onManualSubmit)}
            className="tw:flex-[1.5]"
          >
            Confirm
          </AppButton>
        )}
      </AppModal.Footer>
    </AppModal>
  );
};

export default ChooseDeliveryDateModal;
