import { Calendar, MapPin, Plus, Save, Trash2, Truck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";

type Props = {
  show: boolean;
  callback: (a: { action: "submit" | "close"; data?: any }) => void;
  data?: any;
  editId?: string;
};

type FormData = {
  routeName: string;
  areas: { name: string }[];
  days: string[];
};

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const RouteManageModal = ({ show, callback, data, editId }: Props) => {
  const { register, control, getValues, reset, setValue, watch } =
    useForm<FormData>({
      defaultValues: {
        routeName: "",
        areas: [{ name: "" }],
        days: [],
      },
    });

  const appToast = useAppToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "areas",
  });

  const selectedDays = watch("days") || [];

  useEffect(() => {
    const fetchAndPopulate = async (id: string) => {
      try {
        setIsFetching(true);
        const res = await DeliveryRoutesService.getRoutesList({
          filter: {
            _id: id,
          },
        });
        if (Array.isArray(res?.data?.data) && res.data.data.length > 0) {
          const d = res.data.data[0];
          reset({
            routeName: d.description || d.routeName || "",
            areas: d.areas?.map((a: string) => ({ name: a })) || [{ name: "" }],
            days: d.deliveryDays || d.days || [],
          });
        } else {
          appToast.show({
            msg: "Failed to load route details",
            color: "danger",
          });
        }
      } catch (e: any) {
        appToast.show({
          msg: e?.message || "Failed to load route details",
          color: "danger",
        });
      } finally {
        setIsFetching(false);
      }
    };

    if (show) {
      if (editId) {
        void fetchAndPopulate(editId);
      } else if (data) {
        reset({
          routeName: data.routeName || "",
          areas: data.areas?.map((a: string) => ({ name: a })) || [
            { name: "" },
          ],
          days: data.days || [],
        });
      } else {
        reset({
          routeName: "",
          areas: [{ name: "" }],
          days: [],
        });
      }
    }
  }, [show, data, editId, reset]);

  const onClose = () => {
    callback({ action: "close" });
  };

  const validate = (formData: FormData) => {
    if (!formData) return { msg: "Invalid form data" };
    const name = (formData.routeName || "").trim();
    if (!name) return { msg: "Please enter a route name" };

    const areas = formData.areas || [];
    for (let i = 0; i < areas.length; i++) {
      if (!(areas[i].name || "").trim()) {
        return { msg: `Please enter a name for area ${i + 1}` };
      }
    }

    const days = formData.days || [];
    if (days.length === 0)
      return { msg: "Please select at least one delivery day" };

    return { msg: "" };
  };

  const onFormSubmit = async () => {
    const formData = getValues() as FormData;

    const validation = validate(formData);
    if (validation.msg) {
      appToast.show({ msg: validation.msg, color: "danger" });
      return;
    }
    const formattedData = {
      // Derive a routeCode from routeName when creating
      routeCode: (formData.routeName || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "-"),
      description: formData.routeName,
      deliveryDays: (formData.days || []).sort(
        (a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b),
      ),
      isActive: true,
      areas: formData.areas
        .map((a) => a.name)
        .filter((name) => name.trim() !== ""),
    };

    try {
      setIsSubmitting(true);
      let res;
      if (editId) {
        // Update existing route
        res = await DeliveryRoutesService.updateRoute(editId, formattedData);
      } else {
        // Create new route
        res = await DeliveryRoutesService.createRoute(formattedData);
      }

      if (
        res &&
        res.statusCode &&
        res.statusCode >= 200 &&
        res.statusCode < 300
      ) {
        appToast.show({
          msg: editId
            ? "Route updated successfully"
            : "Route created successfully",
          color: "success",
        });
        // Trigger parent callback only on success
        callback({ action: "submit", data: res.data || formattedData });
      } else {
        const msg =
          (res && (res as any).data && (res as any).data.message) ||
          "Something went wrong";
        appToast.show({ msg, color: "danger" });
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to save route",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDayToggle = (day: string) => {
    const currentDays = [...selectedDays];
    if (currentDays.includes(day)) {
      setValue(
        "days",
        currentDays.filter((d) => d !== day),
      );
    } else {
      setValue("days", [...currentDays, day]);
    }
  };

  return (
    <AppModal show={show} callback={onClose} className="tw:h-[90vh]">
      <AppModal.Title onClose={onClose} noShadow>
        <div className="tw:flex tw:items-center tw:gap-2 tw:font-semibold">
          <Truck size={20} className="tw:text-blue-600" />
          {editId || data
            ? "Edit Delivery / Beat Route"
            : "Create New Delivery / Beat Route"}
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-max-[90vh]" noPadding>
        <form className="tw:space-y-3 tw:p-4">
          {/* Route Name Section */}
          <AppCard noPadding>
            <div className="tw:flex tw:items-start tw:gap-2.5 tw:p-3">
              <div className="tw:mt-1 tw:text-blue-600">
                <MapPin size={18} />
              </div>
              <div className="tw:flex-1">
                <label className="tw:text-sm tw:font-semibold tw:text-gray-700 tw:mb-0.5 tw:block">
                  Route Name
                  <span className="tw:text-red-500 tw:ml-1">*</span>
                </label>
                <AppInput
                  name="routeName"
                  register={register}
                  isRequired
                  placeholder="e.g., North Zone Route"
                  className="tw:mt-0.5"
                  onChange={(e: any) =>
                    setValue(
                      "routeName",
                      (e?.target?.value || "").replace(/[^a-zA-Z0-9\s]/g, ""),
                    )
                  }
                />
                <p className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
                  Give a unique, descriptive name for this delivery route
                </p>
              </div>
            </div>
          </AppCard>

          {/* Areas Section */}
          <AppCard noPadding>
            <div className="tw:flex tw:items-start tw:gap-2.5 tw:p-3">
              <div className="tw:mt-1 tw:text-green-600">
                <MapPin size={18} />
              </div>
              <div className="tw:flex-1">
                <div className="tw:flex tw:justify-between tw:items-start tw:mb-2">
                  <div>
                    <label className="tw:text-sm tw:font-semibold tw:text-gray-700 tw:block">
                      Coverage Areas (Town/Pincode)
                      <span className="tw:text-red-500 tw:ml-1">*</span>
                    </label>
                    <p className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
                      Define all areas covered by this route
                    </p>
                  </div>
                  <AppButton
                    size="small"
                    onClick={() => append({ name: "" })}
                    type="button"
                    fill="outline"
                    className="tw:flex tw:items-center tw:gap-1"
                  >
                    <Plus size={16} /> Add
                  </AppButton>
                </div>
                <div className="tw:space-y-1.5">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="tw:flex tw:gap-2 tw:items-center"
                    >
                      <div className="tw:w-6 tw:h-6 tw:rounded-full tw:bg-green-100 tw:flex tw:items-center tw:justify-center tw:shrink-0">
                        <span className="tw:text-xs tw:font-medium tw:text-green-700">
                          {index + 1}
                        </span>
                      </div>
                      <AppInput
                        name={`areas.${index}.name`}
                        register={register}
                        placeholder={`Area ${index + 1} name`}
                        className="tw:flex-1"
                      />
                      {fields.length > 1 && (
                        <AppButton
                          size="small"
                          color="danger"
                          fill="clear"
                          onClick={() => remove(index)}
                          type="button"
                          className="tw:shrink-0"
                        >
                          <Trash2 size={16} />
                        </AppButton>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AppCard>

          {/* Delivery Days Section */}
          <AppCard noPadding>
            <div className="tw:flex tw:items-start tw:gap-2.5 tw:p-3">
              <div className="tw:mt-1 tw:text-purple-600">
                <Calendar size={18} />
              </div>
              <div className="tw:flex-1">
                <label className="tw:text-sm tw:font-semibold tw:text-gray-700 tw:mb-0.5 tw:block">
                  Delivery Days
                  <span className="tw:text-red-500 tw:ml-1">*</span>
                </label>
                <p className="tw:text-xs tw:text-gray-500 tw:mb-2">
                  Select the days when deliveries are available on this route
                </p>
                <div className="tw:grid tw:grid-cols-3 sm:tw:grid-cols-4 tw:gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <div
                        key={day}
                        className={`tw:flex tw:items-center tw:justify-center tw:px-2.5 tw:py-1.5 tw:border-2 tw:rounded-lg tw:cursor-pointer tw:transition-all ${
                          isSelected
                            ? "tw:border-purple-500 tw:bg-purple-50 tw:text-purple-700"
                            : "tw:border-gray-200 tw:bg-white hover:tw:border-gray-300 hover:tw:bg-gray-50"
                        }`}
                        onClick={() => handleDayToggle(day)}
                      >
                        <span className="tw:text-sm tw:font-medium tw:select-none">
                          {day.slice(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {selectedDays.length > 0 && (
                  <p className="tw:text-xs tw:text-purple-600 tw:mt-1.5 tw:font-medium">
                    {selectedDays.length} day
                    {selectedDays.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            </div>
          </AppCard>

          {/* Action Buttons */}
        </form>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton
            fill="outline"
            onClick={onClose}
            color="light"
            type="button"
            className="tw:flex tw:items-center tw:gap-1"
          >
            <X size={18} /> Cancel
          </AppButton>
          <AppButton
            color="dark"
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="tw:flex tw:items-center tw:gap-1"
            onClick={onFormSubmit}
          >
            <Save size={18} />{" "}
            {editId || data ? "Update Route" : "Create Route"}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default RouteManageModal;
