import { API } from "~/constants";
import AjaxService from "./AjaxService";

class TicketService {
  static async getTicketList(params: any) {
    const url = API + "franchise/ticket/list";
    const response = await AjaxService.request(url, "GET", params || {});
    return response;
  }

  static async createTicket(params: Record<string, any>) {
    const url = API + `franchise/ticket`;
    const response = await AjaxService.request(url, "POST", params);
    return response;
  }

  static async getTicketCategoryList(params: any) {
    const url = API + "franchise/ticket/category";
    const response = await AjaxService.request(url, "GET", params || {});
    return response;
  }
}

export default TicketService;
