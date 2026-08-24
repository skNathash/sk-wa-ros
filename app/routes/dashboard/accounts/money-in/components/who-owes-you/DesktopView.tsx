import clsx from "clsx";
import { CreditCard, MessageCircle, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import { tintAt } from "~/components/core/tint/tints";
import type { TableHeaderItem } from "~/types/CommonTypes";
import type { OwingParty } from "./helper";

type DesktopViewProps = {
  data: OwingParty[];
  emit: (action: string, item?: OwingParty) => void;
};

const headers: TableHeaderItem[] = [
  { label: "Party", langKey: "party", key: "name", width: "32%" },
  { label: "Type", langKey: "type", key: "typeLabel", width: "12%" },
  { label: "Invoices", langKey: "invoices", key: "invoiceCount", width: "12%" },
  {
    label: "Owes",
    langKey: "owes",
    key: "owes",
    width: "12%",
    isRightAligned: true,
  },
  {
    label: "Oldest",
    langKey: "oldest",
    key: "oldest",
    width: "12%",
    isRightAligned: true,
  },
  {
    label: "Action",
    langKey: "action",
    key: "action",
    width: "20%",
    isRightAligned: true,
  },
];

/** Party initials on their own tint — the row's anchor at both widths. */
export const PartyAvatar = ({ item }: { item: OwingParty }) => {
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

const DesktopView = ({ data, emit }: DesktopViewProps) => {
  const { t } = useTranslation(["common"]);

  /* Nothing owed on this lane — the card already carries the white, so the
     empty read stands on its own without the table chrome. */
  if (data.length === 0) return <NoData />;

  return (
    <AppTable size="sm" fixedLayout>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {data.map((item) => (
          <AppTable.Row key={item.id}>
            <AppTable.Cell>
              <div className="tw:flex tw:items-center tw:gap-2">
                <PartyAvatar item={item} />
                <AppLink
                  asLink
                  noUnderline
                  href={item.link}
                  className="tw:min-w-0"
                >
                  <div className="tw:flex tw:items-center tw:gap-1.5">
                    <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800">
                      {item.name}
                    </span>
                    {item.paylater && (
                      <span className="tw:rounded tw:bg-amber-50 tw:px-1 tw:text-[10px] tw:font-bold tw:text-amber-700">
                        {t("plShort")}
                      </span>
                    )}
                  </div>
                </AppLink>
              </div>
            </AppTable.Cell>
            <AppTable.Cell className="tw:text-xs tw:text-gray-600">
              {item.typeLabel}
            </AppTable.Cell>
            <AppTable.Cell className="tw:text-xs tw:text-gray-600">
              {t("openCount", { count: item.invoiceCount })}
            </AppTable.Cell>
            <AppTable.Cell className="tw:text-right tw:text-sm tw:font-bold tw:text-gray-900">
              <Amount value={item.owes} decimalPlaces={0} />
            </AppTable.Cell>
            <AppTable.Cell
              className={clsx(
                "tw:text-right tw:text-xs",
                item.overdue
                  ? "tw:font-semibold tw:text-amber-600"
                  : "tw:text-gray-500",
              )}
            >
              {item.oldestLabel}
            </AppTable.Cell>
            <AppTable.Cell>
              <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
                {/* Only parties with a number on file carry the dial action. */}
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
                  onClick={() => emit("remind", item)}
                >
                  <MessageCircle size={14} />
                </AppButton>
                <AppButton size="small" onClick={() => emit("record", item)}>
                  <CreditCard size={14} />
                  {t("record")}
                </AppButton>
              </div>
            </AppTable.Cell>
          </AppTable.Row>
        ))}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
