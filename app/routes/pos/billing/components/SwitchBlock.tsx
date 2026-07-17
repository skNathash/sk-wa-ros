import clsx from "clsx";
import React from "react";
import { Phone, Repeat, User2 } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";

interface Props {
  typeLabel: string;
  customerType?: string | null;
  quickCheckout?: boolean;
  selectedRetailer?: {
    name?: string;
    franchiseId?: string;
    mobile?: string;
  } | null;
  onSwitch: () => void;
  className?: string;
}

const SwitchBlock: React.FC<Props> = ({
  typeLabel,
  customerType,
  quickCheckout,
  selectedRetailer,
  onSwitch,
  className,
}) => {
  return (
    <>
      <div
        className={clsx(
          "tw:flex tw:items-center tw:gap-2.5 tw:justify-between tw:bg-card tw:border tw:border-border tw:rounded-xl tw:shadow-sm tw:px-3 tw:py-2.5 tw:mb-3",
          className,
        )}
      >
        <div className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary/10 tw:text-primary">
          <User2 size={17} />
        </div>
        <div className="tw:flex-1 tw:min-w-0">
          <div className="tw:text-sm tw:font-semibold tw:text-foreground tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
            {customerType === "b2b" ? (
              <span className="tw:line-clamp-1">{selectedRetailer?.name}</span>
            ) : (
              <span className="tw:line-clamp-1">{typeLabel}</span>
            )}
            <span className="wa-incart tw:rounded-full tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:bg-primary/10 tw:text-primary">
              {customerType}
            </span>
            {quickCheckout && (
              <AppBadge className="tw:text-xs tw:uppercase" variant="warning">
                Quick Checkout
              </AppBadge>
            )}
          </div>

          {customerType === "b2b" && (
            <div className="tw:flex tw:items-center tw:gap-2 tw:mt-1 tw:flex-wrap">
              <div className="wa-mono tw:text-[11px] tw:text-muted-foreground tw:flex tw:items-center tw:gap-1">
                ID: {selectedRetailer?.franchiseId}
              </div>

              <div className="wa-mono tw:text-[11px] tw:text-muted-foreground tw:flex tw:items-center tw:gap-1">
                <Phone size={11} className="tw:text-muted-foreground" />
                {selectedRetailer?.mobile}
              </div>
            </div>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={onSwitch}
            className="tw:flex tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:border-border tw:bg-muted tw:px-3 tw:py-1.5 tw:text-xs tw:font-bold tw:text-foreground tw:cursor-pointer tw:transition-colors tw:hover:border-primary tw:hover:text-primary"
          >
            <Repeat size={13} />
            <span>Switch</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SwitchBlock;
