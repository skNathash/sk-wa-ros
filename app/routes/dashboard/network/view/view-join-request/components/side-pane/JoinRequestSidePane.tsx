import { useMemo } from "react";
import clsx from "clsx";
import { Calendar, ChevronRight, MapPin, Navigation, Phone, User } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";
import { InitialsAvatar } from "~/shared/network/components/directory-bits/DirectoryBits";
import type { VariantColor } from "~/types/CommonTypes";

interface JoinRequestSidePaneProps {
  /** Join request data merged from the buyer franchise + request details. */
  data: Record<string, any>;
  /** Called when the user taps Approve in the pane. */
  onApprove?: () => void;
  /** Called when the user taps Reject in the pane. */
  onReject?: () => void;
  className?: string;
}

const Row = ({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
}) => (
  <div className="tw:flex tw:items-center tw:gap-2.5 tw:text-sm tw:text-slate-700">
    <span className="tw:shrink-0 tw:text-slate-400">{icon}</span>
    <span className="tw:min-w-0 tw:truncate">{value}</span>
  </div>
);

/**
 * Side-pane contents for the join-request detail page in theme-2 desktop —
 * who the applicant is, the status of the request, the actions the seller
 * takes on it and how to reach them. Mirrors `CustomerSidePane` on the B2C
 * side; the page drops it into `AppPaneSide` and the CSS re-homes it as the
 * fixed pane beside the section rail.
 */
const JoinRequestSidePane = ({
  data,
  onApprove,
  onReject,
  className,
}: JoinRequestSidePaneProps) => {
  const appNav = useAppNav();

  const statusVariant = useMemo<VariantColor>(() => {
    const raw = (
      data._statusColor ||
      (data.status === "approved" ? "success" : "warning")
    ) as string;
    return raw === "success" || raw === "warning" || raw === "danger"
      ? (raw as VariantColor)
      : "warning";
  }, [data._statusColor, data.status]);

  const canAct = data.status === "Pending" || !data.status;

  const shopImage = data.approvedShopImage || data.shopPhotosDetails?.[0]?.fileUrl;

  const storeAddress = [
    data.addressLine1,
    data.addressLine2,
    data.city,
    data.state,
    data.pincode,
  ]
    .filter(Boolean)
    .join(", ");


  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      {/* Identity band — applicant name, status and the headline numbers that
          decide whether to approve. `app-bleed-x` cancels the pane gutters and
          `app-pane-hero` its top padding, so the band owns the pane's top-left
          corner and sits flush against the icon rail. */}
      <div className="app-bleed-x app-pane-hero tw:bg-linear-to-br tw:from-primary tw:to-primary/80 tw:p-4">
        <div className="tw:flex tw:items-center tw:gap-3">
          {shopImage ? (
            <div className="tw:flex tw:size-12 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:ring-2 tw:ring-white/30">
              <ImgRender
                assetId={shopImage}
                alt={data.name}
                className="tw:h-full tw:w-full tw:object-cover"
              />
            </div>
          ) : (
            <InitialsAvatar name={data.name} size={48} />
          )}

          <div className="tw:min-w-0 tw:flex-1">
            <p className="tw:truncate tw:text-lg tw:font-bold tw:text-white">
              {data.name || "Unknown"}
            </p>
            {data.mobile ? (
              <p className="tw:truncate tw:text-xs tw:text-white/70">
                {data.mobile}
              </p>
            ) : null}
            <div className="tw:mt-1.5">
              <AppBadge variant={statusVariant}>
                {data._statusLabel || data.status || "Pending"}
              </AppBadge>
            </div>
          </div>
        </div>

        {/* Headline numbers — distance and when the request came in. */}
        <div className="tw:mt-3 tw:flex tw:items-stretch tw:gap-2">
          <div className="tw:min-w-0 tw:flex-1 tw:rounded-lg tw:bg-white/10 tw:px-3 tw:py-2 tw:ring-1 tw:ring-inset tw:ring-white/15">
            <p className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/60">
              Distance
            </p>
            <p className="tw:mt-0.5 tw:truncate tw:text-lg tw:font-bold tw:text-white">
              {data.distanceKm !== undefined && data.distanceKm !== null
                ? `${CommonService.roundedByDecimalPlace(data.distanceKm, 2)} km`
                : "-"}
            </p>
          </div>
          <div className="tw:min-w-0 tw:flex-1 tw:rounded-lg tw:bg-white/10 tw:px-3 tw:py-2 tw:ring-1 tw:ring-inset tw:ring-white/15">
            <p className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/60">
              Requested
            </p>
            <p className="tw:mt-0.5 tw:truncate tw:text-lg tw:font-bold tw:text-white">
              {data.requestedOn ? (
                <DateFormat value={data.requestedOn} formatStr="dd MMM" />
              ) : (
                "-"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Quick actions — the two things a seller does from this page. */}
      {canAct ? (
        <div>
          <p className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
            Actions
          </p>
          <div className="tw:mt-2 tw:grid tw:grid-cols-2 tw:gap-2">
            <button
              type="button"
              onClick={onApprove}
              className="tw:flex tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:px-3 tw:py-2.5 tw:text-sm tw:font-semibold tw:transition-colors tw:bg-emerald-600 tw:text-white tw:hover:bg-emerald-700"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={onReject}
              className="tw:flex tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:px-3 tw:py-2.5 tw:text-sm tw:font-semibold tw:transition-colors tw:bg-white tw:text-red-600 tw:ring-1 tw:ring-inset tw:ring-red-200 tw:hover:bg-red-50"
            >
              Reject
            </button>
          </div>
        </div>
      ) : null}

      {/* Contact / location details for the applicant. */}
      <div>
        <p className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
          Contact
        </p>
        <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-2.5">
          {data.ownerDetails?.name ? (
            <Row icon={<User size={15} />} value={data.ownerDetails.name} />
          ) : null}
          {data.mobile ? (
            <Row icon={<Phone size={15} />} value={data.mobile} />
          ) : null}
          {storeAddress ? (
            <Row icon={<MapPin size={15} />} value={storeAddress} />
          ) : null}
          {data.distanceKm !== undefined && data.distanceKm !== null ? (
            <Row
              icon={<Navigation size={15} />}
              value={`${CommonService.roundedByDecimalPlace(data.distanceKm, 2)} km away`}
            />
          ) : null}
          {data.requestedOn ? (
            <Row
              icon={<Calendar size={15} />}
              value={
                <DateFormat
                  value={data.requestedOn}
                  formatStr="dd MMM yyyy, hh:mm a"
                />
              }
            />
          ) : null}
        </div>
      </div>

      {/* Link back to the parent list so the pane never feels like a dead end. */}
      <div className="tw:mb-4">
        <p className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
          Related
        </p>
        <div className="app-bleed-x tw:mt-2 tw:flex tw:flex-col tw:divide-y tw:divide-slate-200 tw:border-y tw:border-slate-200">
          <button
            type="button"
            onClick={() =>
              appNav.to("/dashboard/network/management/joining-request", {
                tab: "joining-request",
              })
            }
            className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-none tw:bg-white tw:px-4 tw:py-2.5 tw:text-left tw:transition-colors tw:hover:bg-slate-50"
          >
            <span className="tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-slate-500 tw:text-xs tw:font-bold tw:text-white">
              JR
            </span>
            <span className="tw:min-w-0 tw:flex-1">
              <span className="tw:block tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
                Join Requests
              </span>
              <span className="tw:block tw:truncate tw:text-xs tw:text-slate-500">
                Back to requests list
              </span>
            </span>
            <ChevronRight size={16} className="tw:shrink-0 tw:text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRequestSidePane;
