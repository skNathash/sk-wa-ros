import type { PaginationState } from "~/types/CommonTypes";
import FranchiseService from "~/services/FranchiseService";

export type ConfigLogType =
  | "enableOtpForPOS"
  | "minOrderAmount"
  | "compositionGST";

const CONFIG_TYPE_BY_LOG_TYPE: Record<ConfigLogType, string> = {
  enableOtpForPOS: "B2B_ORDER_CONFIG",
  minOrderAmount: "B2B_ORDER_CONFIG",
  compositionGST: "ORDER_INVOICE_CONFIG",
};

export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
) => {
  const logType: ConfigLogType = filters?.type;
  const configType =
    filters?.configType || CONFIG_TYPE_BY_LOG_TYPE[logType] || undefined;

  return {
    configType,
    // filter: { logType },
    logType,
    // page: pagination?.activePage || 1,
    // count: pagination?.rowsPerPage || 20,
  };
};

export const getData = async (params: Record<string, any>) => {
  try {
    const resp = await FranchiseService.getFranchiseSettings(params);
    const data = resp?.data?.data;
    const logs = Array.isArray(data?.auditLog)
      ? data.auditLog
      : Array.isArray(data)
        ? data
        : [];
    return logs;
  } catch (error) {
    console.error("ConfigLogHelper.getData", error);
    return [];
  }
};

export default { getData, prepareParams };
