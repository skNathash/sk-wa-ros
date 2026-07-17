import React from "react";
import { Pencil } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";

interface BasicInfoProps {
  name?: string;
  email?: string;
  mobile?: string;
  age?: number | string | null;
  gender?: string | null;
  dob?: string | Date | null;
  maritalStatus?: string | null;
  monthlyShoppingExpenses?: number | string | null;
  registeredOn?: string | Date | null;
  registeredStore?: string;
  address?: string | React.ReactNode;
  className?: string;
  onEdit?: (fields: string[]) => void;
}

const BasicInfo: React.FC<BasicInfoProps> = ({
  name,
  email,
  mobile,
  age,
  gender,
  dob,
  maritalStatus,
  monthlyShoppingExpenses,
  registeredOn,
  registeredStore,
  address,
  className = "",
  onEdit,
}) => {
  const editBtn = (fields: string[]) =>
    onEdit ? (
      <button
        type="button"
        onClick={() => onEdit(fields)}
        className="tw:px-1.5 tw:py-0.5 tw:rounded tw:hover:bg-gray-100 tw:cursor-pointer tw:transition-colors tw:ml-1 tw:inline-flex tw:items-center tw:gap-0.5 tw:text-xs tw:text-gray-400 tw:hover:text-gray-600"
        title="Edit"
      >
        <Pencil size={11} />
        Edit
      </button>
    ) : null;

  return (
    <AppCard title="Basic Info" className={className} noShadow>
      <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-x-6 tw:gap-y-5">
        {/* Row 1: Name (full on mobile, 1 col on lg) + Email + Mobile */}
        <div className="tw:col-span-2 tw:lg:col-span-1">
          <KeyValue label="Name" size="sm">
            {name ?? "-"}
          </KeyValue>
        </div>
        <KeyValue
          label={
            <span className="tw:inline-flex tw:items-center">
              Email {editBtn(["email"])}
            </span>
          }
          size="sm"
        >
          {email ?? "-"}
        </KeyValue>
        <KeyValue label="Mobile" size="sm">
          {mobile ?? "-"}
        </KeyValue>

        {/* Row 2: Age + Gender + DOB */}
        <KeyValue
          label={
            <span className="tw:inline-flex tw:items-center">
              Age {editBtn(["age"])}
            </span>
          }
          size="sm"
        >
          {age ?? "-"}
        </KeyValue>
        <KeyValue
          label={
            <span className="tw:inline-flex tw:items-center">
              Gender {editBtn(["gender"])}
            </span>
          }
          size="sm"
        >
          {gender ?? "-"}
        </KeyValue>
        <KeyValue
          label={
            <span className="tw:inline-flex tw:items-center">
              Date of Birth {editBtn(["dob"])}
            </span>
          }
          size="sm"
        >
          {dob ? <DateFormat value={dob} formatStr="dd MMM yyyy" /> : "-"}
        </KeyValue>

        {/* Row 3: Marital Status + Monthly Shopping Expenses + Registered On */}
        <KeyValue
          label={
            <span className="tw:inline-flex tw:items-center">
              Marital Status {editBtn(["maritalStatus"])}
            </span>
          }
          size="sm"
        >
          {maritalStatus ?? "-"}
        </KeyValue>
        <KeyValue
          label={
            <span className="tw:inline-flex tw:items-center">
              Monthly Shopping Expenses {editBtn(["monthlyShoppingExpenses"])}
            </span>
          }
          size="sm"
        >
          {monthlyShoppingExpenses != null
            ? `₹${monthlyShoppingExpenses}`
            : "-"}
        </KeyValue>
        <KeyValue label="Registered On" size="sm">
          {registeredOn ? (
            <DateFormat value={registeredOn} formatStr="dd MMM yyyy" />
          ) : (
            "-"
          )}
        </KeyValue>

        {/* Row 4: Registered Store + Address (full width) */}
        <KeyValue label="Registered Store" size="sm">
          {registeredStore ?? "-"}
        </KeyValue>
        <div className="tw:col-span-2 tw:lg:col-span-2">
          <KeyValue label="Address" size="sm">
            {address ?? "-"}
          </KeyValue>
        </div>
      </div>
    </AppCard>
  );
};

export default BasicInfo;
