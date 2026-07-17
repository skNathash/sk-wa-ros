import { ChevronRight, MessageCircle } from "lucide-react";

/** Promotional "Invite to CLUB" card — online store QR + WhatsApp templates. */
const InviteToClub = () => {
  return (
    <button
      type="button"
      className="tw:group tw:relative tw:flex tw:w-full tw:items-center tw:gap-3 tw:overflow-hidden tw:rounded-2xl tw:bg-linear-to-br tw:from-emerald-800 tw:to-teal-900 tw:p-4 tw:text-left tw:shadow-sm"
    >
      <div className="tw:relative tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-emerald-500/20">
        <MessageCircle className="tw:h-6 tw:w-6 tw:text-emerald-300" />
        <span className="tw:absolute tw:-right-1 tw:-top-1 tw:h-3 tw:w-3 tw:rounded-full tw:bg-amber-400" />
      </div>
      <div className="tw:min-w-0 tw:flex-1">
        <div className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:text-sm tw:font-bold tw:text-white">
            Invite to
          </span>
          <span className="tw:rounded tw:bg-emerald-400/20 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:tracking-wide tw:text-emerald-200">
            CLUB
          </span>
        </div>
        <p className="tw:mt-0.5 tw:text-xs tw:leading-snug tw:text-emerald-100/70">
          Your online store QR + WhatsApp promo templates in 5 languages
        </p>
      </div>
      <ChevronRight className="tw:h-5 tw:w-5 tw:shrink-0 tw:text-emerald-200/60 tw:transition-transform tw:group-hover:translate-x-0.5" />
    </button>
  );
};

export default InviteToClub;
