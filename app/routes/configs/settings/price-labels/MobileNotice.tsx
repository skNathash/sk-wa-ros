import React from "react";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";

const breadcrumbs = [
  {
    label: "Configs",
    langKey: "configs",
    redirect: { path: "/configs/settings" },
  },
  {
    label: "Price Labels",
  },
];

const MobileNotice: React.FC = () => {
  return (
    <>
      <AppHeader
        title="Price Labels"
        sectionKey="profile"
        activeTab="settings"
        mobileLead="menu"
      />

      <div className="app-page tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />

          <div className="tw:flex tw:justify-center tw:items-center tw:h-64">
            <div className="tw:text-center tw:max-w-md tw:bg-white tw:p-4 tw:rounded tw:shadow">
              <h2 className="tw:text-lg tw:font-semibold">Desktop Only</h2>
              <p className="tw:mt-2">
                This page works only on desktop browsers. Please open this site
                on a desktop to manage and print price labels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNotice;
