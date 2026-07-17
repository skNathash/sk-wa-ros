import { ArrowRight, CheckCircle, Layers, XCircle } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import useAppNav from "~/hooks/useAppNav";
import PricingCard from "./PricingCard";

export default function RetailerBenefits() {
  const appNav = useAppNav();

  const navigateToPlans = () =>
    appNav.to("/dashboard/accounts/platform-fee", {
      tab: "commission-invoices",
      subtab: "available-plans",
      skipBenefits: "true",
    });

  return (
    <div className="tw:space-y-6">
      {/* Hero CTA */}
      <div className="tw:bg-gradient-to-br tw:from-emerald-600 tw:to-emerald-700 tw:rounded-xl tw:p-5 tw:text-white">
        <div className="tw:flex tw:flex-col sm:tw:flex-row tw:items-start sm:tw:items-center tw:justify-between tw:gap-4">
          <div className="tw:space-y-1">
            <h2 className="tw:text-lg tw:font-bold">
              Save up to 76% on platform costs
            </h2>
            <p className="tw:text-emerald-100 tw:text-sm">
              Join 1000+ retailers already growing with StoreKing. See plans and
              start saving today.
            </p>
          </div>
          <AppButton
            color="light"
            fill="outline"
            className="tw:whitespace-nowrap tw:border-white tw:text-white hover:tw:bg-white/10"
            onClick={navigateToPlans}
          >
            View Plans
            <ArrowRight className="tw:w-4 tw:h-4" />
          </AppButton>
        </div>
      </div>

      {/* Pricing Model Comparison */}
      <div className="tw:space-y-4">
        <h2 className="tw:text-lg tw:font-bold tw:text-gray-800">
          Retailer Subscription: Pricing Model Evaluation
        </h2>
        <p className="tw:text-sm tw:text-gray-500">
          Analyzing current monetization approaches versus the proposed hybrid
          model for optimizing adoption and MRR.
        </p>

        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
          {/* Commission-Based */}
          <PricingCard
            title="Commission-Based"
            subtitle="Pay-As-You-Go (Current Model)"
            structure="1% Flat Fee on purchase value"
            structureColor="blue"
            advantages={[
              "Zero upfront barrier to entry for retailers",
              "Aligns perfectly with retailer cash flows",
              "Fair, strictly usage-based cost structure",
              "No wasted subscription cost if inactive",
            ]}
            challenges={[
              "Highly unpredictable StoreKing revenue",
              "Zero long-term commitment from retailer",
              "Frictionless exit makes churn easy",
              "Punishes scale (expensive at high volume)",
            ]}
            target="Occasional/trial users, low volume"
            example="₹25L Annual Purchase"
            totalCost="₹25,000"
          />

          {/* Value-Based Prepaid */}
          <PricingCard
            title="Value-Based Prepaid"
            subtitle="Annual Tiered Plans (Current Model)"
            structure="₹12,499 - ₹1.99L annual upfront"
            structureColor="orange"
            advantages={[
              "Predictable, secured revenue for platform",
              "Strong engagement commitment signal",
              "Better unit economics (fewer transactions)",
              "Locks in retailer ecosystem for 365 days",
            ]}
            challenges={[
              "Massive upfront adoption barrier (₹12.5K+)",
              "Severe cash flow challenge for small SMEs",
              "Binary tier scaling causes friction to upgrade",
              "High risk of unused credit resentment",
            ]}
            target="Cash-rich, established high-volume"
            example="₹25L Annual Purchase"
            totalCost="₹12,499 (Paid upfront)"
          />

          {/* Hybrid Subscription - Recommended */}
          <PricingCard
            title="Hybrid Subscription"
            subtitle="Initial Fee + Monthly Recurring"
            structure="₹7,500 Setup + ₹1,875 / mo for limits"
            structureColor="green"
            recommended
            advantages={[
              "Low psychological barrier vs Annual (₹999 vs ₹12K)",
              "Maintains required 0.5% platform revenue",
              "Still 76% cheaper than commission model for typical Kirana",
              "Smooth, mid-cycle upgrade path to higher limits",
            ]}
            challenges={[
              "Requires reliable monthly billing collection",
              "Lower immediate cash injection vs annual prepay",
              "Requires active engagement to prevent monthly churn",
              "Slight friction vs pure zero-commitment free model",
            ]}
            target="Sweet spot for SME scaling adoption"
            example="₹60L Annual Purchases (₹5L/mo)"
            totalCost="₹30,000 (0.50% effective rate)"
            totalCostDetail="₹7,500 setup + (₹1,875 × 12 months) = ₹30,000"
          />
        </div>
      </div>

      {/* StoreKing vs Billing Software */}
      <div className="tw:space-y-4">
        <h2 className="tw:text-lg tw:font-bold tw:text-gray-800">
          STORECLUB vs Billing Software:{" "}
          <span className="tw:text-emerald-600">
            The Operating System Advantage
          </span>
        </h2>
        <p className="tw:text-sm tw:text-gray-500">
          Comparing standalone invoicing tools against a comprehensive retail
          operating system.
        </p>

        <AppCard noShadow bordered>
          <div className="tw:overflow-x-auto">
            <table className="tw:w-full tw:min-w-[600px] tw:text-sm">
              <thead>
                <tr className="tw:border-b tw:border-gray-200">
                  <th className="tw:text-left tw:py-3 tw:px-4 tw:font-semibold tw:text-gray-600 tw:w-1/4 tw:whitespace-nowrap">
                    Feature Category
                  </th>
                  <th className="tw:text-left tw:py-3 tw:px-4 tw:font-semibold tw:text-gray-600 tw:w-[37.5%]">
                    Other POS/Software
                  </th>
                  <th className="tw:text-left tw:py-3 tw:px-4 tw:font-semibold tw:text-gray-600 tw:w-[37.5%]">
                    StoreKing
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr
                    key={i}
                    className="tw:border-b tw:border-gray-100 last:tw:border-0"
                  >
                    <td className="tw:py-3 tw:px-4 tw:font-medium tw:text-gray-700">
                      {row.category}
                    </td>
                    <td className="tw:py-3 tw:px-4">
                      <div className="tw:flex tw:items-start tw:gap-2 tw:text-gray-500">
                        <XCircle className="tw:w-4 tw:h-4 tw:text-red-400 tw:mt-0.5 tw:shrink-0" />
                        <span>{row.other}</span>
                      </div>
                    </td>
                    <td className="tw:py-3 tw:px-4">
                      <div className="tw:flex tw:items-start tw:gap-2 tw:text-gray-700">
                        <CheckCircle className="tw:w-4 tw:h-4 tw:text-emerald-500 tw:mt-0.5 tw:shrink-0" />
                        <span>{row.storeking}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AppCard>

        {/* Scale Context */}
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
          <AppCard noShadow bordered>
            <div className="tw:flex tw:items-center tw:gap-3">
              <div className="tw:w-10 tw:h-10 tw:rounded-full tw:bg-emerald-50 tw:flex tw:items-center tw:justify-center">
                <Layers className="tw:w-5 tw:h-5 tw:text-emerald-600" />
              </div>
              <div>
                <p className="tw:text-xs tw:text-gray-500">Scale Context</p>
                <p className="tw:font-semibold tw:text-sm tw:text-gray-800">
                  SK ROS Ecosystem
                </p>
                <p className="tw:text-xs tw:text-gray-500">
                  Billing is just 1 module
                </p>
              </div>
            </div>
          </AppCard>

          <AppCard noShadow bordered>
            <div className="tw:flex tw:items-center tw:gap-3">
              <div>
                <p className="tw:text-xs tw:text-gray-500">
                  Outcome Transformation
                </p>
                <div className="tw:flex tw:items-center tw:gap-2 tw:mt-1">
                  <span className="tw:text-sm tw:font-medium tw:text-gray-600">
                    Digitized Kirana
                  </span>
                  <ArrowRight className="tw:w-4 tw:h-4 tw:text-gray-400" />
                  <span className="tw:text-sm tw:font-semibold tw:text-emerald-600">
                    Smart Supermarket
                  </span>
                </div>
                <p className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
                  Source + Sell + Grow
                </p>
              </div>
            </div>
          </AppCard>

          <AppCard noShadow bordered>
            <div>
              <p className="tw:text-sm tw:font-bold tw:text-red-600">
                Strategic Verdict
              </p>
              <p className="tw:text-xs tw:text-gray-600 tw:mt-1">
                This is a <strong>Vision Comparison</strong>, not a feature
                fight. Billing software digitizes the transaction. StoreKing
                transforms the entire business model, unlocking platform
                economics billing tools cannot touch.
              </p>
            </div>
          </AppCard>
        </div>
      </div>

      <div className="tw:bg-gradient-to-r tw:from-emerald-50 tw:to-blue-50 tw:border tw:border-emerald-200 tw:rounded-lg tw:p-5 tw:flex tw:flex-col sm:tw:flex-row tw:items-center tw:justify-between tw:gap-4">
        <div>
          <p className="tw:font-bold tw:text-gray-800">
            Ready to transform your store?
          </p>
          <p className="tw:text-sm tw:text-gray-500">
            Choose a plan that fits your business and start saving today.
          </p>
        </div>
        <AppButton
          color="success"
          size="large"
          className="tw:whitespace-nowrap"
          onClick={navigateToPlans}
        >
          <ArrowRight className="tw:w-4 tw:h-4" />
          View Plans
        </AppButton>
      </div>
    </div>
  );
}

const comparisonData = [
  {
    category: "Supply Chain Integration",
    other: "Manual ordering (Phone/WhatsApp)",
    storeking: "Automated sourcing from 500+ brands",
  },
  {
    category: "Consumer Engagement",
    other: "No B2C connection capability",
    storeking: "CLUB App connects 300 households/store",
  },
  {
    category: "AI & Intelligence",
    other: "Basic reporting only",
    storeking: "Demand forecasting & inventory optimization",
  },
  {
    category: "Working Capital",
    other: "Locked in static inventory",
    storeking: "7 Days cycle (JIT Replenishment)",
  },
  {
    category: "Embedded Finance",
    other: "Not available",
    storeking: "PayLater Credit & Retailer Financing",
  },
  {
    category: "Revenue Model",
    other: "Fixed SaaS Fee (Low upside)",
    storeking: "Platform % Fee on entire GMV",
  },
  {
    category: "Catalog Scale",
    other: "Limited to physical stock",
    storeking: "Infinite Shelf (25,000+ Virtual SKUs)",
  },
  {
    category: "Operational Automation",
    other: "Manual entry required",
    storeking: "Auto-replenishment & GST filing",
  },
  {
    category: "Data Moat",
    other: "Siloed transaction logs",
    storeking: "Hyperlocal consumption & credit scores",
  },
  {
    category: "Geographic Reach",
    other: "Local store boundary",
    storeking: "National network access & logistics",
  },
];
