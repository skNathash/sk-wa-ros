import AppCard from "~/components/core/card/AppCard";
import WhatsAppGlyph from "~/components/core/icons/WhatsAppGlyph";
import { useTranslation } from "react-i18next";
import { Mail, MapPin, Phone } from "lucide-react";
import CommonService from "~/services/CommonService";

const SellerInfo = ({ data }: { data: any }) => {
  const { t } = useTranslation();

  const initials =
    (data?.franchiseName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w.charAt(0).toUpperCase())
      .join("") || "?";

  const address = data?.address
    ? [
        data?.address?.addressLine1,
        data?.address?.addressLine2,
        data?.address?.city,
        data?.address?.state,
        data?.address?.pincode,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <AppCard className="mb-4" noPadding>
      {/* Seller identity band */}
      <div className="app-seller-header tw:bg-primary/5 tw:px-4 tw:py-3 tw:border-b tw:border-primary/15">
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:shrink-0 tw:w-10 tw:h-10 tw:rounded-full tw:bg-primary tw:text-white tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-bold">
            {initials}
          </div>
          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
              <span className="tw:font-semibold tw:text-gray-900 tw:truncate">
                {data?.franchiseName || "N/A"}
              </span>
              <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-primary tw:bg-primary/10 tw:rounded tw:px-1.5 tw:py-0.5">
                {t("sellerInfo")}
              </span>
            </div>
            {data?.mobile && (
              <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-600 tw:mt-0.5">
                <Phone size={11} className="tw:text-gray-400" />
                <span>{data.mobile}</span>
              </div>
            )}
          </div>
          {/* Same chat/call pair the customer card carries. */}
          {data?.mobile ? (
            <div className="tw:flex tw:items-center tw:gap-2 tw:shrink-0">
              <button
                type="button"
                className="op-wa-btn"
                aria-label="Chat on WhatsApp"
                onClick={() =>
                  CommonService.windowOpenHandler(
                    `https://wa.me/${String(data.mobile).replace(/\D/g, "")}`,
                    () => {},
                  )
                }
              >
                <WhatsAppGlyph />
              </button>
              <a
                href={`tel:${data.mobile}`}
                className="op-call-btn"
                aria-label="Call seller"
              >
                <Phone size={17} />
              </a>
            </div>
          ) : null}
        </div>
      </div>

      {(data?.email || address) && (
        <div className="tw:px-4 tw:py-4">
          {data?.email && (
            <div className="tw:flex tw:gap-2 tw:text-slate-500 tw:items-center tw:mb-2 tw:last:mb-0">
              <Mail size={12} />
              <span className="tw:text-xs">{data.email}</span>
            </div>
          )}

          {/* Display delivery address if available */}
          {address && (
            <div className="tw:flex tw:gap-2 tw:text-slate-500 tw:last:mb-0">
              <MapPin size={12} className="tw:mt-1" />
              <span className="tw:text-xs tw:flex-1">{address}</span>
            </div>
          )}
        </div>
      )}
    </AppCard>
  );
};

export default SellerInfo;
