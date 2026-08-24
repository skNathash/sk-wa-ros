import AppCard from "~/components/core/card/AppCard";
import { formatPolicies } from "~/routes/user/store-policies/helper";
import { type Retailer } from "../../helper";

type PoliciesProps = {
  data: Retailer;
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-500">
      {label}
    </div>
    <div className="tw:mt-1 tw:text-sm tw:text-slate-700 tw:leading-relaxed">
      {value}
    </div>
  </div>
);

const Policies = ({ data }: PoliciesProps) => {
  // Policies the retailer filled in from My Profile > Store Policies.
  const ownPolicy = formatPolicies(data?.ownPolicy).filter(
    (p) => p.key && p.value
  );

  return (
    <AppCard title="Policies">
      <div className="tw:space-y-5">
        {ownPolicy.length > 0 ? (
          ownPolicy.map((policy, index) => (
            <Field
              key={`${policy.key}-${index}`}
              label={policy.key}
              value={policy.value}
            />
          ))
        ) : (
          <div className="tw:text-sm tw:text-slate-500">
            This store has not added any policies yet.
          </div>
        )}
      </div>
    </AppCard>
  );
};

export default Policies;
