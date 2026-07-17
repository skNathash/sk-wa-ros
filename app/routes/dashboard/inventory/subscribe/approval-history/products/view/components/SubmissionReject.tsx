import React, { useState } from "react";
import { X, Package, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import KeyValue from "~/components/core/key-value/KeyValue";

interface SubmissionRejectProps {
  requested: {
    productName: string;
    brandName: string;
    categoryName: string;
    mrp: number;
    price: number;
    unitType: string;
    barcode: string;
    description: string;
  };
  remarks: string;
}

const SubmissionReject: React.FC<SubmissionRejectProps> = ({
  requested,
  remarks,
}) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="tw:mb-6">
      {/* Rejection Alert */}
      <div className="tw:border tw:border-red-200 tw:rounded-lg tw:py-2 tw:px-4 tw:mb-4">
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex-shrink-0">
            <div className="tw:w-6 tw:h-6 tw:rounded-full tw:flex tw:items-center tw:justify-center">
              <XCircle size={16} className="tw:text-red-500" />
            </div>
          </div>
          <div className="tw:text-red-500 tw:text-sm">
            Rejected Remarks: &quot;{remarks}&quot;
          </div>
        </div>
      </div>

      {/* Rejected Submission Details */}
      <div className="tw:bg-red-50 tw:border tw:border-red-200 tw:rounded-lg tw:p-4">
        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
          <Package size={16} className="tw:text-red-600" />
          <h3 className="tw:text-lg tw:font-semibold tw:text-red-800">
            Rejected Submission
          </h3>
        </div>

        <div className="tw:space-y-3">
          {/* Product Name */}
          <div className="tw:text-sm tw:text-red-700 tw:font-medium">
            {requested.productName}
          </div>

          {/* Product Details */}
          <div className="tw:text-xs tw:text-red-600">
            {/* Basic info - always shown */}
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
              <KeyValue label="Brand" size="xs" className="tw:mb-1">
                <span className="tw:text-red-600">
                  {requested.brandName || "--"}
                </span>
              </KeyValue>

              <KeyValue label="Category" size="xs" className="tw:mb-1">
                <span className="tw:text-red-600">
                  {requested.categoryName || "--"}
                </span>
              </KeyValue>

              <KeyValue label="Unit Type" size="xs" className="tw:mb-1">
                <span className="tw:text-red-600">
                  {requested.unitType || "--"}
                </span>
              </KeyValue>
            </div>

            {/* Additional info - shown when showMore is true */}
            {showMore && (
              <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3 tw:mt-3">
                <KeyValue label="MRP" size="xs" className="tw:mb-1">
                  <span className="tw:text-red-600">
                    ₹{requested.mrp || "--"}
                  </span>
                </KeyValue>

                <KeyValue label="Price" size="xs" className="tw:mb-1">
                  <span className="tw:text-red-600">
                    ₹{requested.price || "--"}
                  </span>
                </KeyValue>

                <KeyValue label="Barcode" size="xs" className="tw:mb-1">
                  <span className="tw:text-red-600 tw:font-mono">
                    {requested.barcode || "--"}
                  </span>
                </KeyValue>

                <div className="tw:col-span-1 tw:md:col-span-3">
                  <KeyValue label="Description" size="xs">
                    <span className="tw:text-red-600 tw:line-clamp-2">
                      {requested.description || "--"}
                    </span>
                  </KeyValue>
                </div>
              </div>
            )}

            {/* View More/Less Button */}
            <button
              onClick={() => setShowMore(!showMore)}
              className="tw:mt-3 tw:flex tw:items-center tw:justify-end tw:gap-1 tw:text-xs tw:text-red-600 tw:hover:text-red-700 tw:transition-colors tw:w-full"
            >
              {showMore ? (
                <>
                  <ChevronUp size={12} />
                  View Less
                </>
              ) : (
                <>
                  <ChevronDown size={12} />
                  View More
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionReject;
