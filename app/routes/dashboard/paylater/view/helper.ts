import PaylaterService from "~/services/PaylaterService";

export const getRequest = async (id: string) => {
  const res = await PaylaterService.getRequest(id);
  const data = res.data?.data || null;
  if (!data) {
    return null;
  }
  return PaylaterService.formatPaylaterRequest([data])[0] || null;
};
