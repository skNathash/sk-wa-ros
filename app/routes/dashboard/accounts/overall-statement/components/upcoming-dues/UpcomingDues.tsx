import { CreditCard, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import { tintAt } from "~/components/core/tint/tints";
import ListSkeleton from "~/shared/accounts/components/list-skeleton/ListSkeleton";
import useAccountsDateRange from "~/shared/accounts/hooks/useAccountsDateRange";
import type { TableHeaderItem } from "~/types/CommonTypes";
import {
  emptyUpcomingDues,
  getUpcomingDues,
  prepareParams,
  type UpcomingDue,
} from "./helper";

type UpcomingDuesProps = {
  /** How many dues to pull. */
  eventLimit?: number;
  /** Row actions bubble up; the page owns the pay / remind flows. */
  callback?: (payload: { action: string; data?: any }) => void;
};

const headers: TableHeaderItem[] = [
  { label: "Due", langKey: "due", key: "due", width: "14%" },
  { label: "Party", langKey: "party", key: "name", width: "32%" },
  { label: "Ref", langKey: "ref", key: "reference", width: "18%" },
  {
    label: "Amount",
    langKey: "amount",
    key: "amount",
    width: "14%",
    isRightAligned: true,
  },
  {
    label: "Action",
    langKey: "action",
    key: "action",
    width: "22%",
    isRightAligned: true,
  },
];

const PartyAvatar = ({ item }: { item: UpcomingDue }) => {
  const tint = tintAt(item._tintIndex);
  return (
    <span
      className="tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold"
      style={{ background: tint.background, color: tint.ink }}
    >
      {item._initial}
    </span>
  );
};

// What falls due in the window, soonest first — the one block on the screen
// that carries actions, since every row is something to settle.
const UpcomingDues = ({ eventLimit = 24, callback }: UpcomingDuesProps) => {
  const { t } = useTranslation(["common"]);
  const range = useAccountsDateRange();

  const [items, setItems] = useState<UpcomingDue[]>(emptyUpcomingDues);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: UpcomingDue[];
      try {
        result = await getUpcomingDues(prepareParams(range, eventLimit));
      } catch (e) {
        result = emptyUpcomingDues();
      }
      if (cancelled) return;
      setItems(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [range, eventLimit]);

  const emit = (action: string, item?: UpcomingDue) =>
    callback?.({ action, data: item });

  return (
    <div className="tw:mb-3 tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          {t("dueAmount")}
        </div>
        {/* <AppButton size="small" onClick={() => emit("payAll")}>
          <CreditCard size={14} />
          {t("payAll")}
        </AppButton> */}
      </div>

      {loading ? (
        <ListSkeleton bleed={false} />
      ) : items.length === 0 ? (
        <NoData />
      ) : (
        <>
          {/* Desktop: full table with the due / party / ref / amount columns. */}
          <div className="tw:hidden tw:md:block">
            <AppTable size="sm" fixedLayout>
              <AppTable.Header>
                <TableHeader headers={headers} />
              </AppTable.Header>
              <AppTable.Body>
                {items.map((item) => (
                  <AppTable.Row key={item.id}>
                    <AppTable.Cell>
                      <div className="tw:text-xs tw:font-semibold tw:text-gray-800">
                        {item.dueLabel}
                      </div>
                    </AppTable.Cell>
                    <AppTable.Cell>
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <PartyAvatar item={item} />
                        <div className="tw:min-w-0">
                          <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800">
                            {item.name}
                          </div>
                          <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                            {item.partyRef}
                          </div>
                        </div>
                      </div>
                    </AppTable.Cell>
                    <AppTable.Cell className="tw:text-xs tw:text-gray-500">
                      {item.reference}
                    </AppTable.Cell>
                    <AppTable.Cell className="tw:text-right">
                      <Amount
                        value={item.amount}
                        decimalPlaces={0}
                        className="tw:text-sm tw:font-bold tw:text-gray-900"
                      />
                    </AppTable.Cell>
                    <AppTable.Cell>
                      <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
                        <AppButton
                          size="small"
                          fill="outline"
                          color="light"
                          onClick={() => emit("remind", item)}
                        >
                          <MessageCircle size={14} />
                          {t("remind")}
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
                ))}
              </AppTable.Body>
            </AppTable>
          </div>

          {/* Mobile: the same rows stacked, actions on their own line. */}
          <div className="tw:md:hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className="tw:border-t tw:border-gray-100 tw:px-4 tw:py-3"
              >
                <div className="tw:flex tw:items-center tw:gap-2.5">
                  <PartyAvatar item={item} />
                  <div className="tw:min-w-0 tw:flex-1">
                    <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800">
                      {item.name}
                    </div>
                    <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                      {item.reference} · {item.dueLabel}
                    </div>
                  </div>
                  <div className="tw:shrink-0 tw:text-right">
                    <Amount
                      value={item.amount}
                      decimalPlaces={0}
                      className="tw:text-sm tw:font-bold tw:text-gray-900"
                    />
                  </div>
                </div>

                <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2">
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
                    onClick={() => emit("pay", item)}
                  >
                    <CreditCard size={14} />
                    {t("pay")}
                  </AppButton>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UpcomingDues;
