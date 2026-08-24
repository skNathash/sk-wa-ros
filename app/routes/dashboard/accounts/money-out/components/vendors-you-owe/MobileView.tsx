import clsx from "clsx";
import { CreditCard, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import { billRows, termChip, VendorAvatar } from "./DesktopView";
import type { OwedVendor } from "./helper";

type MobileViewProps = {
  data: OwedVendor[];
  expanded: string | null;
  toggle: (item: OwedVendor) => void;
  emit: (action: string, item?: OwedVendor) => void;
};

/**
 * Mobile payables list: one white sheet bled to the screen edges (`app-bleed-x`)
 * with hairline-divided rows, so the vendors read as a list rather than a card.
 * Open bill count and the nearest due date fold under the name; the right rail
 * carries the balance, and chat / pay sit on their own line. Tapping a row opens
 * the bills that make up the balance.
 */
const MobileView = ({ data, expanded, toggle, emit }: MobileViewProps) => {
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
          <div
            className="tw:flex tw:items-center tw:gap-2.5 tw:px-4 tw:pt-3 tw:active:bg-slate-50"
            onClick={() => toggle(item)}
          >
            <VendorAvatar item={item} />
            <AppLink
              asLink
              noUnderline
              href={item.link}
              className="tw:min-w-0 tw:flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tw:flex tw:items-center tw:gap-1.5">
                <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800">
                  {item.name}
                </span>
                {termChip(item)}
              </div>
              <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                {t("openCount", { count: item.billCount })} · {item.dueLabel}
              </div>
            </AppLink>
            <div
              className={clsx(
                "tw:shrink-0 tw:text-sm tw:font-bold",
                item.overdue ? "tw:text-red-600" : "tw:text-gray-900",
              )}
            >
              <Amount value={item.owes} decimalPlaces={0} />
            </div>
          </div>

          {expanded === item.id && (
            <div className="tw:mt-3">{billRows(item)}</div>
          )}

          <div className="tw:flex tw:items-center tw:gap-2 tw:px-4 tw:py-3">
            <AppButton
              size="small"
              fill="outline"
              color="light"
              className="tw:flex-1"
              onClick={() => emit("chat", item)}
            >
              <MessageCircle size={14} />
              {t("chat")}
            </AppButton>
            <AppButton
              size="small"
              className="tw:flex-1"
              onClick={() => emit("pay", item)}
            >
              <CreditCard size={14} />
              {t("pay")}
            </AppButton>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
