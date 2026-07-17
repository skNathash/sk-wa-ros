import AuthService from "~/services/AuthService";
import PaylaterService from "~/services/PaylaterService";

export const getMyPaylaterRequests = async () => {
  const userId = AuthService.getLoggedInUserId();
  if (!userId) return [];

  const params: Record<string, any> = {
    page: 1,
    count: 500,
    // limit: 500,
    filter: {
      "userInfo.id": userId,
    },
    sort: { createdAt: -1 },
  };

  const resp: any = await PaylaterService.getRequests(params);
  const list = Array.isArray(resp?.data?.data) ? resp.data.data : [];
  return PaylaterService.formatPaylaterRequest(list);
};
