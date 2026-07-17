import { useEffect, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { AppSelect } from "~/components/core/form";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";
import { RACK_BIN_LOCATION_NON_SELLABLE } from "~/constants";
import { useTranslation } from "react-i18next";

const DestinationLocation = () => {
  const { t } = useTranslation(["common"]);
  const { control, setValue, watch, getValues } = useFormContext();

  // Store rack/bin config response
  const rackBinConfigRef = useRef<any>(null);

  // For options
  const [rackOptions, setRackOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [binOptions, setBinOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  // Location options state
  const [locationOptions, setLocationOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  // Loading states
  const [loading, setLoading] = useState({
    locations: false,
    racks: false,
  });

  // Get fid from AuthService
  useEffect(() => {
    const initializeData = async () => {
      const fid = AuthService.getLoggedInUserId() || "";
      if (!fid) {
        console.error("No franchise ID found");
        return;
      }

      try {
        // Fetch location options first
        setLoading((prev) => ({ ...prev, locations: true }));
        const locations = await RackBinService.getLocations();

        // Filter for non-sellable location only
        const nonSellable = locations.filter(
          (loc: any) => loc._id === RACK_BIN_LOCATION_NON_SELLABLE
        );

        if (nonSellable.length === 0) {
          setLocationOptions([]);
        } else {
          setLocationOptions(
            nonSellable.map((loc: any) => ({ value: loc._id, label: loc.name }))
          );

          // Auto-select the first non-sellable location if only one exists
          if (nonSellable.length === 1) {
            setValue("location", nonSellable[0]._id);
          }
        }
        setLoading((prev) => ({ ...prev, locations: false }));

        // Fetch rack/bin configuration for non-sellable location
        setLoading((prev) => ({ ...prev, racks: true }));
        const resp = await RackBinService.getRackBinConfig(
          fid,
          RACK_BIN_LOCATION_NON_SELLABLE,
          {}
        );

        rackBinConfigRef.current = resp?.data?.data || {};
        const racks = resp?.data?.data?.racks || [];

        if (racks.length === 0) {
          console.warn("No racks configured for non-sellable location");
          setRackOptions([]);
        } else {
          setRackOptions(
            racks.map((r: any) => ({ value: r.rackId, label: r.rackName }))
          );
        }
        setLoading((prev) => ({ ...prev, racks: false }));
      } catch (error) {
        console.error("Error loading non-sellable location data:", error);
        setLocationOptions([]);
        setRackOptions([]);
        setLoading({ locations: false, racks: false });
      }
    };

    initializeData();
  }, [setValue]);

  // Handler for rack change
  const handleRackChange = (val: string, fieldOnChange: any) => {
    fieldOnChange(val);

    // Find the full rack object
    let rackObj = undefined;
    if (rackBinConfigRef.current) {
      const racks = rackBinConfigRef.current.racks || [];
      rackObj = racks.find((r: any) => r.rackId === val);
    }

    setValue("selectedRack", rackObj); // Set selectedRack as object

    // Reset bin when rack changes
    setValue("bin", undefined);
    setValue("selectedBin", undefined); // Reset selectedBin as well

    // Update bin options
    if (rackObj && Array.isArray(rackObj.bins)) {
      const bins = rackObj.bins.map((b: any) => ({
        value: b.binId,
        label: b.binCode,
      }));
      setBinOptions(bins);
    } else {
      setBinOptions([]);
    }
  };

  // Handler for bin change
  const handleBinChange = (val: string, fieldOnChange: any) => {
    fieldOnChange(val);

    // Find the full bin object
    let binObj = undefined;
    if (rackBinConfigRef.current) {
      const racks = rackBinConfigRef.current.racks || [];
      const selectedRackId = getValues("rack");
      const selectedRack = racks.find((r: any) => r.rackId === selectedRackId);
      if (selectedRack && Array.isArray(selectedRack.bins)) {
        binObj = selectedRack.bins.find((b: any) => b.binId === val);
      }
    }
    setValue("selectedBin", binObj);
  };

  return (
    <div className="tw:grid tw:grid-cols-3 tw:gap-4 tw:mb-4">
      {/* Only non-sellable location (L2) selectable */}
      <Controller
        control={control}
        name="location"
        render={({ field }) => (
          <AppSelect
            options={locationOptions}
            className="tw:w-full"
            inputClassName="tw:w-full"
            label={t("location")}
            onChange={field.onChange}
            value={field.value}
            disabled={locationOptions.length === 1 || loading.locations}
            isRequired={true}
            placeholder={loading.locations ? t("loading") : t("selectLocation")}
          />
        )}
      />

      <Controller
        control={control}
        name="rack"
        render={({ field }) => (
          <AppSelect
            options={rackOptions}
            className="tw:w-full"
            inputClassName="tw:w-full"
            label={t("rack")}
            onChange={(val: string) => handleRackChange(val, field.onChange)}
            value={field.value}
            disabled={rackOptions.length === 0 || loading.racks}
            isRequired={true}
            placeholder={
              loading.racks
                ? t("loading")
                : rackOptions.length === 0
                ? t("noRacksAvailable")
                : t("selectRack")
            }
          />
        )}
      />

      <Controller
        control={control}
        name="bin"
        render={({ field }) => (
          <AppSelect
            options={binOptions}
            className="tw:w-full"
            inputClassName="tw:w-full"
            label={t("bin")}
            onChange={(val: string) => handleBinChange(val, field.onChange)}
            value={field.value}
            disabled={binOptions.length === 0 || !getValues("rack")}
            isRequired={true}
            placeholder={
              binOptions.length === 0 ? t("noBinsAvailable") : t("selectBin")
            }
          />
        )}
      />
    </div>
  );
};

export default DestinationLocation;
