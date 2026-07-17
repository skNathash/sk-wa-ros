import { Controller, useFormContext } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { AppSelect } from "~/components/core/form";
import RackBinService from "~/services/RackBinService";
import AuthService from "~/services/AuthService";

const DestinationLocation = ({
  defaultLocation,
  disableLocationInput,
}: {
  defaultLocation: string;
  disableLocationInput?: boolean;
}) => {
  const { control, setValue, watch, getValues } = useFormContext();

  const [locations, setLocations] = useState<any[]>([]);

  // Store rack/bin config response
  const rackBinConfigRef = useRef<any>(null);

  // For options
  const [rackOptions, setRackOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [binOptions, setBinOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  // Get fid from AuthService
  useEffect(() => {
    const fetchConfig = async () => {
      const fid = AuthService.getLoggedInUserId() || "";
      if (!fid) return;
      try {
        const locations = await RackBinService.getLocations();

        setLocations(
          locations.map((l: any) => ({ value: l._id, label: l.name }))
        );

        const firstLocation = locations.find(
          (l: any) => l._id === defaultLocation
        )?._id;

        // Set the default location in the form if found
        if (firstLocation) {
          setValue("location", firstLocation);
        }

        const resp = await RackBinService.getRackBinConfig(
          fid,
          firstLocation,
          {}
        );

        rackBinConfigRef.current = resp?.data?.data || {};
        const racks = resp?.data?.data?.racks || [];

        setRackOptions(
          racks.map((r: any) => ({ value: r.rackId, label: r.rackName }))
        );
      } catch (e) {
        setRackOptions([]);
      }
    };
    fetchConfig();
  }, [defaultLocation]);

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
        label: b.name,
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
    setValue("selectedBin", binObj); // Set selectedBin as object
  };

  const handleLocationChange = (chngeFn: any) => async (val: string) => {
    chngeFn(val);

    const resp = await RackBinService.getRackBinConfig(
      AuthService.getLoggedInUserId() || "",
      val,
      {}
    );

    rackBinConfigRef.current = resp?.data?.data || {};
    const racks = resp?.data?.data?.racks || [];
    setRackOptions(
      racks.map((r: any) => ({ value: r.rackId, label: r.rackName }))
    );

    setBinOptions([]);

    // Reset rack and bin
    setValue("rack", undefined);
    setValue("bin", undefined);
    setValue("selectedRack", undefined);
    setValue("selectedBin", undefined);
  };

  if (locations.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="tw:grid tw:grid-cols-3 tw:gap-4 tw:mb-4">
      {/* Location is fixed to L1 */}
      <Controller
        control={control}
        name="location"
        render={({ field }) => (
          <AppSelect
            options={locations}
            className="tw:w-full"
            inputClassName="tw:w-full"
            label="Location"
            onChange={handleLocationChange(field.onChange)}
            value={field.value}
            disabled={disableLocationInput}
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
            label="Rack"
            onChange={(val: string) => handleRackChange(val, field.onChange)}
            value={field.value}
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
            label="Bin"
            onChange={(val: string) => handleBinChange(val, field.onChange)}
            value={field.value}
          />
        )}
      />
    </div>
  );
};

export default DestinationLocation;
