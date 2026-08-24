import clsx from "clsx";
import {
  Camera,
  FileText,
  MessageCircle,
  Pencil,
  QrCode,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import { SUPPORT_WHATSAPP_NUMBER } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";
import OmsService from "~/services/OmsService";
import ViewMyClubModal from "~/shared/store/view-my-club/ViewMyClubModal";
import type { ProfilePaneModel } from "../helper";

/** Window the sales/orders tiles report on. */
export const SALES_WINDOW_DAYS = 30;

interface ProfileIdentityHeroProps {
  model: ProfilePaneModel;
  /**
   * What "Edit profile" does. The side pane navigates to the profile page;
   * the profile page itself is already there, so it opens the store form
   * instead.
   */
  onEditProfile?: () => void;
  /**
   * The profile page itself is already the edit surface, so it swaps the
   * first quick action for "Add photo".
   */
  primaryAction?: "edit" | "photo";
  className?: string;
}

/** Takings and order count for the hero's stat tiles. */
const useRecentSales = () => {
  const [sales, setSales] = useState({ amount: 0, orderCount: 0 });

  useEffect(() => {
    let cancelled = false;
    OmsService.getRecentSalesSummary(SALES_WINDOW_DAYS).then((summary) => {
      if (!cancelled) setSales(summary);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return sales;
};

/**
 * Who the store is, how it is trading, and the four things it does from here.
 * Shared by the theme-2 profile side pane (desktop) and the top of the profile
 * page (mobile), so both read the same identity band.
 */
const ProfileIdentityHero = ({
  model,
  onEditProfile,
  primaryAction = "edit",
  className = "",
}: ProfileIdentityHeroProps) => {
  const appNav = useAppNav();
  const [showQr, setShowQr] = useState(false);

  const sales = useRecentSales();

  const quickActions = [
    primaryAction === "photo"
      ? {
          key: "photo",
          icon: Camera,
          label: "Add photo",
          className: "tw:bg-primary tw:text-white tw:hover:bg-primary/90",
          onClick: () => appNav.to("/user/store-photos"),
        }
      : {
          key: "edit",
          icon: Pencil,
          label: "Edit profile",
          className: "tw:bg-primary tw:text-white tw:hover:bg-primary/90",
          onClick: onEditProfile ?? (() => appNav.to("/user/my-profile")),
        },
    {
      key: "qr",
      icon: QrCode,
      label: "Share QR",
      className: "tw:bg-amber-100 tw:text-amber-800 tw:hover:bg-amber-200",
      onClick: () => setShowQr(true),
    },
    {
      key: "doc",
      icon: FileText,
      label: "Add doc",
      className: "tw:bg-violet-100 tw:text-violet-700 tw:hover:bg-violet-200",
      // Documents are managed on their own page rather than in a modal
      // stacked over the pane.
      onClick: () => appNav.to("/user/documents"),
    },
    {
      key: "support",
      icon: MessageCircle,
      label: "WA support",
      className:
        "tw:border tw:border-slate-200 tw:bg-white tw:text-slate-700 tw:hover:bg-slate-50",
      onClick: () => {
        const url = CommonService.prepareWhatsappMessage(
          "hi",
          SUPPORT_WHATSAPP_NUMBER,
        );
        CommonService.windowOpenHandler(url, () => {});
      },
    },
  ];

  return (
    <>
      <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
        {/* Identity band — who the store is, then how it is trading. */}
        <div className="app-bleed-x app-pane-hero tw:bg-linear-to-br tw:from-primary tw:to-primary/80 tw:p-4">
          <div className="tw:flex tw:items-start tw:gap-3">
            <div className="tw:relative tw:h-16 tw:w-16 tw:shrink-0 tw:overflow-hidden tw:rounded-2xl tw:bg-white/15 tw:ring-1 tw:ring-white/25">
              {model.storeImage ? (
                <ImgRender
                  assetId={model.storeImage}
                  alt={model.storeName}
                  className="tw:h-full tw:w-full tw:object-cover"
                />
              ) : (
                <div className="tw:flex tw:h-full tw:w-full tw:items-center tw:justify-center tw:text-white/80">
                  <User className="tw:h-8 tw:w-8" />
                </div>
              )}
            </div>
            <div className="tw:min-w-0 tw:flex-1 tw:pr-8">
              <div className="tw:truncate tw:text-lg tw:font-bold tw:leading-tight tw:text-white">
                {model.storeName}
              </div>
              <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5 tw:text-xs tw:text-white/80">
                {model.ownerName && <span>{model.ownerName}</span>}
                {model.ownerName && model.fid && <span>·</span>}
                {model.fid && <span>ID {model.fid}</span>}
              </div>
              <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
                <span className="tw:rounded-md tw:bg-white/15 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-white">
                  {model.membership}
                </span>
                {model.tenure && (
                  <span className="tw:rounded-md tw:bg-amber-300/90 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-amber-900">
                    ★ {model.tenure}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Trust, then the last 30 days of trading. */}
          <div className="tw:mt-4 tw:grid tw:grid-cols-3 tw:gap-2">
            <div className="tw:rounded-xl tw:bg-white/10 tw:px-3 tw:py-2.5">
              <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/70">
                Trust
              </div>
              <div className="tw:mt-1 tw:text-xl tw:font-bold tw:tabular-nums tw:text-white">
                {model.trustScore}%
              </div>
            </div>
            <div className="tw:rounded-xl tw:bg-white/15 tw:px-3 tw:py-2.5 tw:ring-1 tw:ring-white/25">
              <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/70">
                Sales · {SALES_WINDOW_DAYS}d
              </div>
              <div className="tw:mt-1 tw:truncate tw:text-xl tw:font-bold tw:tabular-nums tw:text-white">
                <Amount value={sales.amount} decimalPlaces={0} />
              </div>
            </div>
            <div className="tw:rounded-xl tw:bg-white/10 tw:px-3 tw:py-2.5">
              <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/70">
                Orders
              </div>
              <div className="tw:mt-1 tw:text-xl tw:font-bold tw:tabular-nums tw:text-white">
                {sales.orderCount}
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions — the four things a store does from here. */}
        <div>
          <p className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
            Quick actions
          </p>
          <div className="tw:mt-2 tw:grid tw:grid-cols-2 tw:gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={action.onClick}
                  className={clsx(
                    "tw:flex tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-xl tw:px-3 tw:py-2.5 tw:text-sm tw:font-semibold tw:transition-colors",
                    action.className,
                  )}
                >
                  <Icon className="tw:h-4 tw:w-4 tw:shrink-0" />
                  <span className="tw:truncate">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ViewMyClubModal
        show={showQr}
        value={model.clubUrl}
        onClose={() => setShowQr(false)}
      />
    </>
  );
};

export default ProfileIdentityHero;
