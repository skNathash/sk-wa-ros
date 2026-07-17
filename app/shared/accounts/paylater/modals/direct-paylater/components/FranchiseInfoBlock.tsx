import React from "react";
import { Building2, MapPin, Phone, User } from "lucide-react";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import KeyValue from "~/components/core/key-value/KeyValue";

type Props = {
  franchise: Record<string, any> | null;
  loading?: boolean;
  error?: string;
};

const FranchiseInfoBlock: React.FC<Props> = ({ franchise, loading, error }) => {
  if (loading) {
    return (
      <div className="tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-lg tw:p-4">
        <div className="tw:animate-pulse tw:space-y-2">
          <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-1/3" />
          <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/2" />
          <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-2/3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <InfoBlock variant="danger" size="sm">
        <div className="tw:font-semibold tw:text-sm tw:mb-1">
          Franchise Not Found
        </div>
        <div className="tw:text-xs">{error}</div>
      </InfoBlock>
    );
  }

  if (!franchise) return null;

  const address = [
    franchise.city,
    franchise.town,
    franchise.district,
    franchise.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:p-4">
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
        <Building2 className="tw:text-blue-600" size={16} />
        <span className="tw:text-sm tw:font-semibold tw:text-blue-800">
          Franchise Details
        </span>
      </div>
      <div className="tw:grid tw:grid-cols-2 tw:gap-3">
        <KeyValue label="Franchise Name" size="sm">
          <div className="tw:flex tw:items-center tw:gap-1">
            <User size={12} className="tw:text-gray-400" />
            <span className="tw:font-semibold">{franchise.name || "-"}</span>
          </div>
        </KeyValue>

        <KeyValue label="Franchise ID" size="sm">
          <span className="tw:text-blue-600 tw:font-medium">
            {franchise.franchiseId || franchise.refNo || "-"}
          </span>
        </KeyValue>

        {franchise.mobile && (
          <KeyValue label="Mobile" size="sm">
            <div className="tw:flex tw:items-center tw:gap-1">
              <Phone size={12} className="tw:text-gray-400" />
              <span>{franchise.mobile}</span>
            </div>
          </KeyValue>
        )}

        {address && (
          <KeyValue label="Location" size="sm">
            <div className="tw:flex tw:items-center tw:gap-1">
              <MapPin size={12} className="tw:text-gray-400" />
              <span>{address}</span>
            </div>
          </KeyValue>
        )}
      </div>
    </div>
  );
};

export default FranchiseInfoBlock;
