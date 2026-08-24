import { MessageSquare, Package } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import useAppNav from "~/hooks/useAppNav";
import VendorService from "~/services/VendorService";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";

type Props = {
  poDetails: Record<string, any>;
  className?: string;
};

const ReceivingHeader = ({ poDetails, className = "" }: Props) => {
  const { t } = useTranslation();
  const appNav = useAppNav();

  const vendor = poDetails.vendorInfo || {};
  const vendorType = VendorService.getVendorType({
    name: vendor.name || "",
    vendorType: vendor.isOwnVendor ? "OWN" : "",
  });

  const latestPackage =
    Array.isArray(poDetails.receivedPackages) &&
    poDetails.receivedPackages.length > 0
      ? poDetails.receivedPackages[poDetails.receivedPackages.length - 1]
      : null;

  const packageId = latestPackage?.packageId;
  const arrivedAt = latestPackage?.receivedAt;

  const handleVendor = () => {
    if (!vendor.id) return;
    appNav.to(`/dashboard/vendor/view/${vendor.id}`);
  };

  // The mobile app header already carries "PO007203 · JAGAN", so the vendor
  // line is desktop-only — repeating it on a phone spent a whole row saying
  // what the title bar had just said.
  const metaParts: { key: string; node: ReactNode; desktopOnly?: boolean }[] = [
    {
      key: "from",
      desktopOnly: true,
      node: (
        <>
          {t("from", { defaultValue: "From" })}{" "}
          <span className="tw:font-semibold tw:text-slate-700">
            {vendor.name}
          </span>
        </>
      ),
    },
  ];

  if (packageId) {
    metaParts.push({
      key: "box",
      node: (
        <>
          {t("box", { defaultValue: "Box" })}{" "}
          <span className="tw:font-semibold tw:text-slate-700">
            {packageId}
          </span>
        </>
      ),
    });
  }

  if (arrivedAt) {
    metaParts.push({
      key: "arrived",
      node: (
        <>
          {t("arrived", { defaultValue: "Arrived" })}{" "}
          <DateFormat value={arrivedAt} formatStr="dd MMM" />
          <span className="tw:mx-1 tw:text-slate-300">·</span>
          <DateFormat value={arrivedAt} formatStr="hh:mm a" />
        </>
      ),
    });
  }

  return (
    // `app-chat-topbar` turns this row into the thread's contact bar on mobile
    // (full-bleed white band under the app header, hairline below); it is a
    // no-op on desktop and on themes without the chat treatment.
    <div
      className={`app-chat-topbar tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:mb-4 ${className}`}
    >
      <div className="tw:flex tw:flex-1 tw:items-center tw:gap-3 tw:min-w-0">
        {/* Contact avatar — solid chat tint, no outline, so it reads as the
            party this screen is a conversation with. It stays on mobile too:
            without it the band was three loose chips floating on white with
            nothing holding the row's left edge. The dot on its shoulder is the
            live-state marker, so the state is legible before any text is read. */}
        <div className="tw:relative tw:shrink-0">
          <div className="app-msg-meta tw:flex tw:w-9 tw:h-9 tw:md:w-10 tw:md:h-10 tw:rounded-full! tw:items-center tw:justify-center">
            <Package
              className="tw:w-4 tw:h-4 tw:md:w-4.5 tw:md:h-4.5"
              strokeWidth={1.75}
            />
          </div>
          <span
            className="tw:absolute tw:-bottom-0.5 tw:-right-0.5 tw:flex tw:h-3 tw:w-3"
            aria-hidden
          >
            <span className="tw:absolute tw:inline-flex tw:h-full tw:w-full tw:animate-ping tw:rounded-full tw:bg-amber-400 tw:opacity-60" />
            <span className="tw:relative tw:inline-flex tw:h-3 tw:w-3 tw:rounded-full tw:border-2 tw:border-white tw:bg-amber-500" />
          </span>
        </div>

        <div className="tw:min-w-0 tw:flex-1">
          {/* Name line. Desktop leads with the PO number; on a phone the app
              header already carries it, so the line leads with the state
              instead — the one thing the header does not say. Either way the
              state is a word in the name line rather than a coloured chip, so
              the vendor-type tag is the only tinted thing in the band and stops
              having to shout over two neighbours. */}
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:min-w-0">
            <h2 className="tw:truncate tw:text-[13px] tw:font-bold tw:leading-tight tw:tracking-tight tw:text-slate-900 tw:md:text-base">
              <span className="tw:md:hidden">
                {t("receiving", { defaultValue: "Receiving" })}
              </span>
              <span className="tw:hidden tw:md:inline">
                {poDetails.orderId}
              </span>
            </h2>
            <span className="tw:hidden tw:shrink-0 tw:md:inline-flex">
              <AppBadge
                variant="warning"
                size="sm"
                className="tw:rounded-full!"
              >
                {t("receiving", { defaultValue: "Receiving" })}
              </AppBadge>
            </span>
            {vendorType.type && (
              <VendorTypeBadge
                type={vendorType.type}
                color={vendorType.color}
                description={vendorType.description}
                size="sm"
                hideInfo
              />
            )}
          </div>

          {/* With nothing but the desktop-only vendor part, the row would be an
              empty strip of margin on a phone. */}
          <div
            className={`tw:mt-0.5 tw:min-w-0 tw:flex-wrap tw:items-center tw:gap-x-1.5 tw:gap-y-1 tw:text-[11px] tw:text-slate-500 ${
              metaParts.some((p) => !p.desktopOnly)
                ? "tw:flex"
                : "tw:hidden tw:md:flex"
            }`}
          >
            {metaParts.map((part, i) => (
              <span
                key={part.key}
                className={`tw:items-center ${
                  part.desktopOnly
                    ? "tw:hidden tw:md:inline-flex"
                    : "tw:inline-flex"
                }`}
              >
                {i > 0 && (
                  <span
                    className={`tw:mr-1.5 tw:text-slate-300 ${
                      // The separator belongs to the part before it; when that
                      // part is hidden on mobile this one would open the line
                      // with a stray dot.
                      metaParts[i - 1].desktopOnly ? "tw:hidden tw:md:inline" : ""
                    }`}
                    aria-hidden
                  >
                    ·
                  </span>
                )}
                {part.node}
              </span>
            ))}
          </div>
        </div>
      </div>

      {vendor.id ? (
        <AppButton
          size="small"
          fill="clear"
          color="light"
          onClick={handleVendor}
          className="app-msg-action tw:h-9 tw:shrink-0 tw:px-3.5 tw:font-semibold"
        >
          <MessageSquare className="tw:w-3.5 tw:h-3.5" />
          {t("vendor", { defaultValue: "Vendor" })}
        </AppButton>
      ) : null}
    </div>
  );
};

export default ReceivingHeader;
