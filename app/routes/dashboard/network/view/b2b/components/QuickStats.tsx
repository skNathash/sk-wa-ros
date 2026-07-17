import React from "react";
import AppCard from "~/components/core/card/AppCard";

interface Props {
  franchise: any;
}

export default function QuickStats({ franchise }: Props) {
  if (!franchise) return null;

  const stats = franchise.quickStats || {};

  return (
    <AppCard title="Quick Stats">
      <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:text-sm tw:text-gray-700">
        <div>
          <div className="tw:font-semibold tw:text-lg tw:text-blue-800">6</div>
          <div className="tw:text-xs tw:text-gray-500">Total Orders</div>
        </div>
        <div>
          <div className="tw:font-semibold tw:text-lg tw:text-green-600">
            $652.32
          </div>
          <div className="tw:text-xs tw:text-gray-500">Total Spent</div>
        </div>
        <div>
          <div className="tw:font-semibold tw:text-lg tw:text-blue-800">
            $109
          </div>
          <div className="tw:text-xs tw:text-gray-500">Avg Order</div>
        </div>
        <div>
          <div className="tw:font-semibold tw:text-lg tw:text-orange-500">
            $-4,650.68
          </div>
          <div className="tw:text-xs tw:text-gray-500">Outstanding</div>
        </div>
      </div>
    </AppCard>
  );
}
