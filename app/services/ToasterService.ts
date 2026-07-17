import { toast } from "react-toastify";

export class ToasterService {
  static error(msg: string) {
    toast.error(msg);
  }

  static success(msg: string) {
    toast.success(msg);
  }

  static warn(msg: string) {
    toast.warn(msg);
  }

  static info(msg: string) {
    toast.info(msg);
  }
}

export default ToasterService;
