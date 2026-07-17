import AuthService from "~/services/AuthService";

const onlyForMasterLogin = [
  "CATALOG.BULK-UPLOAD",
  "CATALOG.UPDATE-PRODUCT-STATUS",
  "USER-MANAGEMENT.UPDATE-PERMISSIONS",
];

const Rbac = ({
  roles,
  children,
  forceDisplay = false,
}: {
  roles: string[];
  children: React.ReactNode;
  forceDisplay?: boolean;
}) => {
  if (forceDisplay) {
    return children;
  }

  if (
    AuthService.isMasterLogin() &&
    !AuthService.isMasterLoginWithFullAccess()
  ) {
    if (roles.some((role) => onlyForMasterLogin.includes(role))) {
      return false;
    }
    return false;
  }

  if (!AuthService.isRbacEnabled(roles)) {
    return null;
  }

  return children;
};

export default Rbac;
