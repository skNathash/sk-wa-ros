import clsx from "clsx";
import { ChevronDown, ChevronRight, CreditCard, MessageCircle } from "lucide-react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import { tintAt } from "~/components/core/tint/tints";
import type { TableHeaderItem } from "~/types/CommonTypes";
import { termChipClass } from "../../helper";
import type { OwedVendor } from "./helper";

type DesktopViewProps = {
  data: OwedVendor[];
  expanded: string | null;
  toggle: (item: OwedVendor) => void;
  emit: (action: string, item?: OwedVendor) => void;
};

const headers: TableHeaderItem[] = [
  { label: "", key: "expand", width: "4%" },
  { label: "Vendor", langKey: "vendor", key: "name", width: "28%" },
  { label: "Term", langKey: "term", key: "term", width: "12%" },
  { label: "Bills", langKey: "bills", key: "billCount", width: "12%" },
  {
    label: "You Owe",
    langKey: "youOwe",
    key: "owes",
    width: "14%",
    isRightAligned: true,
  },
  {
    label: "Due",
    langKey: "due",
    key: "due",
    width: "12%",
    isRightAligned: true,
  },
  {
    label: "Action",
    langKey: "action",
    key: "action",
    width: "18%",
    isRightAligned: true,
  },
];

export const VendorAvatar = ({ item }: { item: OwedVendor }) => {
  const tint = tintAt(item._tintIndex);
  return (
    <span
      className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold"
      style={{ background: tint.background, color: tint.ink }}
    >
      {item._initials}
    </span>
  );
};

export const termChip = (item: OwedVendor) => (
  <span
    className={clsx(
      "tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold",
      termChipClass(item.term),
    )}
  >
    {item.term}
  </span>
);

export const billRows = (item: OwedVendor) => (
  <div className="tw:bg-gray-50 tw:px-4 tw:py-2">
    {item.bills && item.bills.length > 0 ? (
      item.bills.map((bill) => (
        <div key={bill.id} className="tw:flex tw:items-center tw:gap-3 tw:py-1.5">
          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:truncate tw:text-xs tw:font-semibold tw:text-gray-700">
              {bill.ref}
            </div>
            <div className="tw:text-[11px] tw:text-gray-500">
              {bill.poRef ? `${bill.poRef} · ` : ""}{bill.dateLabel}
            </div>
          </div>
          <div
            className={clsx(
              "tw:shrink-0 tw:text-[11px]",
              bill.overdue
                ? "tw:font-semibold tw:text-red-600"
                : "tw:text-gray-500",
            )}
          >
            {bill.dueLabel}
          </div>
          <div className="tw:shrink-0 tw:text-xs tw:font-bold tw:text-gray-800">
            <Amount value={bill.amount} decimalPlaces={0} />
          </div>
        </div>
      ))
    ) : (
      <div className="tw:py-2 tw:text-xs tw:text-gray-500">
        {item.daysSinceLastTransaction !== undefined
          ? `Last transaction: ${item.daysSinceLastTransaction} days ago`
          : item.paymentMode ? `Payment mode: ${item.paymentMode}` : "No open bill details"}
      </div>
    )}
  </div>
);

const DesktopView = ({ data, expanded, toggle, emit }: DesktopViewProps) => {
  const { t } = useTranslation(["common"]);

  /* Nothing owed under the filter — the card already carries the white, so the
     empty read stands on its own without the table chrome. */
  if (data.length === 0) return <NoData />;

  return (
    <AppTable size="sm" fixedLayout>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {data.map((item) => (
          <Fragment key={item.id}>
            <AppTable.Row
              className="tw:cursor-pointer"
              onClick={() => toggle(item)}
            >
              <AppTable.Cell className="tw:text-gray-400">
                {expanded === item.id ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <VendorAvatar item={item} />
                  <div className="tw:min-w-0">
                    <AppLink
                      asLink
                      noUnderline
                      href={item.link}
                      className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800 hover:tw:text-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.name}
                    </AppLink>
                    <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                      {item.code}
                      {item.phone ? ` · ${item.phone}` : ""}
                    </div>
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>{termChip(item)}</AppTable.Cell>
              <AppTable.Cell className="tw:text-xs tw:text-gray-600">
                {t("openCount", { count: item.billCount })}
              </AppTable.Cell>
              <AppTable.Cell
                className={clsx(
                  "tw:text-right tw:text-sm tw:font-bold",
                  item.overdue ? "tw:text-red-600" : "tw:text-gray-900",
                )}
              >
                <Amount value={item.owes} decimalPlaces={0} />
              </AppTable.Cell>
              <AppTable.Cell
                className={clsx(
                  "tw:text-right tw:text-xs",
                  item.overdue
                    ? "tw:font-semibold tw:text-red-600"
                    : "tw:text-gray-500",
                )}
              >
                {item.dueLabel}
              </AppTable.Cell>
              <AppTable.Cell>
                <div
                  className="tw:flex tw:items-center tw:justify-end tw:gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AppButton
                    size="small"
                    fill="outline"
                    color="light"
                    onClick={() => emit("chat", item)}
                  >
                    <MessageCircle size={14} />
                  </AppButton>
                  <AppButton
                    size="small"
                    onClick={() => emit("pay", item)}
                  >
                    <CreditCard size={14} />
                    {t("pay")}
                  </AppButton>
                </div>
              </AppTable.Cell>
            </AppTable.Row>
            {expanded === item.id && (
              <AppTable.Row noHover>
                <AppTable.Cell colSpan={7} className="tw:p-0">
                  {billRows(item)}
                </AppTable.Cell>
              </AppTable.Row>
            )}
          </Fragment>
        ))}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
