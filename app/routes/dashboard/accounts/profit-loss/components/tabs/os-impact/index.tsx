import FeatureImpact from "./components/feature-impact/FeatureImpact";
import OsValueHero from "./components/os-value-hero/OsValueHero";
import SubscriptionRoi from "./components/subscription-roi/SubscriptionRoi";

/**
 * "StoreKing OS impact" — the part of the month's profit the platform itself
 * accounts for: the headline figure, the feature-by-feature working behind it,
 * and what it comes to against the subscription it is billed on.
 *
 * Every block owns its own data through its `helper.ts`; the tab only lays them
 * out.
 */
const OsImpactTab = () => (
  <>
    <OsValueHero />

    <FeatureImpact />

    <SubscriptionRoi />
  </>
);

export default OsImpactTab;
