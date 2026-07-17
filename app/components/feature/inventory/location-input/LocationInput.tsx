import React, { useEffect, useState } from "react";
import RackBinService from "~/services/RackBinService";
import AuthService from "~/services/AuthService";
import AppButton from "~/components/core/button/AppButton";
import { Sparkles } from "lucide-react";
import AppSelect from "~/components/core/form/AppSelect";
import useAppToast from "~/hooks/useAppToast";
import { RACK_BIN_LOCATION_SELLABLE } from "~/constants";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

interface LocationInputProps {
  locationId?: string;
  rackId?: string;
  binId?: string;
  dealId?: string;
  qty?: number;
  locationType?: "sellable" | "non-sellable";
  autoLoadRack?: boolean;
  callback: (data: {
    location: string;
    locationDetail: any;
    rack: string;
    rackDetails: any;
    bin: string;
    binDetails: any;
  }) => void;
  isRequired?: boolean;
  hideSuggestButton?: boolean;
  hideLocationDropdown?: boolean;
  layout?: "horizontal" | "vertical" | "auto";
}

const LocationInput: React.FC<LocationInputProps> = ({
  locationId,
  rackId,
  binId,
  dealId,
  qty,
  callback,
  locationType,
  isRequired,
  hideSuggestButton = false,
  hideLocationDropdown = false,
  autoLoadRack = false,
  layout = "auto",
}) => {
  const { t } = useTranslation(["common"]);
  // Auto allocate handler
  const { show: showToast } = useAppToast();
  const [locationOptions, setLocationOptions] = useState<any[]>([]);
  const [rackOptions, setRackOptions] = useState<any[]>([]);
  const [binOptions, setBinOptions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>(
    locationId || ""
  );
  const [selectedRack, setSelectedRack] = useState<string>(rackId || "");
  const [selectedBin, setSelectedBin] = useState<string>(binId || "");
  const [isLoadingRecommendedBins, setIsLoadingRecommendedBins] =
    useState(false);
  const [isLoadingRackBin, setIsLoadingRackBin] = useState(false);

  // useRef to hold initial config loaded
  const initialConfigRef = React.useRef<any>(null);

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      const resp = await RackBinService.getLocations();
      let l = Array.isArray(resp)
        ? resp.map((x: any) => ({ label: x.name, value: x._id }))
        : [];

      if (locationType === "sellable") {
        l = l.filter((x: any) => x.value === RACK_BIN_LOCATION_SELLABLE);
      } else if (locationType === "non-sellable") {
        l = l.filter((x: any) => x.value !== RACK_BIN_LOCATION_SELLABLE);
      }

      setLocationOptions(l);
    };
    fetchLocations();
  }, []);

  // Common function to fetch config and details
  const getLocationRackBinDetails = async (
    locationId: string,
    rackId: string,
    binId: string
  ) => {
    try {
      const configResp = await RackBinService.getRackBinConfig(
        AuthService.getLoggedInUserId() || "",
        locationId,
        {}
      );
      const racks = configResp.data?.data?.racks || [];
      const rackOptions = Array.isArray(racks)
        ? racks.map((x: any) => ({
            label: x.rackName,
            value: x.rackId,
            _raw: x,
          }))
        : [];
      const rackDetails = racks.find((r: any) => r.rackId === rackId);
      let binDetails = null;
      let binOptions: any[] = [];
      if (rackDetails && Array.isArray(rackDetails.bins)) {
        binOptions = rackDetails.bins.map((x: any) => ({
          label: x.binCode || x.name,
          value: x.binId,
          _raw: x,
        }));
        binDetails = rackDetails.bins.find((b: any) => b.binId === binId);
      }

      const locations = await RackBinService.getLocations();
      const locationDetail = locations.find((x: any) => x._id === locationId);

      return {
        locationId,
        rackId,
        binId,
        locationDetail,
        rackDetails,
        binDetails,
        rackOptions,
        binOptions,
      };
    } catch (err) {
      return {
        locationId,
        rackId,
        binId,
        locationDetail: null,
        rackDetails: null,
        binDetails: null,
        rackOptions: [],
        binOptions: [],
      };
    }
  };

  // Fetch rack config only once on mount if all 3 values exist
  useEffect(() => {
    if (locationId && rackId && binId && !initialConfigRef.current) {
      setIsLoadingRackBin(true);
      (async () => {
        try {
          const details = await getLocationRackBinDetails(
            locationId,
            rackId,
            binId
          );
          setSelectedLocation(locationId);
          setSelectedRack(rackId);
          setSelectedBin(binId);
          setRackOptions(details.rackOptions);
          setBinOptions(details.binOptions);
          callback({
            location: locationId,
            locationDetail: details.locationDetail,
            rack: rackId,
            rackDetails: details.rackDetails,
            bin: binId,
            binDetails: details.binDetails,
          });
          // mark as loaded only after success
          initialConfigRef.current = true;
        } catch (e) {
          // leave ref unset so a retry is possible
          console.error("Failed to load initial location/rack/bin details", e);
        } finally {
          setIsLoadingRackBin(false);
        }
      })();
    }
  }, [locationId, rackId, binId, locationOptions]);

  // If autoLoadRack is true, load rack options once on component mount when
  // there's a locationId. This should only run once and not on every prop change.
  useEffect(() => {
    // Only auto-load racks when autoLoadRack is enabled AND there is a
    // locationId but no explicit rackId/binId provided. This avoids a
    // race where the rack-only loader sets the shared ref and prevents
    // the full-details loader (which needs rackId+binId) from running.
    if (
      autoLoadRack &&
      locationId &&
      !rackId &&
      !binId &&
      !initialConfigRef.current
    ) {
      setIsLoadingRackBin(true);
      (async () => {
        try {
          const configResp = await RackBinService.getRackBinConfig(
            AuthService.getLoggedInUserId() || "",
            locationId,
            {}
          );
          const racks = configResp.data?.data?.racks || [];
          const racksOptions = Array.isArray(racks)
            ? racks.map((x: any) => ({
                label: x.rackName,
                value: x.rackId,
                _raw: x,
              }))
            : [];
          setRackOptions(racksOptions);
          // mark as loaded only after success
          initialConfigRef.current = true;
        } catch (err) {
          setRackOptions([]);
        } finally {
          setIsLoadingRackBin(false);
        }
      })();
    }
    // Intentionally only run when autoLoadRack or locationId or locationOptions change
  }, [autoLoadRack, locationId, locationOptions]);

  // Common callback trigger
  const triggerCallback = async (
    location: string,
    rack: string,
    bin: string
  ) => {
    const locations = await RackBinService.getLocations();
    const locationDetail = locations.find((x) => x._id === location);
    const rackDetails = rackOptions.find((x) => x.value === rack)?._raw || null;
    const binDetails = binOptions.find((x) => x.value === bin)?._raw || null;
    callback({
      location,
      locationDetail,
      rack,
      rackDetails,
      bin,
      binDetails,
    });
  };

  // Change handlers
  const handleLocationChange = async (value: string) => {
    setSelectedLocation(value);
    setSelectedRack("");
    setSelectedBin("");

    // Fetch rack config on location change
    try {
      const configResp = await RackBinService.getRackBinConfig(
        AuthService.getLoggedInUserId() || "",
        value,
        {}
      );
      const racks = configResp.data?.data?.racks || [];
      const racksOptions = Array.isArray(racks)
        ? racks.map((x: any) => ({
            label: x.rackName,
            value: x.rackId,
            _raw: x,
          }))
        : [];
      setRackOptions(racksOptions);
      setBinOptions([]);
    } catch (err) {
      setRackOptions([]);
      setBinOptions([]);
    }

    triggerCallback(value, "", "");
  };

  const handleRackChange = (value: string) => {
    setSelectedRack(value);
    setSelectedBin("");
    // Prepare bin options for the selected rack
    const rack = rackOptions.find((x) => x.value === value);
    if (rack && rack._raw && Array.isArray(rack._raw.bins)) {
      const binsOptions = rack._raw.bins.map((x: any) => ({
        label: x.binCode || x.name,
        value: x.binId,
        _raw: x,
      }));
      setBinOptions(binsOptions);
    } else {
      setBinOptions([]);
    }
    triggerCallback(selectedLocation, value, "");
  };

  const handleBinChange = (value: string) => {
    setSelectedBin(value);
    triggerCallback(selectedLocation, selectedRack, value);
  };

  const handleRecommendedBins = async () => {
    setIsLoadingRecommendedBins(true);
    try {
      const params: any = {
        franchiseId: AuthService.getLoggedInUserId() || "",
        quantity: qty || 1,
      };
      if (dealId) {
        params.dealId = dealId;
      }
      const result = await RackBinService.getRecommendedBins(params);
      const bins = Array.isArray(result?.data?.data) ? result?.data?.data : [];
      if (bins.length > 0) {
        const bin = bins[0];
        setSelectedLocation(bin.locationId);
        setSelectedRack(bin.rackId);
        setSelectedBin(bin.binId);
        const details = await getLocationRackBinDetails(
          bin.locationId,
          bin.rackId,
          bin.binId
        );
        setRackOptions(details.rackOptions);
        setBinOptions(details.binOptions);
        showToast({
          msg: "Recommended bin selected",
          color: "success",
        });
        callback({
          location: bin.locationId,
          locationDetail: details.locationDetail,
          rack: bin.rackId,
          rackDetails: details.rackDetails,
          bin: bin.binId,
          binDetails: details.binDetails,
        });
      } else {
        showToast({
          msg: "No recommended bins found",
          color: "warning",
        });
      }
    } catch (err) {
      showToast({ msg: "Failed to fetch recommended bins", color: "danger" });
    } finally {
      setIsLoadingRecommendedBins(false);
    }
  };

  return (
    <div
      className={clsx(
        "tw:grid tw:gap-3 tw:items-center",
        layout === "vertical" && "tw:grid-cols-1",
        layout === "horizontal" && "tw:grid-cols-3",
        layout === "auto" && "tw:grid-cols-1 tw:md:grid-cols-3"
      )}
    >
      {!hideLocationDropdown && (
        <AppSelect
          label={t("location")}
          options={locationOptions}
          value={selectedLocation}
          onChange={handleLocationChange}
          inputClassName="tw:bg-white tw:w-full"
          placeholder={t("selectLocation")}
          isRequired={isRequired}
        />
      )}
      <AppSelect
        label={t("rack")}
        options={rackOptions}
        value={selectedRack}
        onChange={handleRackChange}
        inputClassName="tw:bg-white tw:w-full"
        placeholder={isLoadingRackBin ? t("loadingRacks") : t("selectRack")}
        disabled={isLoadingRackBin}
        isRequired={isRequired}
      />
      <div className="tw:flex tw:gap-2 tw:w-full">
        <div className="tw:flex-1">
          <AppSelect
            label={t("bin")}
            options={binOptions}
            value={selectedBin}
            onChange={handleBinChange}
            inputClassName="tw:bg-white tw:w-full tw:flex-1"
            placeholder={isLoadingRackBin ? t("loadingBins") : t("selectBin")}
            disabled={isLoadingRackBin}
            isRequired={isRequired}
          />
        </div>
        {!hideSuggestButton && (
          <AppButton
            onClick={handleRecommendedBins}
            disabled={isLoadingRecommendedBins}
            isLoading={isLoadingRecommendedBins}
            size="default"
            fill="outline"
            color="light"
            className="tw:mt-6"
          >
            {!isLoadingRecommendedBins && <Sparkles size={20} />}
          </AppButton>
        )}
      </div>
    </div>
  );
};

export default LocationInput;
