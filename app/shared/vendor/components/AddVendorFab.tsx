import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import Rbac from "~/components/core/rbac/Rbac";
import useAppNav from "~/hooks/useAppNav";

const rbacRoles = {
  addVendor: ["VENDOR.ADD"],
};

type Props = {
  /** Override the default add-vendor action (→ /dashboard/vendor/manage). */
  onAddVendor?: () => void;
};

/**
 * Add Vendor FAB shown on mobile in every theme (hidden at `md` and up).
 * Mirrors the purchase-order `CreatePoFab`: a pill button pinned above the
 * bottom tab bar, so pages only need to drop in `<AddVendorFab />`.
 */
const AddVendorFab = ({ onAddVendor }: Props) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const handleAddVendor = () => {
    if (onAddVendor) {
      onAddVendor();
      return;
    }
    appNav.to("/dashboard/vendor/manage");
  };

  return (
    <div
      className="tw:fixed tw:right-4 tw:z-50 tw:flex tw:md:hidden tw:flex-col tw:items-end tw:gap-3"
      style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
    >
      <Rbac roles={rbacRoles.addVendor}>
        <button
          type="button"
          onClick={handleAddVendor}
          aria-label={t("addVendor")}
          className="tw:bg-primary tw:text-primary-foreground tw:h-11 tw:px-4 tw:rounded-full tw:shadow-lg tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-semibold tw:transition-transform tw:duration-200 tw:cursor-pointer"
        >
          <Plus className="tw:w-5 tw:h-5" />
          {t("addVendor")}
        </button>
      </Rbac>
    </div>
  );
};

export default AddVendorFab;
