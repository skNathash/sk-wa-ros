import AppCard from "~/components/core/card/AppCard";
import {
  EMPTY,
  formatDistance,
  formatMemberSince,
  formatNetworkType,
  formatShortAddress,
  type Retailer,
} from "../../helper";

type BusinessProps = {
  data: Retailer;
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-500">
      {label}
    </div>
    <div className="tw:mt-0.5 tw:text-sm tw:font-medium tw:text-slate-800">
      {value}
    </div>
  </div>
);

const Business = ({ data }: BusinessProps) => {
  const address = formatShortAddress(data);
  const distance = formatDistance(data.distanceToFranchiseKm);

  return (
    <AppCard title="Business">
      <div className="tw:space-y-4">
        <Field label="Name" value={data.name || EMPTY} />
        <Field
          label="Role"
          value={formatNetworkType(data.networkType || data.subType)}
        />
        <Field
          label="Address"
          value={
            distance ? (
              <span>
                {address} · {distance} away
              </span>
            ) : (
              address
            )
          }
        />
        <Field label="Member since" value={formatMemberSince(data.createdAt)} />
      </div>
    </AppCard>
  );
};

export default Business;
