import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import ImgRender from "~/components/core/img/ImgRender";
// KeyValue is no longer used in this proposal. Will remove if confirmed it's not used elsewhere.
// import KeyValue from "~/components/core/key-value/KeyValue";

type Props = {
  subOrders: any[];
};

const SubOrderList = ({ subOrders }: Props) => {
  const { t } = useTranslation(["common"]);

  return (
    <div className="tw-divide-y tw-divide-gray-100">
      {subOrders.map((subOrder, index) => (
        <div
          key={index}
          className="tw:flex tw:items-center tw:gap-3 tw:py-2.5 tw:px-2 hover:tw:bg-gray-50 tw:transition-colors tw:duration-150"
        >
          {/* Image Section */}
          <div className="tw:w-10 tw:h-10 tw:flex-shrink-0">
            <div className="tw:w-full tw:h-full tw:rounded tw:border tw:border-gray-200 tw:overflow-hidden">
              <ImgRender
                assetId={subOrder.images[0]} // User confirmed this path
                className="tw:w-full tw:h-full tw:object-cover"
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="tw:flex-grow tw:min-w-0">
            {/* Top line: Name and Status */}
            <div className="tw:flex tw:justify-between tw:items-center tw:mb-0.5">
              <h3
                className="tw:!text-sm tw:!font-medium tw:!text-gray-800 tw:!truncate tw:!mr-2"
                title={subOrder.name}
              >
                {subOrder.name}
              </h3>
              <AppBadge
                size="sm"
                variant={subOrder.statusColor}
                className="tw:flex-shrink-0"
              >
                {subOrder.status}
              </AppBadge>
            </div>

            {/* Bottom line: Details */}
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-2.5 tw:gap-y-0.5 tw:text-xs tw:text-gray-600">
              <div className="tw:flex tw:items-center tw:gap-0.5">
                <span className="tw:text-gray-400">{t("id")}:</span>
                <span className="tw:font-medium tw:text-gray-700">
                  {subOrder.id}
                </span>
              </div>
              <span className="tw:text-gray-300">|</span>
              <div className="tw:flex tw:items-center tw:gap-0.5">
                <span className="tw:text-gray-400">{t("mrp")}:</span>
                <span className="tw:font-medium tw:text-gray-700">
                  {subOrder.mrp}
                </span>
              </div>
              <span className="tw:text-gray-300">|</span>
              <div className="tw:flex tw:items-center tw:gap-0.5">
                <span className="tw:text-gray-400">{t("price")}:</span>
                <span className="tw:font-medium tw:text-gray-700">
                  {subOrder.price}
                </span>
              </div>
              <span className="tw:text-gray-300">|</span>
              <div className="tw:flex tw:items-center tw:gap-0.5">
                <span className="tw:text-gray-400">{t("qty")}:</span>
                <span className="tw:font-medium tw:text-gray-700">
                  {subOrder.quantity}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubOrderList;
