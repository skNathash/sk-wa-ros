import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import {
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  Truck,
  CreditCard,
  ShoppingCart,
  Globe,
  PackageSearch,
  Clock,
  AlertTriangle,
  Star,
  Smartphone,
  LineChart,
  RefreshCw,
  PiggyBank,
  Receipt,
  ArrowRight,
} from "lucide-react";
import PlatformFeeTabs from "../../../components/PlatformFeeTabs";
import useAppNav from "~/hooks/useAppNav";

export default function DistributorBenefits() {
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
              Cut distribution costs by 90%+
            </h2>
            <p className="tw:text-emerald-100 tw:text-sm">
              Replace traditional ERP overhead with an intelligent B2B platform.
              See plans and start saving today.
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

      {/* SK ROS for Distributors */}
      <div className="tw:space-y-4">
        <h2 className="tw:text-lg tw:font-bold tw:text-gray-800">
          SK ROS for Distributors:{" "}
          <span className="tw:text-emerald-600">
            Intelligent B2B Network Management
          </span>
        </h2>
        <p className="tw:text-sm tw:text-gray-500">
          Transforming distribution from reactive order-taking to a real-time,
          data-driven B2B retailer ecosystem.
        </p>

        <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-4">
          {/* Traditional ERP */}
          <AppCard noShadow bordered>
            <h3 className="tw:font-bold tw:text-gray-700 tw:mb-1">
              Traditional ERP / DMS
            </h3>
            <p className="tw:text-xs tw:text-gray-400 tw:mb-4">
              (e.g., Tally, SAP B1, Busy, Custom ERP)
            </p>
            <div className="tw:space-y-4">
              {traditionalERPProblems.map((item, i) => (
                <div key={i}>
                  <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                    <XCircle className="tw:w-4 tw:h-4 tw:text-red-500 tw:shrink-0" />
                    <span className="tw:font-semibold tw:text-sm tw:text-gray-800">
                      {item.title}
                    </span>
                  </div>
                  <p className="tw:text-xs tw:text-gray-500 tw:ml-6">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </AppCard>

          {/* SK ROS Platform */}
          <AppCard noShadow bordered>
            <div className="tw:flex tw:items-center tw:justify-between tw:mb-4">
              <h3 className="tw:font-bold tw:text-gray-700">
                SK ROS Distributor Platform
              </h3>
              <span className="tw:text-xs tw:font-semibold tw:text-emerald-600 tw:bg-emerald-50 tw:px-2 tw:py-1 tw:rounded-full">
                LIVE B2B ECOSYSTEM
              </span>
            </div>
            <div className="tw:grid tw:grid-cols-1 sm:tw:grid-cols-2 tw:gap-4">
              {skROSFeatures.map((item, i) => (
                <div key={i} className="tw:flex tw:gap-3">
                  <div
                    className={`tw:w-8 tw:h-8 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:shrink-0 ${item.bgColor}`}
                  >
                    <item.icon className={`tw:w-4 tw:h-4 ${item.iconColor}`} />
                  </div>
                  <div>
                    <p className="tw:font-semibold tw:text-sm tw:text-gray-800">
                      {item.title}
                    </p>
                    <p className="tw:text-xs tw:text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AppCard>
        </div>
      </div>

      {/* ROI Calculator */}
      <div className="tw:space-y-4">
        <h2 className="tw:text-lg tw:font-bold tw:text-gray-800">
          Distributor ROI Calculator:{" "}
          <span className="tw:text-emerald-600">
            Cost Savings & Payback Analysis
          </span>
        </h2>
        <p className="tw:text-sm tw:text-gray-500">
          Quantifying the financial advantage of StoreKing's capped pricing
          model versus the compounded overhead of traditional B2B payment
          solutions.
        </p>

        {/* Cost comparison header */}
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
          <AppCard noShadow bordered>
            <div className="tw:flex tw:items-center tw:justify-between">
              <div>
                <p className="tw:font-bold tw:text-red-600 tw:text-sm">
                  Traditional Distributor Costs
                </p>
                <p className="tw:text-xs tw:text-gray-500 tw:mt-1">
                  Wastage: 1.0% | Interest: 1.2% | Cash Ops: 0.5% | Recon: 0.3%
                </p>
              </div>
              <div className="tw:text-right">
                <p className="tw:text-xl tw:font-bold tw:text-red-600">~3.0%</p>
                <p className="tw:text-xs tw:text-gray-500">Total Cost on GMV</p>
              </div>
            </div>
          </AppCard>
          <AppCard noShadow bordered>
            <div className="tw:flex tw:items-center tw:justify-between">
              <div>
                <p className="tw:font-bold tw:text-emerald-600 tw:text-sm">
                  StoreKing Platform Solution
                </p>
                <p className="tw:text-xs tw:text-gray-500 tw:mt-1">
                  Fixed ₹50K Setup | Tiered Monthly Fee | Strict ₹20K/mo Cap |
                  0% Txn Fee
                </p>
              </div>
              <div className="tw:text-right">
                <p className="tw:text-xl tw:font-bold tw:text-emerald-600">
                  0.05% to 0.2%
                </p>
                <p className="tw:text-xs tw:text-gray-500">
                  Effective Cost on GMV
                </p>
              </div>
            </div>
          </AppCard>
        </div>

        {/* Tier Table */}
        <AppCard noShadow bordered>
          <div className="tw:overflow-x-auto">
            <table className="tw:w-full tw:min-w-[700px] tw:text-sm">
              <thead>
                <tr className="tw:border-b tw:border-gray-200">
                  <th className="tw:text-left tw:py-3 tw:px-4 tw:font-semibold tw:text-gray-600 tw:whitespace-nowrap">
                    Distributor Tier
                  </th>
                  <th className="tw:text-left tw:py-3 tw:px-4 tw:font-semibold tw:text-gray-600 tw:whitespace-nowrap">
                    Purchase Credits
                  </th>
                  <th className="tw:text-right tw:py-3 tw:px-4 tw:font-semibold tw:text-gray-600 tw:whitespace-nowrap">
                    Traditional TCO (3%)
                  </th>
                  <th className="tw:text-right tw:py-3 tw:px-4 tw:font-semibold tw:text-gray-600 tw:whitespace-nowrap">
                    StoreKing Cost
                  </th>
                  <th className="tw:text-right tw:py-3 tw:px-4 tw:font-semibold tw:text-emerald-600 tw:whitespace-nowrap">
                    Annual Net Savings
                  </th>
                  <th className="tw:text-right tw:py-3 tw:px-4 tw:font-semibold tw:text-emerald-600 tw:whitespace-nowrap">
                    Cost Reduction %
                  </th>
                </tr>
              </thead>
              <tbody>
                {roiTiers.map((tier, i) => (
                  <tr
                    key={i}
                    className="tw:border-b tw:border-gray-100 last:tw:border-0"
                  >
                    <td className="tw:py-3 tw:px-4">
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <div
                          className={`tw:w-2.5 tw:h-2.5 tw:rounded-full ${tier.dotColor}`}
                        />
                        <span className="tw:font-medium tw:text-gray-800">
                          {tier.name}
                        </span>
                      </div>
                    </td>
                    <td className="tw:py-3 tw:px-4 tw:text-gray-600">
                      {tier.credits}
                    </td>
                    <td className="tw:py-3 tw:px-4 tw:text-right tw:font-medium tw:text-gray-700">
                      {tier.traditionalCost}
                    </td>
                    <td className="tw:py-3 tw:px-4 tw:text-right tw:font-medium tw:text-gray-700">
                      {tier.skCost}
                    </td>
                    <td className="tw:py-3 tw:px-4 tw:text-right tw:font-semibold tw:text-emerald-600">
                      + {tier.savings}
                    </td>
                    <td className="tw:py-3 tw:px-4 tw:text-right">
                      <span className="tw:bg-emerald-50 tw:text-emerald-700 tw:font-bold tw:px-2 tw:py-0.5 tw:rounded-full tw:text-xs">
                        {tier.reduction}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AppCard>

        {/* Payback, Cumulative Savings, Value-Adds */}
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
          <AppCard noShadow bordered>
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
              <Clock className="tw:w-4 tw:h-4 tw:text-amber-500" />
              <p className="tw:font-bold tw:text-sm tw:text-gray-800">
                Setup Fee Payback Period
              </p>
            </div>
            <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
              <span className="tw:text-xs tw:text-gray-500">All Tiers</span>
              <span className="tw:text-sm tw:font-bold tw:text-emerald-600">
                Instant
              </span>
            </div>
            <div className="tw:w-full tw:h-2 tw:bg-gray-100 tw:rounded-full">
              <div className="tw:w-full tw:h-2 tw:bg-emerald-500 tw:rounded-full" />
            </div>
            <p className="tw:text-xs tw:text-gray-500 tw:mt-2">
              With annual savings starting at ₹16.8L (Small tier), the ₹50K
              setup fee is recovered in the first week of operations.
            </p>
          </AppCard>

          <AppCard noShadow bordered>
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
              <PiggyBank className="tw:w-4 tw:h-4 tw:text-emerald-500" />
              <p className="tw:font-bold tw:text-sm tw:text-gray-800">
                3-Year Cumulative Savings
              </p>
            </div>
            <div className="tw:space-y-2">
              {[
                { label: "Small", value: "₹50L", width: "10%" },
                { label: "Medium", value: "₹1.2Cr", width: "25%" },
                { label: "Large", value: "₹2.6Cr", width: "50%" },
                { label: "Enterprise", value: "₹5.3Cr", width: "100%" },
              ].map((item, i) => (
                <div key={i}>
                  <div className="tw:flex tw:justify-between tw:text-xs tw:mb-0.5">
                    <span className="tw:text-gray-600">{item.label}</span>
                    <span className="tw:font-semibold tw:text-emerald-600">
                      {item.value}
                    </span>
                  </div>
                  <div className="tw:w-full tw:h-2 tw:bg-gray-100 tw:rounded-full">
                    <div
                      className="tw:h-2 tw:bg-emerald-500 tw:rounded-full"
                      style={{ width: item.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </AppCard>

          <AppCard noShadow bordered>
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
              <Star className="tw:w-4 tw:h-4 tw:text-blue-500" />
              <p className="tw:font-bold tw:text-sm tw:text-gray-800">
                Value-Adds Beyond Savings
              </p>
            </div>
            <ul className="tw:space-y-2 tw:text-xs tw:text-gray-600">
              <li className="tw:flex tw:gap-2">
                <PackageSearch className="tw:w-3.5 tw:h-3.5 tw:text-blue-500 tw:shrink-0 tw:mt-0.5" />
                <span>
                  <strong>Inventory Optimization:</strong> AI forecasting
                  reduces dead stock by 15-20%
                </span>
              </li>
              <li className="tw:flex tw:gap-2">
                <BarChart3 className="tw:w-3.5 tw:h-3.5 tw:text-purple-500 tw:shrink-0 tw:mt-0.5" />
                <span>
                  <strong>Data Insights:</strong> Hyperlocal consumption
                  patterns improve category planning
                </span>
              </li>
              <li className="tw:flex tw:gap-2">
                <CreditCard className="tw:w-3.5 tw:h-3.5 tw:text-amber-500 tw:shrink-0 tw:mt-0.5" />
                <span>
                  <strong>Credit Access:</strong> Platform transaction history
                  unlocks working capital financing
                </span>
              </li>
              <li className="tw:flex tw:gap-2">
                <Receipt className="tw:w-3.5 tw:h-3.5 tw:text-emerald-500 tw:shrink-0 tw:mt-0.5" />
                <span>
                  <strong>Operational Efficiency:</strong> Auto-GST billing
                  saves ~25 hours/month admin time
                </span>
              </li>
            </ul>
          </AppCard>
        </div>

        {/* Verdict */}
        <div className="tw:bg-emerald-50 tw:border tw:border-emerald-200 tw:rounded-lg tw:p-4">
          <div className="tw:flex tw:items-start tw:gap-2">
            <CheckCircle className="tw:w-5 tw:h-5 tw:text-emerald-600 tw:shrink-0 tw:mt-0.5" />
            <p className="tw:text-sm tw:text-gray-700">
              <strong>Verdict:</strong> StoreKing delivers{" "}
              <strong className="tw:text-emerald-700">
                90%+ TCO reduction
              </strong>{" "}
              by eliminating inventory wastage, working capital lock-in, and
              manual overhead — delivering returns 100x the platform fee.
            </p>
          </div>
        </div>
      </div>

      {/* Inventory Intelligence */}
      <div className="tw:space-y-4">
        <h2 className="tw:text-lg tw:font-bold tw:text-gray-800">
          SK ROS Prevents{" "}
          <span className="tw:text-emerald-600">1% Inventory Wastage</span>{" "}
          Through Real-Time Intelligence
        </h2>

        <div className="tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-lg tw:p-3">
          <div className="tw:flex tw:items-start tw:gap-2">
            <AlertTriangle className="tw:w-4 tw:h-4 tw:text-amber-600 tw:shrink-0 tw:mt-0.5" />
            <p className="tw:text-xs tw:text-gray-700">
              <strong>The Problem:</strong> Traditional ERP solutions lack
              real-time dashboards, causing 1% wastage from dead stock = ₹6-60L
              annual loss per distributor.
            </p>
          </div>
        </div>

        <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-3 tw:gap-4">
          {/* Capabilities */}
          <div className="tw:lg:col-span-2">
            <AppCard noShadow bordered title="Real-Time Capabilities">
              <div className="tw:grid tw:grid-cols-1 sm:tw:grid-cols-2 tw:gap-4">
                {inventoryCapabilities.map((item, i) => (
                  <div key={i} className="tw:flex tw:gap-3">
                    <div
                      className={`tw:w-8 tw:h-8 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:shrink-0 ${item.bgColor}`}
                    >
                      <item.icon
                        className={`tw:w-4 tw:h-4 ${item.iconColor}`}
                      />
                    </div>
                    <div>
                      <p className="tw:font-semibold tw:text-sm tw:text-gray-800">
                        {item.title}
                      </p>
                      <p className="tw:text-xs tw:text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AppCard>
          </div>

          {/* Financial Impact */}
          <AppCard noShadow bordered>
            <p className="tw:text-sm tw:font-bold tw:text-red-600 tw:mb-1">
              The Financial Impact
            </p>
            <p className="tw:text-base tw:font-bold tw:text-gray-800 tw:mb-3">
              Eliminating 1% Wastage
            </p>
            <div className="tw:space-y-3">
              {wastageImpact.map((item, i) => (
                <div
                  key={i}
                  className="tw:flex tw:items-center tw:justify-between"
                >
                  <div>
                    <p className="tw:text-sm tw:font-medium tw:text-gray-700">
                      {item.tier}
                    </p>
                    <div className="tw:flex tw:items-center tw:gap-1 tw:mt-0.5">
                      <div className="tw:h-1.5 tw:w-12 tw:bg-red-200 tw:rounded-full">
                        <div
                          className="tw:h-1.5 tw:bg-red-500 tw:rounded-full"
                          style={{ width: "15%" }}
                        />
                      </div>
                      <span className="tw:text-xs tw:text-gray-400">
                        1% Loss: {item.loss}
                      </span>
                    </div>
                  </div>
                  <p className="tw:text-lg tw:font-bold tw:text-emerald-600">
                    {item.recovered}
                  </p>
                </div>
              ))}
            </div>
          </AppCard>
        </div>

        {/* AI & Working Capital */}
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
          <AppCard noShadow bordered>
            <p className="tw:font-bold tw:text-sm tw:text-gray-800 tw:mb-3">
              AI-Driven Intelligence
            </p>
            <div className="tw:space-y-2">
              {[
                { label: "Real-Time", vs: "24-48hr Lag" },
                { label: "Predictive", vs: "Reactive" },
                { label: "Mobile-First", vs: "Desktop" },
              ].map((item, i) => (
                <div key={i} className="tw:flex tw:items-center tw:gap-3">
                  <CheckCircle className="tw:w-4 tw:h-4 tw:text-emerald-500" />
                  <span className="tw:text-sm tw:font-semibold tw:text-emerald-600">
                    {item.label}
                  </span>
                  <span className="tw:text-xs tw:text-gray-400">vs</span>
                  <span className="tw:text-sm tw:text-gray-500">{item.vs}</span>
                </div>
              ))}
            </div>
          </AppCard>

          <AppCard noShadow bordered>
            <p className="tw:font-bold tw:text-sm tw:text-gray-800 tw:mb-3">
              Working Capital Impact
            </p>
            <div className="tw:flex tw:items-center tw:gap-3 tw:mb-2">
              <div className="tw:flex-1">
                <div className="tw:flex tw:justify-between tw:text-xs tw:mb-1">
                  <span className="tw:text-gray-500">Traditional</span>
                  <span className="tw:text-gray-600 tw:font-medium">
                    60 Days
                  </span>
                </div>
                <div className="tw:h-3 tw:bg-gray-200 tw:rounded-full" />
              </div>
              <div className="tw:flex-1">
                <div className="tw:flex tw:justify-between tw:text-xs tw:mb-1">
                  <span className="tw:text-emerald-600 tw:font-semibold">
                    SK ROS
                  </span>
                  <span className="tw:text-emerald-600 tw:font-medium">
                    35 Days
                  </span>
                </div>
                <div className="tw:h-3 tw:bg-emerald-500 tw:rounded-full" />
              </div>
            </div>
            <p className="tw:text-xs tw:text-gray-500">
              Reduces working capital needs by 25-35%, freeing ₹15-50L+ cash per
              distributor.
            </p>
          </AppCard>
        </div>

        {/* Strategic Verdict */}
        <div className="tw:bg-emerald-50 tw:border tw:border-emerald-200 tw:rounded-lg tw:p-4">
          <p className="tw:text-sm tw:font-bold tw:text-emerald-700 tw:mb-1">
            Strategic Verdict
          </p>
          <p className="tw:text-xs tw:text-gray-700">
            This is the difference between a billing system and an operating
            system. Traditional ERP digitizes transactions after they happen. SK
            ROS provides <strong>INTELLIGENCE</strong> to prevent wastage before
            it occurs. This 1% savings alone (₹6-60L) pays for the platform
            2-10x over.
          </p>
        </div>
      </div>

      <div className="tw:bg-gradient-to-r tw:from-emerald-50 tw:to-blue-50 tw:border tw:border-emerald-200 tw:rounded-lg tw:p-5 tw:flex tw:flex-col sm:tw:flex-row tw:items-center tw:justify-between tw:gap-4">
        <div>
          <p className="tw:font-bold tw:text-gray-800">
            Ready to optimize your distribution?
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

const traditionalERPProblems = [
  {
    title: "Disconnected Network",
    desc: "No visibility into retailer's actual shelf stock. Blind selling based on guesswork.",
  },
  {
    title: "Manual Order Chaos",
    desc: "Orders via Phone/WhatsApp lead to errors, missed items, and operational friction.",
  },
  {
    title: "Desktop-Bound",
    desc: "Field force has no real-time data access. Daily syncing delays decision making.",
  },
  {
    title: "Risky Manual Credit",
    desc: "Credit limits tracked in Excel/Mental notes. High risk of bad debt accumulation.",
  },
  {
    title: "Reactive Logistics",
    desc: "No real-time fleet tracking or route optimization. High cost to serve.",
  },
];

const skROSFeatures = [
  {
    title: "Real-Time Connected Network",
    desc: "Live inventory visibility at every retailer node. Know exactly when a retailer is running low before they call.",
    icon: Globe,
    bgColor: "tw:bg-blue-50",
    iconColor: "tw:text-blue-600",
  },
  {
    title: "PayLater Digital Ledger",
    desc: "Replaces Excel credit. Automated limits based on transaction history, reducing bad debt risk by 30%.",
    icon: CreditCard,
    bgColor: "tw:bg-emerald-50",
    iconColor: "tw:text-emerald-600",
  },
  {
    title: "Mobile Field Force Mgmt",
    desc: "Field executives plan beats, take digital orders, and see retailer history on-the-go. Zero data lag.",
    icon: Smartphone,
    bgColor: "tw:bg-purple-50",
    iconColor: "tw:text-purple-600",
  },
  {
    title: "Consumption Pattern Intel",
    desc: "Understand what's actually selling to consumers (secondary sales) to optimize purchasing mix.",
    icon: LineChart,
    bgColor: "tw:bg-amber-50",
    iconColor: "tw:text-amber-600",
  },
  {
    title: "Direct B2B Ordering",
    desc: "Retailers place orders via app, eliminating WhatsApp chaos. Automated routing to warehouse.",
    icon: ShoppingCart,
    bgColor: "tw:bg-red-50",
    iconColor: "tw:text-red-600",
  },
  {
    title: "Logistics & Smart Alerts",
    desc: "GPS fleet tracking + automated alerts for Fast/Slow moving stock to prevent dead inventory.",
    icon: Truck,
    bgColor: "tw:bg-teal-50",
    iconColor: "tw:text-teal-600",
  },
];

const roiTiers = [
  {
    name: "Small",
    credits: "₹50L / mo (₹6 Cr Annual)",
    traditionalCost: "₹18,00,000",
    skCost: "₹1,20,000",
    savings: "₹16.8 Lakh",
    reduction: "93%",
    dotColor: "tw:bg-emerald-500",
  },
  {
    name: "Medium",
    credits: "₹1.25 Cr / mo (₹15 Cr Annual)",
    traditionalCost: "₹45,00,000",
    skCost: "₹2,70,000",
    savings: "₹42.3 Lakh",
    reduction: "94%",
    dotColor: "tw:bg-blue-500",
  },
  {
    name: "Large",
    credits: "₹2.5 Cr / mo (₹30 Cr Annual)",
    traditionalCost: "₹90,00,000",
    skCost: "₹2,90,000",
    savings: "₹87.1 Lakh",
    reduction: "97%",
    dotColor: "tw:bg-purple-500",
  },
  {
    name: "Enterprise",
    credits: "₹5.0 Cr / mo (₹60 Cr Annual)",
    traditionalCost: "₹1.80 Cr",
    skCost: "₹2,90,000",
    savings: "₹1.77 Cr",
    reduction: "98%",
    dotColor: "tw:bg-amber-500",
  },
];

const inventoryCapabilities = [
  {
    title: "Real-Time Stock Visibility",
    desc: "SKU-level tracking updated instantly per transaction across all locations.",
    icon: PackageSearch,
    bgColor: "tw:bg-emerald-50",
    iconColor: "tw:text-emerald-600",
  },
  {
    title: "Fast vs Slow Classification",
    desc: "AI categorizes items by velocity. Color-coded dashboard highlights priorities.",
    icon: BarChart3,
    bgColor: "tw:bg-blue-50",
    iconColor: "tw:text-blue-600",
  },
  {
    title: "Dead Stock Alerts",
    desc: "Auto-warnings for 30/60/90 day dormancy. Suggests returns/markdowns.",
    icon: AlertTriangle,
    bgColor: "tw:bg-red-50",
    iconColor: "tw:text-red-600",
  },
  {
    title: "Consumption Analysis",
    desc: "Tracks seasonal patterns & micro-market trends to optimize mix.",
    icon: LineChart,
    bgColor: "tw:bg-purple-50",
    iconColor: "tw:text-purple-600",
  },
  {
    title: "Automated Reorder Pts",
    desc: "Calculates optimal levels per SKU. Prevents stockouts and overstocking.",
    icon: RefreshCw,
    bgColor: "tw:bg-amber-50",
    iconColor: "tw:text-amber-600",
  },
  {
    title: "Demand Forecasting",
    desc: "Predicts future demand using history + seasonality. Improves accuracy 60%.",
    icon: TrendingUp,
    bgColor: "tw:bg-teal-50",
    iconColor: "tw:text-teal-600",
  },
];

const wastageImpact = [
  {
    tier: "Small Distributor",
    gmv: "₹6 Cr GMV",
    loss: "₹6L",
    recovered: "₹6 Lakh",
  },
  {
    tier: "Medium Distributor",
    gmv: "₹15 Cr GMV",
    loss: "₹15L",
    recovered: "₹15 Lakh",
  },
  {
    tier: "Large Distributor",
    gmv: "₹30 Cr GMV",
    loss: "₹30L",
    recovered: "₹30 Lakh",
  },
  {
    tier: "Enterprise",
    gmv: "₹60 Cr GMV",
    loss: "₹60L",
    recovered: "₹60 Lakh",
  },
];
