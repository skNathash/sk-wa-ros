import React, { useState } from "react";
import { Package, Link, ChevronDown, ChevronUp } from "lucide-react";
import KeyValue from "~/components/core/key-value/KeyValue";

interface LinkedDealDiffProps {
  requested: {
    productName: string;
    brandName: string;
    categoryName: string;
    mrp: number;
    price: number;
    unitType: string;
    barcode: string;
    hsn?: string;
    gst?: number;
    description: string;
  };
  dealName: string;
  dealRefId: string;
}

const LinkedDealDiff: React.FC<LinkedDealDiffProps> = ({
  requested,
  dealName,
  dealRefId,
}) => {
  const [showMore, setShowMore] = useState(false);
  return (
    <div className="tw:mb-6">
      <h3 className="tw:text-lg tw:font-semibold tw:text-gray-900 tw:mb-4">
        Linking Information
      </h3>

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        {/* Original Submission Card */}
        <div className="tw:bg-red-50 tw:border tw:border-red-200 tw:rounded-lg tw:p-4">
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
            <Package size={16} className="tw:text-red-600" />
            <h4 className="tw:text-sm tw:font-semibold tw:text-red-800">
              Original Submission
            </h4>
          </div>

          <div className="tw:space-y-2">
            <div className="tw:text-sm tw:text-red-700 tw:font-medium">
              {requested.productName}
            </div>

            <div className="tw:text-xs tw:text-red-600">
              {/* Basic info - always shown */}
              <div className="tw:space-y-1 tw:grid tw:grid-cols-2 tw:gap-2">
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
              </div>

              {/* Additional info - shown when showMore is true */}
              {showMore && (
                <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:mt-2">
                  <div className="tw:space-y-1">
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
                  </div>

                  <div className="tw:space-y-1">
                    <KeyValue label="Unit Type" size="xs" className="tw:mb-1">
                      <span className="tw:text-red-600">
                        {requested.unitType || "--"}
                      </span>
                    </KeyValue>

                    <KeyValue label="Barcode" size="xs" className="tw:mb-1">
                      <span className="tw:text-red-600">
                        {requested.barcode || "--"}
                      </span>
                    </KeyValue>
                  </div>

                  <div className="tw:space-y-1">
                    <KeyValue label="HSN" size="xs" className="tw:mb-1">
                      <span className="tw:text-red-600">
                        {requested.hsn || "--"}
                      </span>
                    </KeyValue>

                    <KeyValue label="GST %" size="xs" className="tw:mb-1">
                      <span className="tw:text-red-600">
                        {typeof requested.gst === "number"
                          ? `${requested.gst}%`
                          : requested.gst || "--"}
                      </span>
                    </KeyValue>
                  </div>

                  <div className="tw:col-span-2">
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
                className="tw:mt-2 tw:flex tw:items-center tw:justify-end tw:gap-1 tw:text-xs tw:text-red-600 tw:hover:text-red-700 tw:transition-colors tw:w-full"
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

        {/* Linked to Existing Product Card */}
        <div className="tw:bg-green-50 tw:border tw:border-green-200 tw:rounded-lg tw:p-4">
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
            <Link size={16} className="tw:text-green-600" />
            <h4 className="tw:text-sm tw:font-semibold tw:text-green-800">
              Linked to Existing Product
            </h4>
          </div>

          <div className="tw:space-y-2">
            <div className="tw:text-sm tw:text-green-700 tw:font-medium">
              {dealName || "--"}
            </div>

            <div className="tw:text-xs tw:text-green-600">
              <KeyValue label="ID" size="xs">
                <span className="tw:text-green-600 tw:font-mono">
                  {dealRefId || "--"}
                </span>
              </KeyValue>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedDealDiff;
