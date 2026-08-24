import { useForm, Controller, useWatch } from "react-hook-form";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { orderBy } from "lodash";
import AppModal from "~/components/core/modal/AppModal";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import AppButton from "~/components/core/button/AppButton";
import CommonService from "~/services/CommonService";

interface FilterModalProps {
  show: boolean;
  callback: (data: { action: string; data: any }) => void;
  initialValues?: {
    state?: string;
    district?: string;
    town?: string;
  };
}

const FilterModal = ({
  show,
  callback,
  initialValues = {},
}: FilterModalProps) => {
  const { t } = useTranslation(["common"]);

  const { control, handleSubmit, reset, setValue, getValues } = useForm({});

  const [statesOption, setStatesOption] = useState<
    { value: string; label: string }[]
  >([]);
  const [districtsOption, setDistrictsOption] = useState<
    { value: string; label: string }[]
  >([]);
  const [townsOption, setTownsOption] = useState<
    { value: string; label: string }[]
  >([]);

  const [state, district] = useWatch({
    control,
    name: ["state", "district"],
  });

  useEffect(() => {
    if (show) {
      reset({
        state: initialValues.state || "",
        district: initialValues.district || "",
        town: initialValues.town || "",
      });
      loadStates();
    }
  }, [show, initialValues, reset]);

  // Load districts when state changes
  useEffect(() => {
    if (state && state !== "All") {
      loadDistricts(state);
    } else {
      setDistrictsOption([]);
      setTownsOption([]);
      setValue("district", "");
      setValue("town", "");
    }
  }, [state]);

  // Load towns when district changes
  useEffect(() => {
    if (district && district !== "All" && state && state !== "All") {
      loadTowns(state, district);
    } else {
      setTownsOption([]);
      setValue("town", "");
    }
  }, [district, state]);

  const loadStates = async () => {
    try {
      const response = await CommonService.getStates();
      const d = orderBy(
        response.data.data?.filter((state: any) => state.isLive),
        "name",
        "asc",
      ).map((state: any) => ({
        value: state.name,
        label: state.name,
      }));
      setStatesOption([{ value: "All", label: "All States" }, ...d]);
    } catch (error) {
      console.error("Error loading states:", error);
    }
  };

  const loadDistricts = async (stateName: string) => {
    try {
      const response = await CommonService.getDistricts(stateName);
      const d = orderBy(response.data.data, "name", "asc");
      setDistrictsOption([
        { value: "All", label: "All Districts" },
        ...d.map((district: any) => ({
          value: district.name,
          label: district.name,
        })),
      ]);
    } catch (error) {
      console.error("Error loading districts:", error);
    }
  };

  const loadTowns = async (stateName: string, districtName: string) => {
    try {
      const response = await CommonService.getSubdistricts(
        stateName,
        districtName,
      );
      const d = orderBy(response.data.data, "name", "asc");
      setTownsOption([
        { value: "All", label: "All Towns" },
        ...d.map((town: any) => ({
          value: town.name,
          label: town.name,
        })),
      ]);
    } catch (error) {
      console.error("Error loading towns:", error);
    }
  };

  const onSubmit = (data: any) => {
    callback({ action: "apply", data });
  };

  const handleReset = () => {
    reset({
      state: "",
      district: "",
      town: "",
    });
    callback({ action: "reset", data: null });
  };

  const onClose = () => {
    callback({ action: "close", data: null });
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={onClose}>
        <div className="tw:text-lg tw:font-medium">Filter</div>
      </AppModal.Title>

      <AppModal.Content>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="tw:grid tw:grid-cols-1 tw:gap-4">
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <AppSelect
                  label={t("state")}
                  options={statesOption}
                  placeholder={t("selectState")}
                  onChange={field.onChange}
                  value={field.value}
                  inputClassName="tw:w-full"
                  size="sm"
                />
              )}
            />

            <Controller
              name="district"
              control={control}
              render={({ field }) => (
                <AppSelect
                  label={t("district")}
                  options={districtsOption}
                  placeholder={t("selectDistrict")}
                  onChange={field.onChange}
                  value={field.value}
                  inputClassName="tw:w-full"
                  size="sm"
                  disabled={!state || state === "All"}
                />
              )}
            />

            <Controller
              name="town"
              control={control}
              render={({ field }) => (
                <AppSelect
                  label={t("town")}
                  options={townsOption}
                  placeholder={t("selectTown")}
                  onChange={field.onChange}
                  value={field.value}
                  inputClassName="tw:w-full"
                  size="sm"
                  disabled={!district || district === "All"}
                />
              )}
            />
          </div>
        </form>
      </AppModal.Content>

      <AppModal.Footer className="tw:justify-end">
        <div className="tw:flex tw:gap-3 tw:justify-end">
          <AppButton
            type="button"
            fill="outline"
            onClick={handleReset}
            className="px-4"
          >
            {t("reset")}
          </AppButton>
          <AppButton onClick={handleSubmit(onSubmit)} className="px-6">
            {t("apply")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
