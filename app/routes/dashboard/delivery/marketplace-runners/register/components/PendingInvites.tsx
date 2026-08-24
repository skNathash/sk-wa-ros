import { useEffect, useMemo, useState } from "react";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import useAppNav from "~/hooks/useAppNav";
import PendingSignupsList from "./side-pane/PendingSignupsList";
import {
  filterRunners,
  getPaneRunners,
  type PaneRunner,
} from "./side-pane/helper";

const REGISTER_PATH = "/dashboard/delivery/marketplace-runners/register";

/**
 * The "Pending" tab of the register screen — the sign-ups that were opened but
 * never finished, so the store can pick each one back up where it stopped.
 * Mirrors the desktop side pane's pending section for the mobile tab bar.
 */
export default function PendingInvites() {
  const appNav = useAppNav();
  const [runners, setRunners] = useState<PaneRunner[]>();

  useEffect(() => {
    let cancelled = false;

    getPaneRunners()
      .then((result) => {
        if (!cancelled) setRunners(result);
      })
      .catch(() => {
        if (!cancelled) setRunners([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const pending = useMemo(
    () => filterRunners(runners || [], "pending", ""),
    [runners],
  );

  const handleContinue = (runner: PaneRunner) =>
    appNav.to(REGISTER_PATH, { runnerId: runner._id });

  if (!runners) {
    return (
      <AppCard className="tw:relative tw:min-h-40">
        <BusyLoader show />
      </AppCard>
    );
  }

  if (pending.length === 0) {
    return (
      <NoData
        title="No pending sign-ups"
        description="Any runner who starts registering but doesn't finish will show up here to pick up where they left off."
      />
    );
  }

  return (
    <AppCard
      title="Pending invitations"
      subtitle="Sign-ups the store opened but never finished — continue where they stopped."
    >
      <PendingSignupsList runners={pending} onContinue={handleContinue} />
    </AppCard>
  );
}
