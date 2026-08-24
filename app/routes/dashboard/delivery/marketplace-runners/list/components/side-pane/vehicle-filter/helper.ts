import { Bike, Footprints, Globe, Motorbike, Truck } from "lucide-react";
import type { NearbyRunner } from "../helper";

/** One vehicle row; `value` is the `vehicleType` the API filters on. */
export interface VehicleOption {
  key: string;
  /** "" is the unrestricted row — every vehicle around the store. */
  value: string;
  label: string;
  /** Lucide icon the row prints in its leading bubble. */
  icon: typeof Globe;
}

/**
 * The vehicles the marketplace runs on. `value` is the `vehicleType` the
 * nearby API filters on; the empty one leaves the type unrestricted.
 */
export const VEHICLE_OPTIONS: VehicleOption[] = [
  { key: "all", value: "", label: "All", icon: Globe },
  { key: "foot", value: "foot", label: "Foot · <1km", icon: Footprints },
  { key: "bicycle", value: "bicycle", label: "Bicycle", icon: Bike },
  { key: "scooter", value: "scooter", label: "Scooter", icon: Motorbike },
  { key: "truck", value: "truck", label: "Truck / Bulk", icon: Truck },
];

/** How many nearby runners ride each vehicle; "" counts the whole set. */
export function getVehicleCounts(
  runners: NearbyRunner[],
  options: VehicleOption[],
): Record<string, number> {
  return options.reduce<Record<string, number>>((counts, option) => {
    counts[option.key] = option.value
      ? runners.filter((runner) => runner.vehicleType === option.value).length
      : runners.length;
    return counts;
  }, {});
}
