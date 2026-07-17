import { API, API_VERSION } from "~/constants";
import { AjaxService } from "./AjaxService";

class PickerDeviceService {
  static async getPickerDevices(params = {}) {
    return AjaxService.request(
      `${API}franchise/${API_VERSION}/picker/device/list`,
      "GET",
      params
    );
  }

  static async updatePickerDevice(id: string, params = {}) {
    return AjaxService.request(
      `${API}franchise/${API_VERSION}/picker/device/update/${id}`,
      "PUT",
      params
    );
  }

  static async allotDeviceToPicker(id: string, params = {}) {
    return AjaxService.request(
      `${API}franchise/${API_VERSION}/picker/device/allotment/${id}`,
      "PUT",
      params
    );
  }

  static async removeDeviceFromPicker(id: string, params = {}) {
    return AjaxService.request(
      `${API}franchise/${API_VERSION}/picker/device/release/${id}`,
      id,
      "PUT",
      params
    );
  }

  static async getAvailablePickers(params = {}) {
    return AjaxService.request(
      `${API}oms/${API_VERSION}/picker/availability/list`,
      "GET",
      params
    );
  }

  static async changePicker(id: string, params = {}) {
    return AjaxService.request(
      `${API}oms/${API_VERSION}/picker/details/update/${id}`,
      "PUT",
      params
    );
  }

  static async createPickerDevice(params = {}) {
    return AjaxService.request(
      `${API}franchise/${API_VERSION}/picker/device/create`,
      "POST",
      params
    );
  }
}

export default PickerDeviceService;
