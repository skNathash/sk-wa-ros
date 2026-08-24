import { CreditCard, MessageCircle, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import { PartyAvatar } from "./DesktopView";
import type { OwingParty } from "./helper";

type MobileViewProps = {
  data: OwingParty[];
  emit: (action: string, item?: OwingParty) => void;
};

/**
 * Mobile owing list: one white sheet bled to the screen edges (`app-bleed-x`)
 * with hairline-divided rows, so the parties read as a list rather than a card.
 * Type, open count and the age of the oldest invoice fold under the name; the
 * right rail carries the balance, and remind / record sit on their own line.
 */
const MobileView = ({ data, emit }: MobileViewProps) => {
  const { t } = useTranslation(["common"]);

  /* The empty read keeps the sheet — white, bled and ruled like the rows it
     stands in for — so the block does not collapse to bare page background. */
  if (data.length === 0)
    return (
      <div className="app-bleed-x tw:border-y tw:border-gray-100 tw:bg-white">
        <NoData />
      </div>
    );

  return (
    <div className="app-bleed-x tw:divide-y tw:divide-gray-100 tw:border-y tw:border-gray-100 tw:bg-white">
      {data.map((item) => (
        <div key={item.id}>
          <div className="tw:flex tw:items-center tw:gap-2.5 tw:px-4 tw:pt-3">
            <PartyAvatar item={item} />
            <AppLink
              asLink
              noUnderline
              href={item.link}
              className="tw:min-w-0 tw:flex-1"
            >
              <div className="tw:flex tw:items-center tw:gap-1.5">
                <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800">
                  {item.name}
                </span>
              </div>
              <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                {item.typeLabel}
                {item.invoiceCount > 0 &&
                  ` · ${t("openCount", { count: item.invoiceCount })}`}
                {item.oldestLabel && ` · ${item.oldestLabel}`}
              </div>
            </AppLink>
            <div className="tw:shrink-0 tw:text-sm tw:font-bold tw:text-gray-900">
              <Amount value={item.owes} decimalPlaces={0} />
            </div>
          </div>

          <div className="tw:flex tw:items-center tw:gap-2 tw:px-4 tw:py-3">
            {/* Dial sits as an icon-only square so remind / record keep the
                width they had; parties with no number on file skip it. */}
            {item.mobile && (
              <AppLink asLink href={`tel:${item.mobile}`}>
                <AppButton size="small" fill="outline" color="light">
                  <Phone size={14} />
                </AppButton>
              </AppLink>
            )}
            <AppButton
              size="small"
              fill="outline"
              color="light"
              className="tw:flex-1"
              onClick={() => emit("remind", item)}
            >
              <MessageCircle size={14} />
              {t("remind")}
            </AppButton>
            <AppButton
              size="small"
              className="tw:flex-1"
              onClick={() => emit("record", item)}
            >
              <CreditCard size={14} />
              {t("record")}
            </AppButton>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
