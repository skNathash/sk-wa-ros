import clsx from "clsx";
import React from "react";
import AppButton from "~/components/core/button/AppButton";
import AppPopover from "~/components/core/popover/AppPopover";
import {
  ChevronRight,
  Eye,
  Info,
  MoreHorizontal,
  Phone,
  User2,
} from "lucide-react";
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
  selectedCustomer?: {
    name?: string;
    mobile?: string;
    points?: number | null;
  } | null;
  onSwitch: () => void;
  className?: string;
}

const SwitchBlock: React.FC<Props> = ({
  typeLabel,
  customerType,
  quickCheckout,
  selectedRetailer,
  selectedCustomer,
  onSwitch,
  className,
}) => {
  return (
    <>
      <div
        className={clsx(
          /* `app-switch-block` is the styling seam — theme-2 desktop turns this
             card into a flat, full-bleed bar welded under the app header (see
             pos-billing.css). */
          "app-switch-block tw:flex tw:items-center tw:gap-2.5 tw:justify-between tw:bg-card tw:border tw:border-border tw:rounded-xl tw:shadow-sm tw:px-3 tw:py-2 tw:mb-3",
          className,
        )}
      >
        <div className="tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary/10 tw:text-primary">
          <User2 size={16} />
        </div>
        <div className="tw:flex-1 tw:min-w-0">
          <div className="tw:text-sm tw:font-semibold tw:text-foreground tw:flex tw:items-center tw:gap-1">
            {customerType === "b2b" ? (
              <span className="tw:line-clamp-1">{selectedRetailer?.name}</span>
            ) : (
              <span className="tw:line-clamp-1">{typeLabel}</span>
            )}
            <AppBadge className="tw:text-xs tw:uppercase" variant="primary">
              {customerType}
            </AppBadge>
            {quickCheckout && (
              <AppBadge className="tw:text-xs tw:uppercase" variant="warning">
                Quick Checkout
              </AppBadge>
            )}
          </div>

          {customerType !== "b2b" && selectedCustomer && (
            <div className="tw:flex tw:items-center tw:gap-2 tw:mt-0.5">
              <div className="tw:text-xs tw:text-muted-foreground tw:line-clamp-1">
                {selectedCustomer.name}
              </div>
              <div className="tw:text-xs tw:text-muted-foreground tw:flex tw:items-center tw:gap-1">
                <Phone size={12} className="tw:text-muted-foreground" />
                {selectedCustomer.mobile}
              </div>
            </div>
          )}

          {/* B2C/walk-in has no customer record to describe, so the second line
              says what that means for the bill instead of leaving the card a
              lone title. */}
          {customerType !== "b2b" && !selectedCustomer && (
            <div className="app-switch-sub tw:text-xs tw:text-muted-foreground tw:mt-0.5 tw:line-clamp-1">
              No customer attached · billing as walk-in
            </div>
          )}

          {customerType === "b2b" && (
            <div className="tw:flex tw:items-center tw:gap-2 tw:mt-0.5">
              <div className="tw:text-xs tw:text-muted-foreground tw:flex tw:items-center tw:gap-1">
                ID: {selectedRetailer?.franchiseId}
              </div>

              <div className="tw:text-xs tw:text-muted-foreground tw:flex tw:items-center tw:gap-1">
                <Phone size={12} className="tw:text-muted-foreground" />
                {selectedRetailer?.mobile}
              </div>
            </div>
          )}
        </div>
        <div>
          <AppButton
            onClick={onSwitch}
            size="small"
            className="tw:flex tw:items-center tw:gap-1.5"
          >
            <User2 size={16} />
            <span>Switch</span>
          </AppButton>
        </div>
      </div>
    </>
  );
};

export default SwitchBlock;
