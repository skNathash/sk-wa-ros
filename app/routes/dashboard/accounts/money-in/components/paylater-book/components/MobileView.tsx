import clsx from "clsx";
import { useTranslation } from "react-i18next";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import CommonService from "~/services/CommonService";
import type { PaylaterCustomer } from "../helper";
import CustomerAvatar from "./CustomerAvatar";
import UsedBar from "./UsedBar";

type MobileViewProps = {
  data: PaylaterCustomer[];
  emit: (action: string, item?: PaylaterCustomer) => void;
};

/**
 * Mobile read of the credit book: one white sheet bled to the screen edges
 * (`app-bleed-x`) with hairline-divided rows, so the customers read as a list
 * rather than a card. Limit and the labelled validity date fold under the name;
 * the right rail carries the drawn-limit bar. Tapping a row opens the
 * customer's book.
 */
const MobileView = ({ data, emit }: MobileViewProps) => {
  const { t } = useTranslation(["common"]);

  if (data.length === 0)
    return (
      <div className="app-bleed-x tw:border-y tw:border-gray-100 tw:bg-white">
        <NoData />
      </div>
    );

  return (
    <div className="app-bleed-x tw:divide-y tw:divide-gray-100 tw:border-y tw:border-gray-100 tw:bg-white">
      {data.map((item) => (
        <div
          key={item.id}
          /* An expired cycle is flagged on the row's left edge, so the list
             can be scanned for it without reading the date. */
          className={clsx(
            "tw:flex tw:items-center tw:gap-2.5 tw:px-4 tw:py-3 tw:active:bg-slate-50",
            item.overdue && "tw:border-l-4 tw:border-l-red-500",
          )}
          onClick={() => emit("details", item)}
        >
          <CustomerAvatar item={item} />
          <AppLink
            asLink
            noUnderline
            href={item.paylaterLink}
            className="tw:min-w-0 tw:flex-1"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800">
              {item.name}
            </div>
            {/* No column headers on mobile, so the date says what it is. */}
            <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
              {t("limit")} ₹{CommonService.formattedAmount(item.limit, 0)} ·{" "}
              {item.dueLine}
            </div>
          </AppLink>
          <UsedBar item={item} />
        </div>
      ))}
    </div>
  );
};

export default MobileView;
