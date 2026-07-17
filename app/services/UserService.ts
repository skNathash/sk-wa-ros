import { API } from "~/constants";
import AjaxService from "./AjaxService";

import type { VariantColor } from "~/types/CommonTypes";

const POSITION_BADGE_COLORS: Record<string, VariantColor> = {
  "Franchise Owner": "primary",
  "Digital Raja": "success",
  "Digital Rani": "warning",
  "Delivery Agent": "secondary",
  "Store Staff": "light",
};

class UserService {
  static getPositionOptions() {
    return [
      {
        label: "Store Employee",
        value: "Store Employee",
        langKey: "storeEmployee",
      },
      {
        label: "Digital Raja/Rani",
        value: "Sales Employee",
        langKey: "salesEmployee",
      },
      {
        label: "Delivery Agent",
        value: "Delivery Agent",
        langKey: "deliveryAgent",
      },
    ];
  }

  static formatUser<T extends Record<string, any>>(row: T): T {
    const isFemale = (row.gender || "").toLowerCase() === "female";
    const position = row.position;

    let displayPosition = position || "--";
    if (position === "Sales Employee") {
      displayPosition = isFemale ? "Digital Rani" : "Digital Raja";
    } else if (position === "Store Employee") {
      displayPosition = "Store Staff";
    }

    row._position = displayPosition;
    row._userPicType =
      position === "Sales Employee"
        ? isFemale
          ? "digital-rani"
          : "digital-raja"
        : undefined;
    row._positionBadgeColor =
      POSITION_BADGE_COLORS[displayPosition] || "light";
    return row;
  }

  static formatUsers<T extends Record<string, any>>(rows: T[]): T[] {
    return (rows || []).map((r) => UserService.formatUser(r));
  }

  static async getUserList(params?: Record<string, any>) {
    return AjaxService.request(`${API}franchise/manpower/list`, "GET", {
      ...params,
      includeAll: true,
    });
  }

  static async getUser(id: string, params?: Record<string, any>) {
    return AjaxService.request(`${API}franchise/manpower/${id}`, "GET", {
      ...params,
      includeAll: true,
    });
  }

  static async getUserCount(params?: Record<string, any>) {
    return AjaxService.request(`${API}franchise/manpower/count`, "GET", {
      ...params,
      includeAll: true,
    });
  }

  static async updateUserStatus(id: string, status: string) {
    return AjaxService.request(
      `${API}/franchise/manpower/${id}/status`,
      "PATCH",
      {
        isActive: status === "Active" ? true : false,
      }
    );
  }
}

export default UserService;
