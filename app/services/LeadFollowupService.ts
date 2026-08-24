import { formatDistanceToNowStrict } from "date-fns";
import { merge } from "lodash";
import { API } from "~/constants";
import AjaxService from "./AjaxService";
import StorageService from "./StorageService";

/**
 * Service for the CRM lead follow-up dashboard.
 * Endpoint: employee/lead-followup/list
 */
class LeadFollowupService {
  /**
   * Build the axios config that authenticates with the master employee token
   * (`_et`) rather than the franchise token AjaxService attaches by default.
   * All lead-followup requests run under a master login, so they must use this.
   * Returns `undefined` when no master token is present so AjaxService falls
   * back to its default behaviour.
   */
  private static masterAuthConfig() {
    const masterToken = StorageService.get<string>("_et");
    return masterToken
      ? { headers: { Authorization: `JWT ${masterToken}` } }
      : undefined;
  }

  /**
   * Fetch the paginated lead follow-up list.
   * Response shape: { success, data: [...], pagination: { total, ... } }
   */
  static async getList(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}employee/lead-followup/list`,
      "GET",
      params,
      this.masterAuthConfig(),
    );
  }

  /**
   * Fetch only the count for a set of filters by passing outputType: "count".
   * Returns `{ count }`, reading the total from response.data.count.
   */
  static async getListCount(params?: Record<string, any>) {
    const response = await AjaxService.request(
      `${API}employee/lead-followup/list`,
      "GET",
      {
        ...params,
        outputType: "count",
      },
      this.masterAuthConfig(),
    );
    return { count: response?.data?.count ?? 0 };
  }

  /**
   * The follow-up type that tags a "store note". Notes and follow-ups share the
   * same lead-followup collection and endpoint; `followType` is what separates
   * them — notes are `followType === "NOTE"`, follow-ups are everything else.
   */
  static readonly NOTE_FOLLOW_TYPE = "NOTE";

  /**
   * The follow-up type that tags a scheduled follow-up (as opposed to a plain
   * note). In the unified activity feed these rows get a distinct card.
   */
  static readonly FOLLOWUP_FOLLOW_TYPE = "FOLLOWUP";

  /**
   * Read the follow-type tag off a row. The collection is written with two
   * different keys depending on the entry path (`followType` for follow-ups,
   * `followupType` for notes), so both are checked.
   */
  static getRowFollowType(row: any): string {
    return row?.followType || row?.followupType || "";
  }

  /** True when a row is a plain store note (followType === "NOTE"). */
  static isNoteRow(row: any): boolean {
    return this.getRowFollowType(row) === this.NOTE_FOLLOW_TYPE;
  }

  /** True when a row is a scheduled follow-up (followType === "FOLLOWUP"). */
  static isFollowUpRow(row: any): boolean {
    return this.getRowFollowType(row) === this.FOLLOWUP_FOLLOW_TYPE;
  }

  /**
   * Merge the `followType` constraint that splits the shared lead-followup list
   * into follow-ups vs. notes, preserving any other filter keys and top-level
   * params (page / count / sort). `isNote` picks which slice to match.
   */
  private static withFollowTypeFilter(
    params: Record<string, any> | undefined,
    isNote: boolean,
  ): Record<string, any> {
    // Deep-merge into a fresh object so the caller's params (and their nested
    // filter) are left untouched.
    return merge({}, params, {
      filter: {
        followType: isNote
          ? this.NOTE_FOLLOW_TYPE
          : { $ne: this.NOTE_FOLLOW_TYPE },
      },
    });
  }

  /**
   * Fetch the follow-up list — everything in the lead-followup collection that
   * is *not* a note. Applies the `followType: { $ne: "NOTE" }` filter on top of
   * the caller's params.
   */
  static async getFollowups(params?: Record<string, any>) {
    return this.getList(this.withFollowTypeFilter(params, false));
  }

  /** Count of follow-ups (notes excluded) for the given filters. */
  static async getFollowupsCount(params?: Record<string, any>) {
    return this.getListCount(this.withFollowTypeFilter(params, false));
  }

  /**
   * Fetch the notes list — lead-followup rows tagged `followType: "NOTE"`.
   * Applies the note filter on top of the caller's params.
   */
  static async getNotes(params?: Record<string, any>) {
    return this.getList(this.withFollowTypeFilter(params, true));
  }

  /** Count of notes for the given filters. */
  static async getNotesCount(params?: Record<string, any>) {
    return this.getListCount(this.withFollowTypeFilter(params, true));
  }

  /**
   * Fetch the unified activity list — every lead-followup row (notes *and*
   * follow-ups) with NO followType filter applied. This is the source for the
   * retailer's Activity timeline, which renders a distinct card for follow-up
   * rows (followType === "FOLLOWUP") and a note card for the rest.
   */
  static async getActivity(params?: Record<string, any>) {
    return this.getList(params);
  }

  /** Count of the unified activity list (notes + follow-ups), no followType. */
  static async getActivityCount(params?: Record<string, any>) {
    return this.getListCount(params);
  }

  /**
   * Fetch the grouped follow-up summary (one row per franchise or per employee).
   * Endpoint: employee/lead-followup/summary
   *
   * `groupBy` selects the grouping dimension ("franchise" | "employee"); the
   * endpoint paginates with `page` + `limit` and returns the rows at
   * `data.data` with the total at `data.pagination.total`.
   */
  static async getGroupedSummary(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}employee/lead-followup/summary`,
      "GET",
      params,
      this.masterAuthConfig(),
    );
  }

  /**
   * Flatten a grouped-summary row's `totalFollowups` + `statusBreakdown` block
   * into the status counts the summary tables render.
   */
  static formatSummaryCounts(row: any): {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    escalated: number;
    overdue: number;
  } {
    const status = row?.statusBreakdown || {};
    return {
      total: Number(row?.totalFollowups ?? 0),
      open: Number(status.Open ?? 0),
      inProgress: Number(status.InProgress ?? 0),
      completed: Number(status.Completed ?? 0),
      escalated: Number(status.Escalated ?? 0),
      overdue: Number(status.Overdue ?? 0),
    };
  }

  /**
   * Fetch a single employee's details by id.
   * Endpoint: employee/{id}
   */
  static async getEmployeeById(id: string, params?: Record<string, any>) {
    return AjaxService.request(
      `${API}employee/${id}`,
      "GET",
      params,
      this.masterAuthConfig(),
    );
  }

  /**
   * Create a lead follow-up entry.
   * Endpoint: employee/lead-followup/add
   *
   * This runs under a master login, so authenticate with the master employee
   * token (`_et`) rather than the franchise token that AjaxService attaches by
   * default.
   */
  static async add(payload: Record<string, any>) {
    return AjaxService.request(
      `${API}employee/lead-followup/add`,
      "POST",
      payload,
      this.masterAuthConfig(),
    );
  }

  /**
   * Update an existing lead follow-up entry (e.g. mark it as closed).
   * Endpoint: employee/lead-followup/:id
   *
   * Like `add`, this runs under a master login, so authenticate with the master
   * employee token (`_et`) rather than the default franchise token.
   */
  static async update(leadId: string, payload: Record<string, any>) {
    return AjaxService.request(
      `${API}employee/lead-followup/${leadId}`,
      "PUT",
      payload,
      this.masterAuthConfig(),
    );
  }

  /**
   * The follow-up interaction types with their display label and badge color key.
   */
  static getTypes(): Array<{
    label: string;
    value: string;
    typeColor: string;
  }> {
    return [
      // Only "Followup" is offered for now; the other types are kept here
      // commented out in case they need to be re-enabled later.
      // { label: "Onboarding", value: "Onboarding", typeColor: "primary" },
      // { label: "Activation", value: "Activation", typeColor: "success" },
      { label: "Followup", value: "Followup", typeColor: "secondary" },
    ];
  }

  static getTypeColor(type: string): string {
    const typeObj = this.getTypes().find((t) => t.value === type);
    // Return the color if found, default to the neutral badge color
    return typeObj?.typeColor ?? "default";
  }

  static getTypeLabel(type: string): string {
    const typeObj = this.getTypes().find((t) => t.value === type);
    // Return the label if found, default to the raw type
    return typeObj?.label ?? type;
  }

  /**
   * The follow-up statuses with their display label and badge color key.
   * "Completed" is the terminal state — a follow-up in any other status can
   * still be closed.
   */
  static getStatuses(): Array<{
    value: string;
    label: string;
    statusColor: string;
  }> {
    return [
      { value: "Open", label: "Open", statusColor: "warning" },
      { value: "InProgress", label: "In Progress", statusColor: "primary" },
      { value: "Completed", label: "Closed", statusColor: "success" },
    ];
  }

  /**
   * The follow-up statuses as { label, value } option pairs for dropdowns and
   * filters. Derived from `getStatuses` so there's a single source of truth.
   */
  static getStatusList(): Array<{ label: string; value: string }> {
    return this.getStatuses().map(({ label, value }) => ({ label, value }));
  }

  static getStatusColor(status: string): string {
    const statusObj = this.getStatuses().find((s) => s.value === status);
    // Return the color if found, default to secondary
    return statusObj?.statusColor ?? "secondary";
  }

  static getStatusLabel(status: string): string {
    const statusObj = this.getStatuses().find((s) => s.value === status);
    // Return the label if found, default to the raw status
    return statusObj?.label ?? status;
  }

  /**
   * A follow-up is "due" (overdue) when its scheduled date-time has already
   * passed and it is not yet closed. The cutoff is the exact current moment, so
   * a follow-up scheduled earlier today is overdue too — matching the Overdue
   * tile count and the NextFollowUpChip badge.
   */
  static isFollowupDue(row: any): boolean {
    if (!row?.followUpDateTime) return false;
    if (row.status === "Completed") return false;
    const followUpTime = new Date(row.followUpDateTime).getTime();
    if (Number.isNaN(followUpTime)) return false;
    return followUpTime < Date.now();
  }

  /**
   * A compact "how long overdue" label for a due follow-up, e.g. "2 days ago".
   * Returns an empty string when the row isn't due or has no valid date.
   */
  static getOverdueLabel(row: any): string {
    if (!this.isFollowupDue(row)) return "";
    const date = new Date(row.followUpDateTime);
    if (Number.isNaN(date.getTime())) return "";
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }

  /**
   * The Mongo filter that matches "due" (a.k.a. overdue) follow-ups: not yet
   * closed and scheduled for a moment that has already passed. The cutoff is the
   * exact current time, so follow-ups scheduled earlier today are included too.
   *
   * This is the single source of truth for the "due" definition so the Overdue
   * tile count, this filter and the per-row `_isFolloupDue` badge always agree
   * (see `isFollowupDue`).
   */
  static getDueFilter(): Record<string, any> {
    return {
      status: { $ne: "Completed" },
      // Anything scheduled before "now" is overdue — including earlier today.
      // `$lte` is used because the backend's date filters rely on it (a bare
      // `$lt` is not matched server-side).
      followUpDateTime: { $lte: new Date().toISOString() },
    };
  }

  /**
   * Decorate follow-up rows with the resolved status label and color key so the
   * views can render the badge without owning any status-to-color mapping.
   * `_isFolloupDue` flags rows whose follow-up date has lapsed and are still open.
   * `_canClose` is true while the follow-up isn't yet "Completed".
   */
  static formatFollowupResponse(rows: any[]): any[] {
    return (rows || []).map((row) => ({
      ...row,
      _statusLabel: this.getStatusLabel(row.status || ""),
      _statusColor: this.getStatusColor(row.status || ""),
      _typeLabel: this.getTypeLabel(row.type || ""),
      _typeColor: this.getTypeColor(row.type || ""),
      _isFolloupDue: this.isFollowupDue(row),
      _overdueLabel: this.getOverdueLabel(row),
      _canClose: row.status !== "Completed",
      // 1-2 letter avatar initial, derived once here so views can render the
      // retailer avatar without recomputing it per render.
      initial: this.getInitials(
        row.franchiseName || row.employee?.name || row.assignedTo?.name,
      ),
    }));
  }

  /**
   * Decorate unified activity rows (notes + follow-ups) for the retailer's
   * Activity timeline. Reuses the follow-up decorations and adds `_isNote` /
   * `_isFollowUp` flags so the view can pick the right card per row without
   * re-deriving the follow-type each render.
   */
  static formatActivityResponse(rows: any[]): any[] {
    return this.formatFollowupResponse(rows).map((row) => ({
      ...row,
      _isNote: this.isNoteRow(row),
      _isFollowUp: this.isFollowUpRow(row),
      // Author initial (notes carry the employee; follow-ups the assignee).
      initial: this.getInitials(
        row.employee?.name || row.assignedTo?.name || row.franchiseName,
      ),
    }));
  }

  // Build a 1-2 letter avatar initial from a name (e.g. "Sri Mart" → "SM").
  static getInitials(name?: string): string {
    if (!name) return "?";
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  }
}

export default LeadFollowupService;
