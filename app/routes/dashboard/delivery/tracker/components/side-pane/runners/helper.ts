import CommonService from "~/services/CommonService";
import MarketplaceRunnerService from "~/services/MarketplaceRunnerService";
import type { PaginationState } from "~/types/CommonTypes";

/** The pane's filter bar, straight off the react-hook-form values. */
export interface RunnerFilter extends Record<string, any> {
  search: string;
}

/**
 * One runner row — a `deliveryAgent` group of the store's live shipments, so
 * the row is the runner plus everything they are carrying right now.
 */
export interface RunnerGroup extends Record<string, any> {
  id: string;
  agentName: string;
  agentMobile: string;
  /** Shipments the runner is carrying. */
  count: number;
  /** Display fields derived once in {@link formatRunnerGroup}. */
  _initials: string;
}

/** Build the grouped-shipment query — paging plus the pane's search. */
export const prepareParams = (
  filter: RunnerFilter,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { agentName: { $regex: search, $options: "i" } },
      { agentMobile: { $regex: search, $options: "i" } },
    ];
  }

  return params;
};

export async function getData(
  params: Record<string, any>,
): Promise<RunnerGroup[]> {
  const response = await MarketplaceRunnerService.getShipmentsByRunner(params);

  return (response?.data?.data?.groups || []).map(formatRunnerGroup);
}

/** Grouped responses count their groups, not their rows. */
export async function getCount(params: Record<string, any>): Promise<number> {
  const p: Record<string, any> = { ...params };
  delete p.page;
  delete p.limit;

  const response = await MarketplaceRunnerService.getShipmentsByRunner(p);

  return response?.data?.data?.summary?.totalGroups || 0;
}

/** Derive everything a runner row renders. */
function formatRunnerGroup(group: Record<string, any>): RunnerGroup {
  return {
    ...group,
    id: group._id,
    _initials: CommonService.prepareInitials(group.agentName),
  } as RunnerGroup;
}
