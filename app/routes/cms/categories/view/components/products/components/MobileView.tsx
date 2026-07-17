import { Eye, Package } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import AppPopover from "~/components/core/popover/AppPopover";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import DealSummaryPopover from "~/components/feature/inventory/popover/deal-sales-summary/DealSummaryPopover";

const MobileView = ({ data, loading }: { data: any[]; loading: boolean }) => {
  return (
    <AppScrollArea className="tw:max-h-96">
      <div className="tw:max-h-96">
        {loading ? (
          <div className="tw:text-center tw:py-4">
            <AppSpinner />
          </div>
        ) : data.length === 0 ? (
          <div className="tw:text-center tw:py-4">No data found</div>
        ) : (
          <div className="tw:py-4">
            {data.map((item) => (
              <div
                key={item._id}
                className="tw:bg-white tw:p-4 tw:rounded-lg tw:border tw:border-gray-200 tw:mb-4"
              >
                {/* Product Header Section */}
                <div className="tw:flex tw:items-start tw:mb-4">
                  {/* Product Image */}
                  <div className="tw:w-16 tw:h-16 tw:bg-gray-100 tw:rounded tw:flex tw:items-center tw:justify-center tw:mr-4 tw:overflow-hidden tw:flex-shrink-0">
                    {item.images && item.images.length > 0 ? (
                      <ImgRender
                        assetId={item.images[0]}
                        className="tw:w-full tw:h-full tw:object-cover tw:rounded"
                        alt={item.name}
                      />
                    ) : (
                      <Package className="tw:w-8 tw:h-8 tw:text-gray-400" />
                    )}
                  </div>

                  {/* Product Text Details */}
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:text-sm tw:text-gray-600 tw:mb-1">
                      {item.id}
                    </div>
                    <div className="tw:font-semibold tw:text-base tw:text-gray-900 tw:mb-1 tw:line-clamp-2">
                      <AppLink
                        asLink
                        href={`/dashboard/inventory/products/view/${item._id}`}
                        className="tw:text-blue-600 hover:tw:text-blue-800 tw:text-sm tw:font-medium"
                      >
                        {item.name}
                      </AppLink>
                    </div>
                    <div className="tw:text-sm tw:text-gray-600">
                      <AppLink
                        asLink
                        href={`/cms/brands/view/${item.brand.id}`}
                      >
                        {item.brand?.name || "--"}
                      </AppLink>
                    </div>
                  </div>
                </div>

                {/* Product Attributes Section */}
                <div className="tw:space-y-3 tw:mb-4">
                  {/* Stock */}
                  <div className="tw:flex tw:justify-between tw:items-center">
                    <span className="tw:text-sm tw:text-gray-700">Stock</span>
                    <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                      {item.stock}
                    </span>
                  </div>

                  {/* Movement Type */}
                  <div className="tw:flex tw:justify-between tw:items-center">
                    <span className="tw:text-sm tw:text-gray-700">
                      Movement
                    </span>
                    <AppBadge
                      variant={item._movementTypeColor || "light"}
                      className="tw:text-xs"
                    >
                      {item.movementType || "--"}
                    </AppBadge>
                  </div>

                  {/* Activity / Sales */}
                  <div className="tw:flex tw:justify-between tw:items-center">
                    <span className="tw:text-sm tw:text-gray-700">Sales</span>

                    <div className="tw:flex tw:flex-col tw:text-sm tw:text-right">
                      <div className="tw:flex tw:gap-1 tw:items-center">
                        {item.salesAnalytics?.last7Days?.quantity || 0} units
                        <AppPopover
                          triggerContent={
                            <button className="tw:cursor-pointer">
                              <Eye size={14} />
                            </button>
                          }
                          side="right"
                          align="center"
                        >
                          <DealSummaryPopover
                            salesAnalytics={item.salesAnalytics}
                          />
                        </AppPopover>
                      </div>
                      <div className="tw:text-xs tw:text-gray-600">
                        Last 7d sales
                      </div>
                    </div>
                  </div>

                  {/* B2C Price */}
                  <div className="tw:flex tw:justify-between tw:items-center">
                    <span className="tw:text-sm tw:text-gray-700">
                      B2C Price
                    </span>
                    <span className="tw:text-sm tw:text-gray-900">
                      <Amount value={item.b2cPrice || 0} />
                    </span>
                  </div>

                  {/* B2B Price */}
                  <div className="tw:flex tw:justify-between tw:items-center">
                    <span className="tw:text-sm tw:text-gray-700">
                      B2B Price
                    </span>
                    <span className="tw:text-sm tw:text-gray-900">
                      <Amount value={item.b2bPrice || 0} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppScrollArea>
  );
};

export default MobileView;
