import { Eye, LayoutGrid } from "lucide-react";
import React from "react";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";

interface WarehouseLocation {
  name?: string;
  rackId?: string;
  binId?: string;
  id?: string;
  rackName?: string;
  binName?: string;
}

interface Item {
  itemId?: string;
  dealId?: string;
  dealName?: string;
  quantity?: number;
  receivedQuantity?: number;
  invoiceQuantity?: number;
  damagedQuantity?: number;
  variationQuantity?: number;
  mrp?: number;
  purchasePrice?: number;
  tax?: number;
  cgst?: number;
  sgst?: number;
  status?: string;
  location?: WarehouseLocation;
  manufactureDate?: string;
  expiry?: string;
  barcode?: string;
  receivedBy?: {
    userName?: string;
    userType?: string;
    receivedOn?: string;
  };
  receivedAt?: string;
}

interface ReceivedDetailsProps {
  item: Item;
}

/** Join warehouse parts into the compact "SELLABLE • H • B57" chip label. */
const locationLabel = (location?: WarehouseLocation) => {
  if (!location) return "-";
  return [location.name, location.rackName, location.binName]
    .filter(Boolean)
    .join(" • ");
};

const ReceivedDetails: React.FC<ReceivedDetailsProps> = ({ item }) => {
  if (!item) return null;

  const receivedQty = item.receivedQuantity || 0;
  const location = item.location;

  return (
    <div>
      <div className="tw:bg-emerald-50 tw:px-3 tw:py-2.5 tw:md:px-4">
        <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-start tw:sm:justify-between tw:gap-2">
          <div className="tw:min-w-0">
            <p className="tw:text-xs tw:font-semibold tw:text-emerald-800">
              Received Details
            </p>
            <p className="tw:mt-0.5 tw:text-xs tw:text-emerald-900/80">
              <span className="tw:font-semibold tw:text-emerald-800">
                {receivedQty} units
              </span>
              <span className="tw:text-slate-600">
                {" "}
                on{" "}
                {item.receivedAt ? (
                  <DateFormat
                    value={new Date(item.receivedAt)}
                    formatStr="dd MMM yyyy, hh:mm a"
                  />
                ) : (
                  "--"
                )}
              </span>
            </p>
          </div>

          <div className="tw:sm:text-right tw:shrink-0">
            <p className="tw:text-[11px] tw:text-slate-500">Received By</p>
            <p className="tw:mt-0.5 tw:text-xs tw:font-semibold tw:text-emerald-800">
              {item.receivedBy?.userName ? (
                <>
                  {item.receivedBy.userName}
                  {item.receivedBy.userType && (
                    <span className="tw:text-[11px] tw:font-normal tw:text-slate-500 tw:ml-1">
                      ({item.receivedBy.userType})
                    </span>
                  )}
                </>
              ) : (
                "--"
              )}
            </p>
          </div>
        </div>
      </div>

      {location && (
        <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:sm:justify-between tw:gap-2 tw:bg-sky-50 tw:px-3 tw:py-2 tw:md:px-4">
          <div className="tw:flex tw:min-w-0 tw:flex-wrap tw:items-center tw:gap-1.5">
            <LayoutGrid className="tw:h-3.5 tw:w-3.5 tw:shrink-0 tw:text-sky-700" />
            <span className="tw:text-xs tw:font-medium tw:text-sky-900">
              Warehouse Location:
            </span>
            <span className="tw:inline-flex tw:items-center tw:rounded-md tw:bg-sky-100 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-sky-900">
              {locationLabel(location)}
            </span>
          </div>

          <AppLink
            asLink={true}
            href={
              location?.binId
                ? `/dashboard/inventory/rack-bin/bin/view/${location.binId}${
                    item.dealId ? `?dealId=${item.dealId}` : ""
                  }`
                : "#"
            }
            className="tw:shrink-0"
          >
            <AppButton
              fill="outline"
              color="light"
              size="small"
              type="button"
              className="tw:bg-white!"
            >
              <Eye className="tw:h-4 tw:w-4" /> View Bin
            </AppButton>
          </AppLink>
        </div>
      )}
    </div>
  );
};

export default ReceivedDetails;
