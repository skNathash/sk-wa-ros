import AppHeader from "~/components/core/header/AppHeader";
import RspTabs from "../list/components/tabs/RspTabs";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import React, { useState } from "react";
import { DynamicIcon } from "lucide-react/dynamic";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Configs",
    redirect: { path: "/configs" },
  },
  {
    label: "RSP",
    redirect: { path: "/configs/rsp" },
  },
  {
    label: "Pricing Analysis",
  },
];

const summaryDataDefault = [
  {
    icon: "indian-rupee",
    label: "Total Potential Profit",
    value: "$NaN",
  },
  {
    icon: "percent",
    label: "Average Margin",
    value: "0.0%",
  },
  {
    icon: "trending-up",
    label: "Profitable Products",
    value: "74",
  },
];

const RspAnalysis = () => {
  const [summaryData] = useState(summaryDataDefault);
  return (
    <>
      <AppHeader title="Pricing Analysis" />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          <div className="tw:text-gray-500 tw:text-xs tw:mb-4">
            View the pricing analysis for RSP products and trends.
          </div>
          <RspTabs activeTab="pricingAnalysis" className="tw:mb-4" />
          <AppCard
            title="Pricing Analytics"
            subtitle="Overview of your current pricing strategy's potential profit."
          >
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
              {summaryData.map((item, idx) => (
                <div
                  key={item.label}
                  className="tw:bg-gray-100 tw:rounded-lg tw:p-6 tw:flex tw:items-center tw:gap-4"
                >
                  <div className="tw:bg-white tw:rounded tw:p-2 tw:shadow-sm tw:mr-3 tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:text-xl tw:text-gray-500">
                    <DynamicIcon
                      name={item.icon as any}
                      className="tw:text-3xl tw:text-gray-500"
                    />
                  </div>
                  <div>
                    <div className="tw:text-gray-600 tw:text-sm tw:font-medium">
                      {item.label}
                    </div>
                    <div className="tw:text-xl tw:font-bold tw:mt-1">
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AppCard>
        </div>
      </div>
    </>
  );
};

export default RspAnalysis;
