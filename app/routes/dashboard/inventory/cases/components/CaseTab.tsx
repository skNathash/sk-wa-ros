import React from "react";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import { Package, Layers, LayoutGrid } from "lucide-react";

interface CaseTabProps {
  activeTab: string;
  onTabChange: (tab: TabItem) => void;
  className?: string;
}

const CaseTab: React.FC<CaseTabProps> = ({
  activeTab,
  onTabChange,
  className,
}) => {
  const tabItems: TabItem[] = [
    { key: "all", name: "All", icon: <LayoutGrid size={18} /> },
    { key: "Case", name: "Case", icon: <Package size={18} /> },
    { key: "InnerCase", name: "Inner Case", icon: <Layers size={18} /> },
    {
      key: "NotConfigured",
      name: "Not Configured",
      icon: <LayoutGrid size={18} />,
    },
  ];

  return (
    <AppTab
      tabs={tabItems}
      activeTab={activeTab}
      onTabChange={onTabChange}
      className={className}
    />
  );
};

export default CaseTab;
