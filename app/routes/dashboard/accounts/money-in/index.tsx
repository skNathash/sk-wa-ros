import { useCallback, useState } from "react";
import { useSearchParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useTheme from "~/hooks/useTheme";
import CommonService from "~/services/CommonService";
import {
  ACCOUNTS_SUB_TAB_PARAM,
  getAccountsSubTabKey,
} from "~/shared/accounts/components/accounts-tabs/helper";
import CollectionLanes from "./components/collection-lanes/CollectionLanes";
import { defaultLane, type LaneKey } from "./components/collection-lanes/helper";
import CollectionStats from "./components/collection-stats/CollectionStats";
import PaylaterBook from "./components/paylater-book/PaylaterBook";
import PaylaterStats from "./components/paylater-stats/PaylaterStats";
import RecentCollections from "./components/recent-collections/RecentCollections";
import WhoOwesYou from "./components/who-owes-you/WhoOwesYou";
import { allLanes } from "./components/who-owes-you/helper";

/**
 * Money in — the collections side of accounts, read top-down: what came in and
 * what is still owed, which lane it arrived through, who is holding money,
 * who is on the credit book, and finally the feed of what has just been
 * collected.
 *
 * Every block owns its own data through its `helper.ts`; the page only carries
 * the lane the lists are scoped to and the actions rows raise.
 */
const MoneyIn = () => {
  const appNav = useAppNav();
  const appToast = useAppToast();
  const isTheme2 = useTheme() === "theme-2";
  const [searchParams, setSearchParams] = useSearchParams();

  /* Theme-2 picks the lane from the accounts tab tray the layout renders above
     this page (all collections / B2C / B2B / paylater); everywhere else the
     lane cards are the only switch, so the page holds it itself. */
  const subTab = getAccountsSubTabKey(
    "/dashboard/accounts/money-in",
    searchParams.get(ACCOUNTS_SUB_TAB_PARAM),
  );
  const [localLane, setLocalLane] = useState<LaneKey>(defaultLane);

  /* "All collections" and the paylater book are read across both lanes. */
  const lane = isTheme2
    ? subTab === "B2C" || subTab === "B2B"
      ? subTab
      : allLanes
    : localLane;

  /* What each tray tab is for, block by block:
     - all      — the whole screen: lane comparison, receivables, feed
     - B2C/B2B  — one lane only, so the lane cards drop out and the tray is
                  the switch; receivables and the feed carry the lane
     - paylater — the credit book on its own, no lane cards, no receivables,
                  and its own totals in place of the collection stats */
  const view = isTheme2 ? subTab : "all";
  const isPaylaterView = view === "paylater";
  const showLanes = view === "all";
  const showReceivables = view !== "paylater";
  const showPaylaterBook = view === "all" || view === "paylater";
  const showRecentCollections = view !== "paylater";

  /* The lane cards stay tappable in theme-2 — they just write the tray's key
     instead of local state, so both switches read as the same control. */
  const handleLaneChange = useCallback(
    (next: LaneKey) => {
      if (!isTheme2) {
        setLocalLane(next);
        return;
      }
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set(ACCOUNTS_SUB_TAB_PARAM, next);
          return params;
        },
        { replace: true },
      );
    },
    [isTheme2, setSearchParams],
  );

  const handleReceivablesCallback = useCallback(
    (payload: { action: string; data?: any }) => {
      if (payload.action === "remind" || payload.action === "remindAll") {
        appToast.show({
          msg:
            payload.action === "remindAll"
              ? "Reminders queued for all open parties"
              : `Reminder queued for ${payload.data?.name}`,
          color: "success",
        });
      }
    },
    [appToast],
  );

  const handlePaylaterCallback = useCallback(
    (payload: { action: string; data?: any }) => {
      if (payload.action === "openPaylater") {
        appNav.to("/dashboard/paylater");
        return;
      }
      /* Straight to the party's own paylater tab — b2b or b2c, resolved from
         the party type when the row was formatted. */
      if (payload.action === "details" && payload.data?.paylaterLink) {
        appNav.to(payload.data.paylaterLink);
      }
    },
    [appNav],
  );

  return (
    <>
      {/* The stats row frames every tab except paylater, which is not read for
          a date range and carries its own credit-book totals instead. */}
      {isPaylaterView ? <PaylaterStats lane={allLanes} /> : <CollectionStats lane={lane} />}

      {showLanes && (
        <CollectionLanes activeLane={lane} onLaneChange={handleLaneChange} />
      )}

      {showReceivables && (
        <WhoOwesYou lane={lane} callback={handleReceivablesCallback} />
      )}

      {showPaylaterBook && (
        /* On its own tab the book is read across both lanes. */
        <PaylaterBook
          lane={isPaylaterView ? allLanes : lane}
          /* On the paylater tab the stats row above already carries the
             totals, so the header keeps just its title. */
          showSummary={!isPaylaterView}
          callback={handlePaylaterCallback}
        />
      )}

      {/* The receipts feed is read for a date range, not the lane. */}
      {showRecentCollections && <RecentCollections />}
    </>
  );
};

export default MoneyIn;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Money In"),
    },
  ];
}
