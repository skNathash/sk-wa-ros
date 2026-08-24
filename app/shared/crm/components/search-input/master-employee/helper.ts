import MasterEmpService from "~/services/MasterEmpService";

// Abort the previous request so fast typing doesn't race stale responses onto
// the dropdown.
let abortController: AbortController | null = null;

// Fetch a page of master employees, optionally filtered by a free-text query.
// The query is matched server-side across name / mobile / reference id.
export const getData = async (
  query: string,
  page: number,
  options?: { params?: Record<string, any> },
) => {
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();

  const filter: Record<string, any> = { ...(options?.params?.filter || {}) };
  const search = query?.trim();
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { mobile: search },
      { referenceId: search },
    ];
  }

  const response = await MasterEmpService.getEmployees(
    {
      page,
      count: 10,
      sort: { name: 1 },
      ...(options?.params || {}),
      filter,
    },
    { signal: abortController.signal },
  );

  return (response?.data?.data || []).map((item: any) => ({
    label: item.name,
    value: {
      // `refId` is the employee's own Mongo id, used to scope follow-up filters
      // (matches the `employee.refId` path on follow-up records).
      id: item._id,
      refId: item._id,
      name: item.name,
      mobile: item.mobile,
      referenceId: item.referenceId,
      email: item.email,
    },
  }));
};
