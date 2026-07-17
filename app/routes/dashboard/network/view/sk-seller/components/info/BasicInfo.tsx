import {
  CalendarDays,
  MapPin,
  Package,
  Phone,
  QrCode,
  Tags,
  Users,
  Building2,
  Mail,
} from "lucide-react";
import React from "react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import CountItem from "./CountItem";
import { useTranslation } from "react-i18next";
import AuthService from "~/services/AuthService";
import useAppToast from "~/hooks/useAppToast";

interface BasicInfoProps {
  data: any;
  callback: (action: { type: "join" | "disconnect"; sellerId: string }) => void;
  onJoinClick?: (sellerId: string, sellerName: string) => void;
  onQrCodeClick?: (sellerId: string, sellerName: string) => void;
  onImageClick?: () => void;
}

const BasicInfo: React.FC<BasicInfoProps> = ({
  data,
  callback,
  onJoinClick,
  onQrCodeClick,
  onImageClick,
}) => {
  const { t } = useTranslation();
  const appToast = useAppToast();

  const isConnected = (data.status || "").toLowerCase() === "connected";

  const handleAction = () => {
    if (AuthService.isMasterLogin()) {
      appToast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }

    if (!isConnected && onJoinClick) {
      // For join action, trigger the modal
      onJoinClick(data.id, data.name);
    } else {
      // For disconnect action, call the callback directly
      callback({
        type: isConnected ? "disconnect" : "join",
        sellerId: data.id,
      });
    }
  };

  const handleQrCodeClick = () => {
    if (onQrCodeClick) {
      onQrCodeClick(data.id, data.name);
    }
  };

  return (
    <AppCard>
      <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-5">
        {/* First Column - Image */}
        <div className="tw:flex-shrink-0 tw:flex tw:justify-center tw:md:justify-start">
          <div
            className="tw:w-32 tw:h-32 tw:md:w-20 tw:md:h-20 tw:rounded-lg tw:overflow-hidden tw:bg-gray-100 tw:cursor-pointer tw:hover:opacity-80 tw:transition-opacity"
            onClick={onImageClick}
          >
            {data?.shopPhotosDetails?.[0]?.fileUrl ? (
              <ImgRender
                assetId={data?.shopPhotosDetails?.[0]?.fileUrl}
                alt={data.name}
                className="tw:w-full tw:h-full tw:object-cover"
              />
            ) : (
              <div className="tw:w-full tw:h-full tw:flex tw:items-center tw:justify-center tw:bg-gray-200 tw:text-gray-500 tw:text-xl tw:font-medium">
                {data.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
          </div>
        </div>

        {/* Second Column - Information */}
        <div className="tw:flex-1 tw:min-w-0 tw:space-y-3">
          {/* Name */}
          <div>
            <h2 className="tw:text-xl tw:font-semibold tw:text-gray-900 tw:mb-2">
              {data.name}
            </h2>
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-4 tw:gap-y-2 tw:text-[13px] tw:text-gray-700">
              {/* Registered On */}
              <div className="tw:flex tw:items-center tw:gap-1.5">
                <CalendarDays size={14} className="tw:text-gray-600" />
                <span>{t("registeredOn")}</span>
                <span className="tw:text-gray-900 tw:font-semibold">
                  <DateFormat value={data.createdAt} formatStr="dd MMM yyyy" />
                </span>
              </div>

              {/* Mobile */}
              {data?.mobile && (
                <div className="tw:flex tw:items-center tw:gap-1.5">
                  <Phone size={14} className="tw:text-gray-600" />
                  <span>{data.mobile}</span>
                </div>
              )}

              {/* Email */}
              {data?.email && (
                <div className="tw:flex tw:items-center tw:gap-1.5">
                  <Mail size={14} className="tw:text-gray-600" />
                  <span>{data.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Primary Business Information */}
          {data.primaryBusiness && (
            <div className="tw:flex tw:items-center tw:gap-3 tw:p-3 tw:bg-blue-50 tw:rounded-md">
              <Building2
                size={18}
                className="tw:text-blue-600 tw:flex-shrink-0"
              />
              <div className="tw:space-y-1 tw:min-w-0">
                <div className="tw:text-[11px] tw:uppercase tw:tracking-wide tw:text-blue-500">
                  {t("primaryBusiness")}
                </div>
                <p className="tw:text-[15px] tw:text-blue-900 tw:font-medium">
                  {data.primaryBusiness}
                </p>
              </div>
            </div>
          )}

          {/* Address - simplified and readable for rural users */}
          <div className="tw:flex tw:items-start tw:gap-3 tw:p-3 tw:bg-gray-50 tw:rounded-md">
            <MapPin
              size={18}
              className="tw:text-gray-600 tw:mt-0.5 tw:flex-shrink-0"
            />
            <div className="tw:space-y-1 tw:min-w-0">
              <div className="tw:text-[11px] tw:uppercase tw:tracking-wide tw:text-gray-500">
                {t("address")}
              </div>
              <p
                className="tw:text-[15px] tw:text-gray-900 tw:leading-6 tw:whitespace-pre-line"
                title={data._address}
              >
                {data._address || "-"}
              </p>
              {data?.distanceKm != null && data?.distanceKm !== "" ? (
                <div className="tw:inline-flex tw:flex-col tw:md:flex-row tw:items-start tw:md:items-center tw:gap-1 tw:md:gap-2 tw:bg-blue-50 tw:text-blue-700 tw:border tw:border-blue-200 tw:px-2.5 tw:py-1 tw:rounded-md tw:text-[12px] tw:mt-1">
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <MapPin size={14} className="tw:text-blue-700" />
                    <span>{t("distanceBetweenYouAndTheSeller")}</span>
                  </div>
                  <span className="tw:font-semibold tw:text-blue-800">
                    {data.distanceKm} km
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Lean Stats Row */}
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-2 tw:text-[13px] tw:text-gray-700 tw:mt-2">
            {/* <CountItem
              icon={Tags}
              label={data.totalBrands === 1 ? t("brand") : t("brands")}
              count={data.totalBrands || 0}
              variant="brand"
            />
            <CountItem
              icon={Package}
              label={data.totalProducts === 1 ? t("product") : t("products")}
              count={data.totalProducts || 0}
              variant="product"
            /> */}
            <CountItem
              icon={Users}
              label={(data.totalBuyers || 0) === 1 ? t("buyer") : t("buyers")}
              count={data.skBuyersCount || 0}
              variant="buyer"
            />
          </div>

          {/* Quick Actions moved to action buttons */}
        </div>

        {/* Third Column - Action Buttons */}
        <div className="tw:flex-shrink-0 tw:flex tw:flex-col  tw:items-stretch tw:md:items-end tw:gap-3">
          {data.request?.status != "Pending" ? (
            <>
              <AppButton
                onClick={handleAction}
                size="default"
                color="success"
                fill="solid"
                className="tw:w-full tw:font-semibold"
              >
                <Users size={16} className="tw:mr-2" />
                {t("joinSeller")}
              </AppButton>
            </>
          ) : null}

          {/* QR Code Button */}
          <AppButton
            onClick={handleQrCodeClick}
            size="default"
            color="light"
            fill="outline"
            className="tw:w-full"
          >
            <QrCode size={16} className="tw:mr-2" />
            {t("viewStoreQR")}
          </AppButton>
          {data?.mobile ? (
            <AppLink href={`tel:${data.mobile}`} asLink className="tw:w-full">
              <AppButton
                size="default"
                color="light"
                fill="outline"
                className="tw:w-full"
              >
                <Phone size={16} className="tw:mr-2" />
                {t("callSeller")}
              </AppButton>
            </AppLink>
          ) : null}
        </div>
      </div>
    </AppCard>
  );
};

export default BasicInfo;
