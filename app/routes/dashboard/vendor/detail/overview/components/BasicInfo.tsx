import { MapPin, MessageCircle, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import CommonService from "~/services/CommonService";
import useTheme from "~/hooks/useTheme";
import clsx from "clsx";

type Props = {
  data: any;
};

const getInitials = (name?: string) => {
  if (!name) return "V";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const BasicInfo = ({ data }: Props) => {
  const { t } = useTranslation(["common"]);
  const isTheme2 = useTheme() === "theme-2" ? true : false;

  const phone = String(data?.contact?.phone || "").replace(/\D/g, "");
  const waNumber = phone.length === 10 ? `91${phone}` : phone;
  const hasLocation = Boolean(
    (data?._lat && data?._lng) || data?.contact?.address,
  );

  const handleWhatsApp = () => {
    if (!waNumber) return;
    const url = CommonService.prepareWhatsappMessage("", waNumber);
    CommonService.windowOpenHandler(url, () => {});
  };

  const handleCall = () => {
    if (!data?.contact?.phone) return;
    window.location.href = `tel:${data.contact.phone}`;
  };

  const handleMap = () => {
    const query =
      data?._lat && data?._lng
        ? `${data._lat},${data._lng}`
        : encodeURIComponent(data?.contact?.address || data?.name || "");
    CommonService.windowOpenHandler(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      () => {},
    );
  };

  return (
    <AppCard
      noPadding
      className={clsx("detail-hero-plate", { "tw:mb-0": isTheme2 })}
    >
      <div className="tw:p-3 tw:md:flex tw:md:gap-3 tw:md:items-start">
        <div className="tw:flex tw:gap-3 tw:items-start tw:md:flex-1 tw:md:min-w-0">
          <div
            className="tw:shrink-0 tw:w-12 tw:h-12 tw:rounded-lg tw:bg-emerald-100 tw:text-emerald-700 tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-bold"
            aria-label={data?.name}
          >
            {getInitials(data?.name)}
          </div>
          <div className="tw:flex-1 tw:min-w-0">
            <h2 className="tw:text-base tw:font-semibold tw:text-gray-900 tw:line-clamp-1">
              {data?.name || t("vendorName")}
            </h2>
            <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
              {data?.finance?.gstNo ? (
                <>
                  <span className="tw:font-mono!">
                    GST {data.finance.gstNo}
                  </span>
                  <span className="tw:mx-1">·</span>
                </>
              ) : null}
              <span
                className={
                  data?.status === "Active"
                    ? "tw:text-emerald-600"
                    : "tw:text-red-600"
                }
              >
                {data?.status || "-"}
              </span>
            </div>
            {data?.contact?.shortAddress || data?.contact?.distance ? (
              <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5 tw:flex tw:items-center tw:gap-1 tw:min-w-0">
                <MapPin className="tw:w-3 tw:h-3 tw:shrink-0" />
                <span className="tw:truncate">
                  {data?.contact?.shortAddress}
                </span>
                {data?.contact?.distance ? (
                  <span className="tw:shrink-0 tw:font-medium tw:text-gray-700">
                    {data?.contact?.shortAddress ? "· " : ""}
                    {data.contact.distance}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="tw:grid tw:grid-cols-3 tw:gap-2 tw:mt-3 tw:md:flex tw:md:mt-0 tw:md:shrink-0 tw:md:items-start tw:md:justify-end">
          <AppButton
            fill="solid"
            color="primary"
            size="small"
            className="tw:w-full tw:md:w-auto tw:font-bold"
            onClick={handleWhatsApp}
            disabled={!waNumber}
          >
            <MessageCircle className="tw:w-3.5 tw:h-3.5 tw:md:mr-1" />
            <span className="tw:hidden tw:md:inline">{t("whatsapp")}</span>
          </AppButton>
          <AppButton
            fill="outline"
            color="light"
            size="small"
            className="tw:w-full tw:md:w-auto tw:font-bold"
            onClick={handleCall}
            disabled={!data?.contact?.phone}
          >
            <Phone className="tw:w-3.5 tw:h-3.5 tw:md:mr-1" />
            <span className="tw:hidden tw:md:inline">{t("call")}</span>
          </AppButton>
          <AppButton
            fill="outline"
            color="light"
            size="small"
            className="tw:w-full tw:md:w-auto tw:font-bold"
            onClick={handleMap}
            disabled={!hasLocation}
          >
            <MapPin className="tw:w-3.5 tw:h-3.5 tw:md:mr-1" />
            <span className="tw:hidden tw:md:inline">{t("map")}</span>
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
};

export default BasicInfo;
