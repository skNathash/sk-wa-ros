import { Eye, Package, Mail } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import DealLinked from "../../../components/DealLinked";
import ProductDetails, { type ProductInfo } from "./ProductDetails";

interface DataRow {
  originalProduct: ProductInfo;
  finalProduct: ProductInfo;
  actionTaken: string;
  status: string;
  adminNotes: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
  updatedByName?: string;
  statusColor?: string;
  statusLabel?: string;
  isLinkedExisting?: boolean;
  isLinkedNew?: boolean;
  isSubscribed?: boolean;
}

interface MobileViewProps {
  data: DataRow[];
  callback?: (a: { action: string; data: Record<string, any> }) => void;
  loading?: boolean;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  callback,
  loading = false,
}) => {
  const { t } = useTranslation(["common"]);

  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="tw:bg-white tw:p-4 tw:rounded-lg tw:border tw:border-gray-200"
          >
            <div className="tw:animate-pulse">
              <div className="tw:flex tw:items-start tw:mb-4">
                <div className="tw:w-16 tw:h-16 tw:bg-gray-200 tw:rounded tw:mr-4"></div>
                <div className="tw:flex-1">
                  <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:mb-2"></div>
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:mb-2"></div>
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/2"></div>
                </div>
              </div>
              <div className="tw:space-y-3">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div
                    key={j}
                    className="tw:flex tw:justify-between tw:items-center"
                  >
                    <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/4"></div>
                    <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/3"></div>
                  </div>
                ))}
              </div>
              <div className="tw:mt-4 tw:h-8 tw:bg-gray-200 tw:rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((item) => {
        return (
          <div
            key={item._id}
            className="tw:bg-white tw:p-4 tw:rounded-lg tw:border tw:border-gray-200 tw:cursor-pointer"
            onClick={() => callback?.({ action: "view", data: item })}
          >
            {/* Product Header Section */}
            <div className="tw:flex tw:items-start tw:mb-4">
              {/* Product Image */}
              <div className="tw:w-16 tw:h-16 tw:bg-gray-100 tw:rounded tw:flex tw:items-center tw:justify-center tw:mr-4 tw:overflow-hidden tw:flex-shrink-0">
                {item.originalProduct?.images &&
                item.originalProduct.images.length > 0 ? (
                  <ImgRender
                    assetId={item.originalProduct.images[0]}
                    className="tw:w-full tw:h-full tw:object-cover tw:rounded"
                    alt={item.originalProduct.name}
                  />
                ) : (
                  <Package className="tw:w-8 tw:h-8 tw:text-gray-400" />
                )}
              </div>

              {/* Product Text Details */}
              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:font-semibold tw:text-base tw:text-gray-900 tw:mb-2 tw:line-clamp-2">
                  {item.originalProduct?.name || "-"}
                </div>
                <div className="tw:flex tw:gap-2 tw:flex-wrap tw:items-center">
                  <AppBadge
                    variant={(item.statusColor as any) || "light"}
                    className="tw:text-xs"
                  >
                    {item.statusLabel || item.status || t("pending")}
                  </AppBadge>
                  <DealLinked
                    isLinkedExisting={item.isLinkedExisting}
                    isLinkedNew={item.isLinkedNew}
                  />
                </div>
              </div>
            </div>

            {/* Product Attributes Section */}
            <div className="tw:space-y-3 tw:mb-4">
              {/* Admin Notes */}
              <div className="tw:flex tw:justify-between tw:items-start">
                <span className="tw:text-sm tw:text-gray-700">
                  {t("adminNotes")}
                </span>
                <span className="tw:text-sm tw:text-gray-600 tw:text-right tw:max-w-[60%] tw:line-clamp-2">
                  <span className="tw:block">{item.adminNotes || "-"}</span>
                </span>
              </div>
            </div>

            {/* Action Button Section */}
            <div className="tw:pt-3 tw:border-t tw:border-gray-100">
              <div className="tw:flex tw:gap-2">
                {(item.status === "Synced" || item.statusLabel === "Synced") &&
                  !item.isSubscribed && (
                    <AppButton
                      color="success"
                      size="small"
                      className="tw:flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        callback?.({ action: "subscribe", data: item });
                      }}
                    >
                      <Mail size={14} />
                      {t("subscribe")}
                    </AppButton>
                  )}
                <AppButton
                  color="dark"
                  fill="outline"
                  size="small"
                  className="tw:flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    callback?.({ action: "view", data: item });
                  }}
                >
                  <Eye size={14} />
                  {t("view")}
                </AppButton>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileView;
