import VendorService from "~/services/VendorService";

const getVendor = async (params: Record<string, any>) => {
  // Use incoming params so search and pagination are respected
  const response = await VendorService.getDashboardVendorList(params);
  return (response.data.data || []).map((item: any) => ({
    id: item._id,
    name: item.name,
    formattedAddress: item._fullAddress,
    gstNumber: item.gstNumber,
    mobile: item.mobile,
    email: item.email,
  }));
};

const getVendorCount = async (params: Record<string, any>) => {
  // Prepare count params. Backend expects outputType=count and usually
  // pagination/sort removed for count-only calls.
  const countParams: Record<string, any> = { ...params, outputType: "count" };

  // remove pagination and sort if present
  delete countParams.page;
  delete countParams.count;
  delete countParams.sort;

  const response = await VendorService.getDashboardVendorList(countParams);
  return response.data?.count || 0;
};

export const getData = async (type: string, params: Record<string, any>) => {
  if (type === "vendor") {
    return await getVendor(params);
  }
  return [];
};

export const getCount = async (type: string, params: Record<string, any>) => {
  if (type === "vendor") {
    return await getVendorCount(params);
  }
  return 0;
};

// Prepare params for vendor type
export const prepareVendorParams = (
  params: Record<string, any>,
  paginationRef: { current: { activePage: number; rowsPerPage: number } }
) => {
  const p: Record<string, any> = {
    page: paginationRef.current?.activePage || 1,
    count: paginationRef.current?.rowsPerPage || 10,
    sort: { name: 1 },
    filter: {},
  };

  const search = params?.search?.toString()?.trim();
  if (search) {
    p.search = search;
    const orFilters: any[] = [
      { vendorId: search },
      { name: { $regex: search, $options: "i" } },
      { "contact.email": { $regex: search, $options: "i" } },
    ];
    if (!isNaN(Number(search))) {
      orFilters.splice(2, 0, { "contact.mobile": search });
    }
    p.filter.$or = orFilters;
  }

  // Clean up empty filter
  if (!Object.keys(p.filter).length) {
    delete p.filter;
  }

  return p;
};

// Dispatcher based on type
export const prepareParams = (
  type: string,
  params: Record<string, any>,
  paginationRef: { current: { activePage: number; rowsPerPage: number } }
) => {
  if (type === "vendor") {
    return prepareVendorParams(params, paginationRef);
  }
  // default fallback
  return {
    ...params,
    page: paginationRef.current?.activePage || 1,
    count: paginationRef.current?.rowsPerPage || 10,
  };
};
