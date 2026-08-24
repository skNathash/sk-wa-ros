import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";
import FilledBinList from "../../../../components/filled-bin-list/FilledBinList";
import { buildFilledBinList, type FilledBinListItem } from "../../../../helper";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

type Props = {
  /** Location scope of the bin on screen — "L1" sellable, "L2" non-sellable. */
  locationId: string;
  /** Bin the page is on; highlighted in the list. */
  binId: string;
};

/**
 * Side-pane bin switcher for the bin view. Same list the godown grid puts in
 * its pane (see the rack-bin index route), except a row navigates to that
 * bin's view instead of scrolling the grid — so the pane works as the bin
 * navigator while the main column shows one bin.
 */
const BinListPane = ({ locationId, binId }: Props) => {
  const { t } = useTranslation();
  const appNav = useAppNav();

  const [bins, setBins] = useState<FilledBinListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const fid = AuthService.getLoggedInUserId() || "";
      const [config, summary] = await Promise.all([
        RackBinService.getRackBinConfig(fid, locationId, {}),
        RackBinService.getBinSummary(fid, locationId, {}),
      ]);

      if (cancelled) return;

      setBins(
        buildFilledBinList(
          config.data?.data?.racks || [],
          summary?.data?.data || [],
        ),
      );
      setLoading(false);
    };

    if (locationId) load();

    return () => {
      cancelled = true;
    };
  }, [locationId]);

  return (
    <>
      {/* Pane header — section title + scope label, matching the godown pane. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:px-1 tw:mb-3">
        <PaneTitle title={t("bins", { defaultValue: "Bins" })} />
        <span className="tw:text-sm tw:text-slate-400">{t("godown")}</span>
      </div>

      <FilledBinList
        bins={bins}
        loading={loading && bins.length === 0}
        activeBinId={binId}
        callback={(bin) =>
          appNav.to(`/dashboard/inventory/rack-bin/bin/view/${bin.binId}`)
        }
      />
    </>
  );
};

export default BinListPane;
