import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppSelect } from "~/components/core/form/AppSelect";
import CommonService from "~/services/CommonService";
import { Input } from "~/components/ui/input";
import InpLabel from "~/components/core/form/InpLabel";
import { debounce } from "lodash";

interface SdtLocationProps {
  state?: string;
  district?: string;
  town?: string;
  callback: ({ action, data }: { action: string; data: any }) => void;
  isStateRequired?: boolean;
  isDistrictRequired?: boolean;
  isTownRequired?: boolean;
}

const SdtLocation = ({
  state = "",
  district = "",
  town = "",
  callback,
  isStateRequired = false,
  isDistrictRequired = false,
  isTownRequired = false,
}: SdtLocationProps) => {
  const { t } = useTranslation(["common"]);

  // State for dropdown options
  const [statesOptions, setStatesOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [districtsOptions, setDistrictsOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  // State for loading
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // Load states on component mount
  useEffect(() => {
    loadStates();
  }, []);

  // Load districts when state changes
  useEffect(() => {
    if (state) {
      loadDistricts(state);
    } else {
      setDistrictsOptions([]);
    }
  }, [state]);

  // Load states from API
  const loadStates = async () => {
    try {
      setLoadingStates(true);
      const response = await CommonService.getStates();

      if (response?.statusCode === 200 && response?.data?.data) {
        const states = response.data.data.map((state: any) => ({
          value: state.name,
          label: state.name,
        }));
        setStatesOptions(states);
      } else {
        console.error("Failed to load states:", response?.data?.message);
      }
    } catch (error) {
      console.error("Error loading states:", error);
    } finally {
      setLoadingStates(false);
    }
  };

  // Load districts based on selected state
  const loadDistricts = async (stateId: string) => {
    try {
      setLoadingDistricts(true);
      setDistrictsOptions([]);

      const response = await CommonService.getDistricts(stateId);

      if (response?.statusCode === 200 && response?.data?.data) {
        const districts = response.data.data.map((district: any) => ({
          value: district.name,
          label: district.name,
        }));
        setDistrictsOptions(districts);

        // Districts are loaded, the parent component should handle district selection
      } else {
        console.error("Failed to load districts:", response?.data?.message);
      }
    } catch (error) {
      console.error("Error loading districts:", error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Handle state change
  const handleStateChange = (stateValue: string) => {
    callback({
      action: "state_change",
      data: { state: stateValue, district: "", town: "" },
    });
  };

  // Handle district change
  const handleDistrictChange = (districtValue: string) => {
    if (!districtsOptions?.length) {
      return;
    }

    callback({
      action: "district_change",
      data: { state: state, district: districtValue, town: "" },
    });
  };

  const onTownChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const townValue = event.target.value;
    handleTownChangeCb(townValue);
  };

  // Handle town change
  const handleTownChangeCb = (value: string) => {
    callback({
      action: "town_change",
      data: {
        state: state,
        district: district,
        town: value,
      },
    });
  };

  return (
    <>
      {/* State Select */}
      <AppSelect
        label={t("state")}
        options={statesOptions}
        placeholder={loadingStates ? t("loadingStates") : t("selectState")}
        onChange={handleStateChange}
        value={state || ""}
        disabled={loadingStates}
        isRequired={isStateRequired}
        inputClassName="tw:w-full"
      />

      {/* District Select */}
      <AppSelect
        label={t("district")}
        options={districtsOptions}
        placeholder={
          loadingDistricts ? t("loadingDistricts") : t("selectDistrict")
        }
        onChange={handleDistrictChange}
        value={district || ""}
        disabled={loadingDistricts || !state}
        isRequired={isDistrictRequired}
        inputClassName="tw:w-full"
      />

      {/* Town Input */}
      <div className="tw:w-full">
        <InpLabel isRequired={isTownRequired}>{t("town")}</InpLabel>
        <Input
          type="text"
          placeholder={t("enterTown")}
          onChange={onTownChange}
          value={town || ""}
          disabled={!district}
          className="tw:w-full tw:text-sm"
        />
      </div>
    </>
  );
};

export default SdtLocation;
