import CustomerService from "~/services/CustomerService";
import FranchiseService from "~/services/FranchiseService";
import VendorService from "~/services/VendorService";
import AccountService from "./AccountService";
import AuthService from "./AuthService";

class RecordPaymentService {
  static formatAddress(
    city: string,
    district: string,
    state: string,
    pincode: string
  ) {
    return [city, district, state]
      .filter((p) => p?.trim?.())
      .join(", ")
      .concat(pincode ? ` - ${String(pincode).trim()}` : "");
  }

  static formatCustomeResponse(data: any) {
    return data.map((e: any) => {
      return {
        label: e.name,
        value: {
          id: e._id,
          name: e.name,
          type: "customer",
          refId: e.referenceId,
          city: e.address?.city,
          district: e.address?.district,
          state: e.address?.state,
          pincode: e.address?.pincode,
          formattedAddress: this.formatAddress(
            e.address?.city,
            e.address?.district,
            e.address?.state,
            e.address?.pincode
          ),
          mobile: e.mobile,
        },
      };
    });
  }

  static formatVendorResponse(data: any) {
    return data.map((e: any) => {
      return {
        label: e.name,
        value: {
          id: e._id,
          name: e.name,
          type: "vendor",
          refId: e.vendorId,
          mobile: e.mobile,
          district: e.address?.district,
          state: e.address?.state,
          pincode: e.address?.pincode,
          formattedAddress: this.formatAddress(
            e.address?.city,
            e.address?.district,
            e.address?.state,
            e.address?.pincode
          ),
          _vendorType: e._vendorType || "",
          _vendorTypeColor: e._vendorTypeColor || "",
          _vendorTypeInfo: e._vendorTypeInfo || "",
          vendorType: e.vendorType,
        },
      };
    });
  }

  static formatFranchiseResponse(data: any) {
    return data.map((e: any) => {
      return {
        label: e.name,
        value: {
          id: e._id,
          name: e.name,
          type: "franchise",
          refId: e.franchiseId,
          city: e.city,
          district: e.district,
          state: e.state,
          pincode: e.pincode,
          mobile: e.mobile,
          formattedAddress: this.formatAddress(
            e.city,
            e.district,
            e.state,
            e.pincode
          ),
        },
      };
    });
  }

  static async getEntityData(type: string, params: Record<string, any>) {
    let resp: any[] = [];

    if (type === "franchise") {
      const { isNearBy, distance, ...restParams } = params;
      // Use the new transactions endpoint to fetch franchise data
      const r = await FranchiseService.getFranchiseTransactions(restParams);
      resp = this.formatFranchiseResponse(r.data?.data || []);
    } else if (type === "customer") {
      const r = await CustomerService.getCustomerNetwork(params);
      resp = this.formatCustomeResponse(r.data.data || []);
    } else if (type === "vendor") {
      const r = await VendorService.getDashboardVendorList({
        ...params,
        sort: { name: 1 },
      });
      resp = this.formatVendorResponse(r.data.data || []);
    }
    return resp;
  }

  static async getEntityById(type: string, id: string) {
    if (!type || !id) return null;

    try {
      if (type === "customer") {
        const response = await CustomerService.getCustomer(id);
        const data = response.data?.data || null;
        if (!data) return null;

        return this.formatCustomeResponse([data])[0];
      }

      if (type === "vendor") {
        const response = await VendorService.getDetail(id);
        const data = response.data?.data || null;
        if (!data) return null;
        return this.formatVendorResponse([data])[0];
      }

      if (type === "franchise") {
        // The franchise details are available via the transactions endpoint
        const response = await FranchiseService.getFranchiseTransactions({
          franchiseId: id,
        });
        const data = response.data?.data || null;
        if (!data) return null;
        // If the transactions endpoint returns an array of transactions, try to find franchise info
        // Fall back to using first item's franchise details if available
        const item = Array.isArray(data) ? data[0] : data;
        return this.formatFranchiseResponse([item])[0];
      }

      return null;
    } catch (err) {
      console.error("RecordPaymentService.getEntityById error:", err);
      return null;
    }
  }

  /**
   * Fetches counts for entity search results. Keeps behavior consistent with helper.getCount
   */
  static async getEntityCount(type: string, params: Record<string, any>) {
    try {
      const p: Record<string, any> = { ...params };

      // remove pagination / sizing keys that aren't needed for count APIs
      delete p.page;
      delete p.limit;
      delete p.count;
      delete p.sort;

      if (type === "franchise") {
        const { isNearBy, distance, ...restParams } = params;

        const r = await FranchiseService.getFranchiseTransactions({
          ...restParams,
          outputType: "count",
        });

        // Try common count locations in response
        return (
          r?.data?.data?.count || r?.data?.data?.total || r?.data?.data || 0
        );
      } else if (type === "customer") {
        const r = await CustomerService.getCustomerNetworkCount(p);
        return r?.data?.data?.count || 0;
      } else if (type === "vendor") {
        const r = await VendorService.getDashboardVendorList({
          ...p,
          outputType: "count",
        });
        return r?.data?.count || r?.data?.data?.count || 0;
      }

      return 0;
    } catch (error) {
      console.error("Error fetching count:", error);
      return 0;
    }
  }

  static prepareFranchiseParams(params: Record<string, any>) {
    const { isNearBy, ...restParams } = { ...params };
    let p = { ...restParams };

    if (!isNearBy) {
      delete p.distance;
      if (!AuthService.isSkSeller()) {
        p.createdByMe = true;
      }
    }

    if (isNearBy) {
      const search = p.search?.trim();

      if (search) {
        const existingFilter =
          p.filter && typeof p.filter === "object" ? { ...p.filter } : {};
        existingFilter.$or = [
          { name: { $regex: search, $options: "i" } },
          { franchiseId: search },
          { mobile: search },
        ];
        p = { ...p, filter: existingFilter };
      }

      // remove control params that should not be forwarded to nearby API
      delete p.isNearBy;
      delete p.search;
    }

    return { isNearBy: Boolean(isNearBy), preparedParams: p };
  }
}

export default RecordPaymentService;
