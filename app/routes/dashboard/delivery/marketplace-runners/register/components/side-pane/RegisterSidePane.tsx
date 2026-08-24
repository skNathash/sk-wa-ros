import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import useAppNav from "~/hooks/useAppNav";
import MyRunnersList from "./MyRunnersList";
import PendingSignupsList from "./PendingSignupsList";
import RunnerPaneChips from "./RunnerPaneChips";
import RunnerPaneHeader from "./RunnerPaneHeader";
import RunnerSearchBox from "./RunnerSearchBox";
import {
  filterRunners,
  getPaneRunners,
  getRunnerCounts,
  type PaneRunner,
  type RunnerChipKey,
} from "./helper";

const REGISTER_PATH = "/dashboard/delivery/marketplace-runners/register";

interface RegisterSidePaneProps {
  className?: string;
}

/**
 * The store's runner roster beside the registration form: who is working right
 * now, and which sign-ups were opened but never finished. The roster is loaded
 * once and the search box and chips narrow it in place, so the pane stays
 * quiet while the form beside it is being filled in.
 */
export default function RegisterSidePane({ className }: RegisterSidePaneProps) {
  const appNav = useAppNav();

  const [runners, setRunners] = useState<PaneRunner[]>();
  const [chip, setChip] = useState<RunnerChipKey>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");

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

  const counts = useMemo(() => getRunnerCounts(runners || []), [runners]);

  const visible = useMemo(
    () => filterRunners(runners || [], chip, search),
    [runners, chip, search],
  );

  const roster = visible.filter((runner) => !runner._isPending);
  const pending = visible.filter((runner) => runner._isPending);

  /**
   * Picking a sign-up back up: the registration is a real runner already, so
   * the flow reopens on that id rather than starting a fresh one.
   */
  const handleContinue = (runner: PaneRunner) =>
    appNav.to(REGISTER_PATH, { runnerId: runner._id });

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-3", className)}>
      <RunnerPaneHeader counts={counts} />

      <RunnerSearchBox value={search} onChange={setSearch} />

      <RunnerPaneChips
        activeKey={chip}
        counts={counts}
        onSelect={setChip}
        className="tw:px-1"
      />

      {!runners ? (
        <BusyLoader show={true} />
      ) : (
        <>
          <MyRunnersList
            runners={roster}
            activeId={selectedId}
            onSelect={(runner) => setSelectedId(runner._id)}
          />

          <PendingSignupsList runners={pending} onContinue={handleContinue} />
        </>
      )}
    </div>
  );
}
