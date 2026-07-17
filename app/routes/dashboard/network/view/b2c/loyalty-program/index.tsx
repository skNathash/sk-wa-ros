import React from "react";
import { useParams } from "react-router";
import BasicInfo from "./components/BasicInfo";
import Statements from "./components/statements/Statements";

export default function LoyaltyProgram() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-4">
      <div className="tw:w-full tw:md:w-1/4">
        <BasicInfo customerId={id} />
      </div>

      <div className="tw:w-full tw:md:w-3/4">
        <Statements customerId={id} />
      </div>
    </div>
  );
}
