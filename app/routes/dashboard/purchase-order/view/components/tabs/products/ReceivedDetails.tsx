import clsx from "clsx";
import { Eye, MapPin } from "lucide-react";
import React from "react";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import useScreenView from "~/hooks/useScreenView";

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

const ReceivedDetails: React.FC<ReceivedDetailsProps> = ({ item }) => {
  const { isMobile } = useScreenView();

  if (!item) return null;

  // Map item keys to a variation object for UI compatibility
  const variation = {
    _id: item.itemId,
    barcode: item.barcode, // or use another barcode field if available
    price: item.purchasePrice,
    manufactureDate: item.manufactureDate,
    expiresOn: item.expiry,
    receivedQuantity: item.receivedQuantity,
    location: item.location,
  };

  return (
    <div>
      <div className="tw:bg-green-50 tw:rounded-md tw:p-4">
        <span className="tw:font-semibold tw:text-green-800">
          Received Details
        </span>
        <div className="tw:flex tw:justify-between tw:mt-2">
          <div>
            <KeyValue label="Received" size="sm">
              <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-1 tw:md:items-end">
                <span className="tw:font-semibold tw:text-green-700">
                  {variation.receivedQuantity || 0} units
                </span>
                <span className="tw:text-slate-600 tw:text-xs tw:md:mb-0.5">
                  on{" "}
                  {item.receivedAt ? (
                    <DateFormat value={new Date(item.receivedAt)} />
                  ) : (
                    "--"
                  )}
                </span>
              </div>
            </KeyValue>
          </div>
          <div>
            <KeyValue label="Received By" size="sm">
              <span className="tw:font-semibold tw:text-green-700">
                {item.receivedBy?.userName ? (
                  <>
                    {item.receivedBy.userName}
                    {item.receivedBy.userType && (
                      <span className="tw:text-xs tw:text-gray-500 tw:ml-1">
                        ({item.receivedBy.userType})
                      </span>
                    )}
                  </>
                ) : (
                  "--"
                )}
              </span>
            </KeyValue>
          </div>
        </div>
      </div>
      {variation.location && (
        <div className="tw:bg-blue-50 tw:p-3">
          <div className="tw:flex tw:items-center tw:mb-2">
            <MapPin className="tw:w-4 tw:h-4 tw:mr-1 tw:text-blue-700" />
            <span className="tw:font-medium tw:text-blue-800 tw:text-sm">
              Warehouse Location
            </span>
          </div>
          <div className="tw:flex tw:justify-between tw:items-center">
            <span className="tw:bg-blue-100 tw:text-blue-900 tw:px-3 tw:py-1 tw:rounded-md tw:font-mono tw:text-base tw:font-semibold">
              {variation.location.name || "-"}
              {variation.location.rackName ? (
                <> - {variation.location.rackName}</>
              ) : null}
              {variation.location.binName ? (
                <> - {variation.location.binName}</>
              ) : null}
            </span>
            <AppLink
              asLink={true}
              href={
                variation.location?.binId
                  ? `/dashboard/inventory/rack-bin/bin/view/${
                      variation.location.binId
                    }${item.dealId ? `?dealId=${item.dealId}` : ""}`
                  : "#"
              }
            >
              <AppButton
                fill="outline"
                color="primary"
                size="small"
                type="button"
              >
                <Eye className="tw:w-4 tw:h-4" /> View Bin
              </AppButton>
            </AppLink>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivedDetails;
