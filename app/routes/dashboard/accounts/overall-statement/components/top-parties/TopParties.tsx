import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { tintAt } from "~/components/core/tint/tints";
import useAccountsDateRange, {
  type AccountsDateRange,
} from "~/shared/accounts/hooks/useAccountsDateRange";
import {
  emptyTopParties,
  getTopPayers,
  getTopVendors,
  type TopParty,
} from "./helper";

type ListProps = {
  title: string;
  note: string;
  /** Fetcher for this list — the two halves load from separate endpoints. */
  fetcher: (range: AccountsDateRange) => Promise<TopParty[]>;
  /** Bar + amount tone: money in for payers, money out for vendors. */
  accent: string;
};

const PartyList = ({ title, note, fetcher, accent }: ListProps) => {
  const range = useAccountsDateRange();

  const [items, setItems] = useState<TopParty[]>(emptyTopParties);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: TopParty[];
      try {
        result = await fetcher(range);
      } catch (e) {
        result = emptyTopParties();
      }
      if (cancelled) return;
      setItems(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [fetcher, range]);

  return (
    <div className="tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">{title}</div>
        <div className="tw:text-[11px] tw:text-gray-500">{note}</div>
      </div>

      {loading ? (
        <div className="tw:p-6 tw:text-center">
          <AppSpinner />
        </div>
      ) : (
        <div>
          {items.map((item) => {
            const tint = tintAt(item._tintIndex);
            return (
              <div
                key={item.id}
                className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-2.5 tw:last:border-b-0"
              >
                <span
                  className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold"
                  style={{ background: tint.background, color: tint.ink }}
                >
                  {item._initial}
                </span>

                <AppLink
                  asLink
                  noUnderline
                  href={item.link}
                  className="tw:min-w-0 tw:flex-1"
                >
                  <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800">
                    {item.name}
                  </div>
                  <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                    {item.ref}
                  </div>
                </AppLink>

                <div className="tw:hidden tw:h-1.5 tw:w-24 tw:shrink-0 tw:overflow-hidden tw:rounded-full tw:bg-gray-200 tw:sm:block">
                  <div
                    className="tw:h-full tw:rounded-full"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: accent,
                    }}
                  />
                </div>

                <div
                  className="tw:shrink-0 tw:text-sm tw:font-bold"
                  style={{ color: accent }}
                >
                  <Amount value={item.amount} decimalPlaces={0} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Who paid us the most and who we paid the most, over the same window — the two
// halves of the counter-party story sit next to each other on desktop, each
// fed by its own endpoint so a slow list never holds up the other.
const TopParties = () => {
  const { t } = useTranslation(["common"]);

  return (
    <div className="tw:mb-3 tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
      <PartyList
        title={t("topPayers")}
        note={t("last30Days")}
        fetcher={getTopPayers}
        accent="var(--accent-in, #1f8a4f)"
      />
      <PartyList
        title={t("topVendorsPaid")}
        note={t("last30Days")}
        fetcher={getTopVendors}
        accent="var(--accent-out, #c85a1d)"
      />
    </div>
  );
};

export default TopParties;
