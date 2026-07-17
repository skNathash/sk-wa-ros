import FranchiseService from "~/services/FranchiseService";
import LogisticsService from "~/services/LogisticsService";

export const getData = async (type: "in-house" | "courier") => {
  try {
    if (type === "in-house") {
      const response = await FranchiseService.getFranSubUser({
        page: 1,
        count: 100,
        filter: {
          position: "Delivery Agent",
          // isActive: true,
        },
      });

      const employees = response?.data?.data || [];
      const formattedEmployees = employees.map((emp: any) => ({
        value: emp._id,
        label: `${emp.name} (${emp.mobile})`,
        data: emp, // Include full employee data for vehicle details
      }));

      return {
        data: formattedEmployees,
        count: response?.data?.pagination?.total || 0,
      };
    } else if (type === "courier") {
      const response = await LogisticsService.getCouriers({
        page: 1,
        count: 100,
      });

      const couriers = response?.data || [];
      const formattedCouriers = couriers.map((courier: any) => ({
        value: courier._id,
        label: courier.name,
      }));

      return {
        data: formattedCouriers,
        count: response?.data?.length || 0,
      };
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  // Default return for unknown type or error
  return {
    data: [],
    count: 0,
  };
};
