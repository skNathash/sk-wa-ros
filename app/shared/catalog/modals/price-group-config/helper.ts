import AuthService from "~/services/AuthService";
import SellerGroupPriceConfigService from "~/services/SellerGroupPriceConfigService";

export const GROUP_TYPE = "SKRETAILER";

export interface GroupFranchise {
  id: string;
  name: string;
  refId?: string;
  mobile?: string;
}

export interface PriceGroupFormValues {
  name: string;
  status: string;
}

export interface PriceGroupConfigModalProps {
  show: boolean;
  callback: (resp: { action: string; data?: any }) => void;
  /** When passed, the modal loads that group and saves via the update API. */
  editId?: string;
  type?: string;
}

export const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

export const defaultValues: PriceGroupFormValues = {
  name: "",
  status: "Active",
};

/** Maps a FranchiseSearchInput selection to the shape kept in the group list. */
export const toGroupFranchise = (item: any): GroupFranchise | null => {
  const v = item?.value || {};
  const id = v.franchiseId || v.id || "";
  if (!id) {
    return null;
  }
  return {
    id,
    name: v.name || item?.label || "",
    refId: v.refId || "",
    mobile: v.mobile || "",
  };
};

/**
 * Checks whether a franchise is already part of another price group.
 * @param franchiseId - Franchise being added
 * @param excludeGroupId - Group currently being edited (skipped from the check)
 * @returns The conflicting group when found, otherwise null
 */
export const findExistingGroupForFranchise = async (
  franchiseId: string,
  excludeGroupId?: string,
): Promise<any | null> => {
  const filter: Record<string, any> = {
    type: GROUP_TYPE,
    "sellersInfo.id": franchiseId,
    "franchiseInfo.id": AuthService.getLoggedInUserId(),
  };

  if (excludeGroupId) {
    filter._id = { $ne: excludeGroupId };
  }

  const response = await SellerGroupPriceConfigService.getGroups({
    filter,
    page: 1,
    count: 1,
  });

  return response?.data?.data?.[0] || null;
};

/** Loads a single group for edit mode. */
export const getGroupById = async (id: string) => {
  const response = await SellerGroupPriceConfigService.getGroups({
    filter: { _id: id },
    page: 1,
    count: 1,
  });
  return response?.data?.data?.[0] || null;
};

export const validate = (
  formData: PriceGroupFormValues,
  franchises: GroupFranchise[],
): { msg?: string } => {
  if (!formData?.name?.trim()) {
    return { msg: "Enter the group name" };
  }

  if (!franchises || franchises.length === 0) {
    return { msg: "Add at least one franchise to the group" };
  }

  return {};
};

export const preparePayload = (
  formData: PriceGroupFormValues,
  franchises: GroupFranchise[],
) => ({
  type: GROUP_TYPE,
  name: formData.name.trim(),
  sellersInfo: franchises.map((f) => ({ id: f.id })),
  franchiseInfo: {
    id: AuthService.getLoggedInUserId(),
  },
  status: formData.status || "Active",
});
