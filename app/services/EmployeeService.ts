// EmployeeService.ts
import AjaxService from "./AjaxService";
import { API } from "~/constants";

const EmployeeService = {
  async getUserActivities(userId: string) {
    return AjaxService.request(
      `${API}franchise/user/activities/user/${userId}`,
      "GET"
    );
  },
};

export default EmployeeService;
