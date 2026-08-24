import { ChevronRight, MessageCircle } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import CommonService from "~/services/CommonService";
import type { VariantColor } from "~/types/CommonTypes";
import {
  DirectoryEmpty,
  InitialsAvatar,
  PaylaterBar,
  paylaterLabel,
} from "~/shared/network/components/directory-bits/DirectoryBits";

interface FranchiseData {
  _id: string;
  franchiseId?: string;
  name: string;
  mobile?: string;
  email?: string;
  status?: string;
  createdAt?: string;
  city?: string;
  town?: string;
  district?: string;
  state?: string;
  pincode?: string;
  formattedAddress: string;
  initials: string;
  lastOrderDate?: string;
  // Directory metrics — sent by the franchise dashboard API when available.
  bills?: number;
  ltv?: number;
  paylaterUsed?: number;
  paylaterLimit?: number;
  /** Buyer flag from the API — drives the Active / "last · Nd" status line. */
  isActiveBuyer?: boolean;
  daysSinceOrder?: number;
  /** Registration date picked by the list helper — `createdAt`. */
  registeredOn?: string | null;
}

interface MobileViewProps {
  loading?: boolean;
  data: FranchiseData[];
  onView?: (item: FranchiseData) => void;
  callback?: (arg: { action: string; data?: any }) => void;
}

/* Active is green, Inactive is red. Same shape as the B2C rows: Inactive
   carries its own red classes because the themed `default`/`secondary`
   surfaces both read green in theme-2. */
const statusBadge = (
  isActiveBuyer: boolean,
): { label: string; color: VariantColor; className?: string } =>
  isActiveBuyer
    ? { label: "Active", color: "success" }
    : {
        label: "Inactive",
        color: "light",
        className: "tw:bg-red-50! tw:text-red-600! tw:border-transparent!",
      };

const MobileView: React.FC<MobileViewProps> = ({
  loading,
  data,
  onView,
  callback,
}) => {
  const { t } = useTranslation(["common"]);

  // Sorting and filtering both clear the rows before the refetch lands, so the
  // list needs its own placeholder — the desktop table has the skeleton rows.
  if (loading) {
    return (
      <div className="app-bleed-x tw:divide-y tw:divide-border tw:bg-white tw:md:grid tw:md:grid-cols-2 tw:md:gap-3 tw:md:divide-y-0 tw:md:bg-transparent">
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className="tw:animate-pulse tw:bg-white tw:p-3.5 tw:md:rounded-xl tw:md:border tw:md:border-border"
          >
            <div className="tw:flex tw:items-start tw:gap-3">
              <div className="tw:h-12 tw:w-12 tw:shrink-0 tw:rounded-full tw:bg-gray-200" />
              <div className="tw:min-w-0 tw:flex-1 tw:space-y-2">
                <div className="tw:h-4 tw:w-2/5 tw:rounded tw:bg-gray-200" />
                <div className="tw:h-3 tw:w-3/5 tw:rounded tw:bg-gray-200" />
                <div className="tw:h-3 tw:w-4/5 tw:rounded tw:bg-gray-200" />
                <div className="tw:h-5 tw:w-24 tw:rounded-full tw:bg-gray-200" />
              </div>
              <div className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-full tw:bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <DirectoryEmpty
        variant="bleed"
        title="No retailers found"
        description="Try another search, filter, or segment — or clear filters to see the full book."
      />
    );
  }

  return (
    /* `app-bleed-x` pulls the list out of the page gutter on theme-2 mobile so
       the rows run edge to edge as one flush block — no gaps, no corners. The
       card grid comes back from md up. */
    <div className="app-bleed-x tw:divide-y tw:divide-border tw:rounded-none tw:bg-white tw:md:grid tw:md:grid-cols-2 tw:md:gap-3 tw:md:divide-y-0 tw:md:bg-transparent">
      {data.map((item, idx) => {
        const badge = statusBadge(item.isActiveBuyer === true);
        return (
          <div
            key={item._id || idx}
            className="tw:bg-white tw:md:rounded-xl tw:md:border tw:md:border-border tw:md:shadow-sm"
          >
            <div
              className="tw:cursor-pointer tw:p-3.5"
              onClick={() => onView && onView(item)}
            >
              <div className="tw:flex tw:items-start tw:gap-3">
                <InitialsAvatar
                  name={item.name}
                  initials={item.initials}
                  size={48}
                />

                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:truncate tw:text-base tw:font-semibold">
                      {item.name}
                    </span>
                  </div>

                  <div className="tw:mt-0.5 tw:text-xs tw:text-gray-600">
                    {item.mobile || t("nA")}
                    {item.franchiseId ? ` · ${item.franchiseId}` : ""}
                  </div>

                  {/* Where the retailer is registered. */}
                  {item.formattedAddress && item.formattedAddress !== "N/A" ? (
                    <div className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-gray-500">
                      {item.formattedAddress}
                    </div>
                  ) : null}

                  {/* Metric line — bills, LTV. */}
                  <div className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-0.5 tw:text-xs tw:text-gray-500">
                    <span>{item.bills ?? 0} bills</span>
                    <span>
                      LTV {CommonService.formatCompact(item.ltv, { style: "short", prefix: "₹" })}
                    </span>
                  </div>

                  {/* Paylater meter — aligned to the text column, not the card. */}
                  {item.paylaterLimit ? (
                    <div className="tw:mt-2.5">
                      <PaylaterBar
                        used={item.paylaterUsed}
                        limit={item.paylaterLimit}
                      />
                      <div className="tw:mt-1 tw:text-xs tw:text-gray-600">
                        Paylater{" "}
                        {paylaterLabel(item.paylaterUsed, item.paylaterLimit)}
                      </div>
                    </div>
                  ) : null}

                  <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                    <AppBadge variant={badge.color} className={badge.className}>
                      {badge.label}
                    </AppBadge>
                    <span className="tw:text-xs tw:text-gray-400">
                      {item.daysSinceOrder === undefined
                        ? "No orders yet"
                        : `Last · ${item.daysSinceOrder}d`}
                    </span>
                    {item.registeredOn ? (
                      <span className="tw:text-xs tw:text-gray-400">
                        {t("registeredOn")} ·{" "}
                        <DateFormat
                          value={item.registeredOn}
                          formatStr="dd MMM yyyy"
                        />
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Right rail — WhatsApp promote over the drill-in chevron. */}
                <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:gap-2">
                  <button
                    type="button"
                    aria-label="Promote via WhatsApp"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      callback?.({ action: "openWhatsapp", data: item });
                    }}
                    className="tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary tw:text-white tw:cursor-pointer tw:transition-opacity tw:hover:opacity-90"
                  >
                    <MessageCircle className="tw:h-5 tw:w-5 tw:shrink-0" />
                  </button>
                  <ChevronRight className="tw:h-4 tw:w-4 tw:text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileView;
