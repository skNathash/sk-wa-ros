import React from "react";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";

interface SummaryProps {
  totalProducts: number;
  totalUnits: number;
  receivedProducts: number;
  receivedUnits: number;
  notReceivedProducts: number;
  notReceivedUnits: number;
}

const Summary: React.FC<SummaryProps> = ({
  totalProducts,
  totalUnits,
  receivedProducts,
  receivedUnits,
  notReceivedProducts,
  notReceivedUnits,
}) => {
  return (
    <AppCard noPadding className="tw:overflow-hidden">
      <div className="tw:grid tw:grid-cols-2">
        <div className="tw:bg-gray-50 tw:p-4">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-2 tw:md:gap-16">
            <KeyValue label="Total Products" size="sm">
              <span className="tw:font-semibold">{totalProducts}</span>
            </KeyValue>
            <KeyValue label="Total Units" size="sm">
              <span className="tw:font-semibold">{totalUnits}</span>
            </KeyValue>
          </div>
        </div>

        {receivedProducts > 0 && (
          <div className="tw:bg-green-50 tw:p-4">
            <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-2 tw:md:gap-16">
              <KeyValue
                label="Received Products"
                size="sm"
                labelClassName="tw:text-emerald-500"
              >
                <span className="tw:font-semibold">{receivedProducts}</span>
              </KeyValue>
              <KeyValue
                label="Received Units"
                size="sm"
                labelClassName="tw:text-emerald-500"
              >
                <span className="tw:font-semibold">{receivedUnits}</span>
              </KeyValue>
            </div>
          </div>
        )}

        {notReceivedProducts > 0 && (
          <div className="tw:bg-red-50 tw:p-4">
            <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-2 tw:md:gap-16">
              <KeyValue
                label="Not Received Products"
                size="sm"
                labelClassName="tw:text-red-500"
              >
                <span className="tw:font-semibold">{notReceivedProducts}</span>
              </KeyValue>
              <KeyValue
                label="Not Received Units"
                size="sm"
                labelClassName="tw:text-red-500"
              >
                <span className="tw:font-semibold">{notReceivedUnits}</span>
              </KeyValue>
            </div>
          </div>
        )}
      </div>
    </AppCard>
  );
};

export default Summary;
