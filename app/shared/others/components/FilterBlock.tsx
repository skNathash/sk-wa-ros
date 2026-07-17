import { ChevronUp, Filter } from "lucide-react";
import React, { useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import useScreenView from "~/hooks/useScreenView";

interface Props {
  children?: React.ReactNode;
  title?: React.ReactNode;
  forceOpen?: boolean;
}

export default function FilterBlock({ children, title, forceOpen }: Props) {
  const { isMobile } = useScreenView();
  const [collapsed, setCollapsed] = useState(forceOpen ? false : isMobile);

  return (
    <AppCard noContentPadding noPadding>
      <div className="tw:px-4 tw:py-2">
        <div
          className="tw:flex tw:items-center tw:justify-between tw:w-full tw:cursor-pointer"
          onClick={() => setCollapsed((c) => !c)}
        >
          <div className="tw:flex tw:items-center tw:space-x-2">
            <div className="tw:font-medium tw:text-sm tw:flex tw:items-center tw:gap-1">
              <Filter size={16} />
              {title ?? "Filters"}
            </div>
          </div>

          <button
            className="tw:flex tw:items-center tw:justify-center tw:p-1 tw:rounded tw:transition-transform"
            type="button"
          >
            <ChevronUp
              className={`tw:w-4 tw:h-4 tw:text-gray-600 tw:transition-transform ${
                collapsed ? "tw:rotate-180" : ""
              }`}
            />
          </button>
        </div>
        <div className={"tw:mt-2 " + (collapsed ? "tw:hidden" : "")}>
          {children}
        </div>
      </div>
    </AppCard>
  );
}
