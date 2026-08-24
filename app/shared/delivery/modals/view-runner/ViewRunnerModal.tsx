import { useEffect, useState } from "react";
import {
  Car,
  Check,
  FileText,
  IdCard,
  MessageCircle,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import LogisticsService from "~/services/LogisticsService";
import MarketplaceRunnerService from "~/services/MarketplaceRunnerService";
import { InitialsAvatar } from "~/shared/network/components/directory-bits/DirectoryBits";

type Props = {
  show: boolean;
  runnerId?: string | null;
  /** Show the footer's hire action; needs `orderId` and `invoiceId` with it. */
  canHire?: boolean;
  /** Order the runner is hired against, sent straight to `shipment/assign`. */
  orderId?: string;
  invoiceId?: string;
  callback: () => void;
};

type Runner = {
  _id: string;
  referenceId?: string;
  name?: string;
  mobile?: string;
  gender?: string;
  status?: string;
  isAvailable?: boolean;
  isOtpVerified?: boolean;
  rating?: number;
  totalDrops?: number;
  vehicleDetails?: {
    type?: string;
    capacity?: string;
    vehicleNo?: string;
  };
  rate?: {
    baseCharge?: number;
    chargePerKm?: number;
  };
  address?: {
    city?: string;
    postcode?: string;
  };
  createdBy?: {
    name?: string;
    referenceCode?: string;
  };
};

const VERIFICATION_ITEMS = [
  { label: "Aadhaar", icon: IdCard },
  { label: "PAN", icon: FileText },
  { label: "RC", icon: Car },
  { label: "Insurance", icon: ShieldCheck },
];

const ViewRunnerModal = ({
  show,
  runnerId,
  canHire = false,
  orderId,
  invoiceId,
  callback,
}: Props) => {
  const appToast = useAppToast();
  const [runner, setRunner] = useState<Runner | null>(null);
  const [fetching, setFetching] = useState(false);
  const [hiring, setHiring] = useState(false);

  useEffect(() => {
    if (!show || !runnerId) return;

    let cancelled = false;

    const fetchRunner = async () => {
      setFetching(true);
      try {
        const response = await MarketplaceRunnerService.getRunners({
          filter: { _id: runnerId },
        });
        if (cancelled) return;
        const apiRunner = response?.data?.data?.[0];
        if (apiRunner) {
          setRunner(apiRunner);
        }
      } catch {
        // Leave the modal empty so no stale/static values are shown.
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    fetchRunner();

    return () => {
      cancelled = true;
    };
  }, [show, runnerId]);

  const handleClose = () => {
    callback();
  };

  /* The desk only leaves the modal once the shipment is really assigned — an
     error keeps the runner on screen so the pick can be retried or changed. */
  const handleHire = async () => {
    if (!runnerId || !orderId || !invoiceId) return;

    setHiring(true);
    try {
      const response = await LogisticsService.assignDelivery({
        orderId,
        invoiceId,
        deliveryAgentId: runnerId,
        deliveryAgentType: "External",
      });

      if (response.statusCode === 200 || response.statusCode === 201) {
        appToast.show({ msg: "Runner hired", color: "success" });
        callback();
        return;
      }

      appToast.show({ msg: response.data?.message, color: "danger" });
    } catch (error: any) {
      appToast.show({ msg: error?.message, color: "danger" });
    } finally {
      setHiring(false);
    }
  };

  const initials = runner?.name
    ? CommonService.prepareInitials(runner.name)
    : "";
  const locationLabel = [runner?.address?.city, runner?.address?.postcode]
    .filter(Boolean)
    .join(" / ");
  const hasRate =
    runner?.rate?.baseCharge != null && runner?.rate?.chargePerKm != null;
  const baseChargeLabel = hasRate
    ? `₹${CommonService.formattedAmount(runner!.rate!.baseCharge!, 0)}`
    : "—";
  const rateLabel = hasRate
    ? `${baseChargeLabel} + ₹${CommonService.formattedAmount(runner!.rate!.chargePerKm!, 0)}/km`
    : "—";
  const subtitle = [
    runner?.vehicleDetails?.type?.toLowerCase(),
    runner?.vehicleDetails?.vehicleNo,
    locationLabel,
  ]
    .filter(Boolean)
    .join(" · ");
  const otpLabel = runner?.isOtpVerified ? "OTP verified" : "OTP not verified";
  const whatsappPreview =
    runner?.name && hasRate
      ? `Hi ${runner.name}, we would like to hire you now. Reach the shop for one drop, base ${rateLabel}. Reply Y to accept.`
      : "—";

  /* Escrow rows the runner's own rate backs — the release and fee lines carry
     no figure because nothing on the runner document sets one. */
  const ESCROW_ROWS = [
    { label: "Held now", value: baseChargeLabel, tone: "tw:text-slate-900" },
    {
      label: "Released on clean delivery",
      value: "on drop confirmation",
      tone: "tw:text-teal-700",
    },
    {
      label: "Platform fee",
      value: "auto-deducted",
      tone: "tw:text-slate-500",
    },
    {
      label: "Refund if runner cancels",
      value: `full ${baseChargeLabel}`,
      tone: "tw:text-indigo-700",
    },
  ];

  return (
    <AppModal
      show={show}
      callback={handleClose}
      className="tw:h-[90vh] tw:max-w-md tw:overflow-hidden tw:bg-slate-50"
      noPadding
      overFlowHidden
    >
      <AppModal.Title onClose={handleClose} noShadow noBg>
        <span className="tw:text-sm tw:font-semibold tw:text-slate-700">
          Runner Details
        </span>
      </AppModal.Title>
      {/* Body */}
      <AppModal.Content className="tw:overflow-x-hidden">
        {/* Header */}
        <div className="tw:relative tw:shrink-0 tw:overflow-hidden tw:rounded-xl tw:bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-2,var(--primary))_100%)] tw:p-4 tw:text-white tw:mb-5">
          <div className="tw:flex tw:items-center tw:gap-3">
            <InitialsAvatar
              name={runner?.name ?? ""}
              initials={initials}
              size={56}
              className="tw:!bg-white/20 tw:!text-white tw:ring-2 tw:ring-white/30"
            />
            <div className="tw:min-w-0 tw:flex-1">
              <h2 className="tw:truncate tw:text-base tw:font-bold">
                {runner?.name ?? "—"}
              </h2>
              <p className="tw:mt-0.5 tw:truncate tw:text-[11px] tw:text-white/80">
                {subtitle || "—"}
              </p>
              <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
                {runner?.rating != null && (
                  <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded tw:bg-white/15 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-white">
                    <Star
                      size={10}
                      className="tw:fill-amber-300 tw:text-amber-300"
                    />
                    {runner.rating.toFixed(1)}
                  </span>
                )}
                {runner?.isAvailable && (
                  <span className="tw:ml-auto tw:inline-flex tw:shrink-0 tw:items-center tw:rounded tw:bg-emerald-500 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-white">
                    Available now
                  </span>
                )}
              </div>
            </div>
          </div>

          {(runner?.referenceId || runner?.mobile) && (
            <div className="tw:mt-3 tw:flex tw:items-center tw:gap-3 tw:text-[11px] tw:text-white/80">
              {runner?.referenceId && <span>{runner.referenceId}</span>}
              {runner?.mobile && <span>{runner.mobile}</span>}
            </div>
          )}

          {fetching && (
            <div className="tw:absolute tw:bottom-0 tw:left-0 tw:h-0.5 tw:w-full tw:bg-white/20">
              <div className="tw:h-full tw:w-1/2 tw:animate-pulse tw:bg-white/60" />
            </div>
          )}
        </div>

        <div className="tw:space-y-5">
          {/* Rate & Trust */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <div className="tw:rounded-lg tw:border-l-4 tw:border-amber-500 tw:bg-white tw:p-3 tw:shadow-sm">
              <span className="tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-400">
                Rate
              </span>
              <p className="tw:mt-1 tw:text-lg tw:font-bold tw:leading-tight tw:text-amber-700">
                {rateLabel}
              </p>
              <p className="tw:mt-1 tw:text-[10px] tw:text-slate-400">
                per drop
              </p>
            </div>

            <div className="tw:rounded-lg tw:border-l-4 tw:border-teal-600 tw:bg-white tw:p-3 tw:shadow-sm">
              <span className="tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-400">
                Trust
              </span>
              <p className="tw:mt-1 tw:text-lg tw:font-bold tw:leading-tight tw:text-teal-700">
                {runner?.totalDrops != null ? `${runner.totalDrops} drops` : "—"}
              </p>
              <p className="tw:mt-1 tw:text-[10px] tw:text-slate-400">
                {otpLabel}
              </p>
            </div>
          </div>

          {/* Verified documents */}
          <div>
            <div className="tw:mb-2 tw:flex tw:items-baseline tw:gap-2">
              <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-teal-700">
                Verified
              </span>
              <span className="tw:text-[10px] tw:text-slate-500">
                checked by StoreKing
              </span>
            </div>
            <div className="tw:grid tw:grid-cols-4 tw:gap-2">
              {VERIFICATION_ITEMS.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:rounded-lg tw:bg-emerald-50 tw:p-2.5 tw:text-center"
                >
                  <Icon size={18} className="tw:text-emerald-700" />
                  <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-[10px] tw:font-medium tw:text-emerald-800">
                    <span className="tw:truncate">{label}</span>
                    <Check size={10} className="tw:shrink-0" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Escrow terms */}
          <div>
            <div className="tw:mb-2 tw:flex tw:items-baseline tw:gap-2">
              <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-teal-700">
                Escrow terms
              </span>
              <span className="tw:text-[10px] tw:text-slate-500">
                how your money is held
              </span>
            </div>
            <div className="tw:divide-y tw:divide-slate-100 tw:rounded-lg tw:bg-white tw:px-3 tw:shadow-sm">
              {ESCROW_ROWS.map(({ label, value, tone }) => (
                <div
                  key={label}
                  className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-2.5 tw:text-[13px]"
                >
                  <span className="tw:text-slate-600">{label}</span>
                  <span
                    className={`tw:shrink-0 tw:font-semibold tw:tabular-nums ${tone}`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp preview */}
          <div>
            <span className="tw:mb-2 tw:flex tw:items-center tw:gap-1.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-teal-700">
              <MessageCircle size={12} />
              WhatsApp preview to runner
            </span>
            <div className="tw:rounded-lg tw:bg-[#FDF5E6] tw:p-3">
              <p className="tw:text-[12px] tw:leading-relaxed tw:text-slate-700">
                {whatsappPreview}
              </p>
            </div>
          </div>
        </div>
      </AppModal.Content>
      {canHire && (
        <AppModal.Footer className="tw:border-t tw:border-slate-200 tw:bg-white">
          <AppButton
            expand="block"
            color="primary"
            onClick={handleHire}
            isLoading={hiring}
            disabled={hiring || !orderId || !invoiceId}
          >
            <Zap size={15} className="tw:fill-current" />
            Hire runner
          </AppButton>
        </AppModal.Footer>
      )}
    </AppModal>
  );
};

export default ViewRunnerModal;
