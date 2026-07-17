import { redirect } from "react-router";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import AuthService from "~/services/AuthService";
import NotificationLogs from "~/shared/notifications/logs/NotificationLogs";
import type { BreadcrumbItem } from "~/types/CommonTypes";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "dashboard",
    redirect: { path: "/dashboard" },
    langKey: "dashboard",
  },
  {
    label: "myProfile",
    redirect: { path: "/user/my-profile" },
    langKey: "myProfile",
  },
  {
    label: "notificationLogs",
    langKey: "notificationLogs",
  },
];

export const clientLoader = async () => {
  const userId = AuthService.getLoggedInUserId();
  if (!userId) {
    return redirect("/auth/login");
  }
  return null;
};

export const meta = () => {
  return [{ title: "Notification Logs" }];
};

const NotificationLogsPage = () => {
  const { t } = useTranslation(["common"]);
  const user = AuthService.getLoggedInUser();

  const userId = AuthService.getLoggedInUserId();
  const mobileNo = user?.mobile;
  const email = user?.email;

  if (!userId || !mobileNo) {
    return (
      <div className="tw:text-center tw:text-gray-500">
        {t("userNotFound", "User not found")}
      </div>
    );
  }

  return (
    <>
      <AppHeader title={t("notificationLogs", "Notification Logs")} />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          <NotificationLogs userId={userId} mobileNo={mobileNo} type="b2b" email={email} />
        </div>
      </div>
    </>
  );
};

export default NotificationLogsPage;
