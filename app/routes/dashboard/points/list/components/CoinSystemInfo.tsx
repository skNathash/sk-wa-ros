import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Coins, Calculator, Gift, Info, Ban } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import Amount from "~/components/core/amount/Amount";
import clsx from "clsx";
import ImgRender from "~/components/core/img/ImgRender";
import LoyaltyRewardService, {
  type RewardConfig,
  type RewardExcludeItem,
} from "~/services/LoyaltyRewardService";

// Fallbacks used only until the reward config loads (or if it fails)
const DEFAULT_THRESHOLD = 100;
const DEFAULT_POINTS = 1;

const CoinSystemInfo = () => {
  const { t } = useTranslation(["kingcoins"]);

  const [config, setConfig] = useState<RewardConfig | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const r = await LoyaltyRewardService.getRewardConfig();
      const parsed = LoyaltyRewardService.parseRewardConfig(r);
      if (active && parsed) setConfig(parsed);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Earning rule from the API, falling back to the original static values
  const threshold = config?.amountThreshold || DEFAULT_THRESHOLD;
  const pointsPerThreshold = config?.pointsPerAmount || DEFAULT_POINTS;
  const thresholdLabel = `₹${threshold}`;

  // Build examples from the live rule: spend N thresholds => N * points coins
  const calculationExamples = useMemo(() => {
    return [1, 2, 3, 5, 10].map((multiplier) => ({
      orderValue: threshold * multiplier,
      coins: pointsPerThreshold * multiplier,
    }));
  }, [threshold, pointsPerThreshold]);

  // Grouped exclusions for the info section (only non-empty groups are shown)
  const excludeGroups = useMemo(
    () =>
      [
        { key: "menu", label: t("excludeMenu", "Menu"), items: config?.excludeMenu },
        {
          key: "category",
          label: t("excludeCategory", "Category"),
          items: config?.excludeCategory,
        },
        { key: "brand", label: t("excludeBrand", "Brand"), items: config?.excludeBrand },
      ].filter((g) => (g.items?.length ?? 0) > 0) as {
        key: string;
        label: string;
        items: RewardExcludeItem[];
      }[],
    [config, t]
  );

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6 tw:mb-6">
        <div>
          <AppCard>
            <div className="tw:flex tw:items-start tw:space-x-3">
              <div className="tw:shrink-0 tw:bg-blue-100 tw:rounded-sm tw:flex tw:items-center tw:justify-center tw:p-1">
                <Coins className=" tw:text-blue-600" size={32} />
              </div>
              <div className="tw:flex-1">
                <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:mb-1">
                  {t("earningTitle")}{" "}
                </h3>
                <p className="tw:text-sm tw:text-gray-600">
                  {t("get", "Get")}{" "}
                  <span className="tw:font-semibold tw:text-green-600">
                    {pointsPerThreshold}
                    <ImgRender
                      src="kingcoins/logo.png"
                      className="tw:h-4 tw:ml-1"
                    />
                  </span>{" "}
                  {t("forYourFirst", {
                    amount: thresholdLabel,
                    defaultValue: "for your first",
                  })}{" "}
                  {t("then", "then")}{" "}
                  <span className="tw:font-semibold tw:text-green-600 tw:inline-flex tw:items-center">
                    {pointsPerThreshold}
                    <ImgRender
                      src="kingcoins/logo.png"
                      className="tw:h-4 tw:ml-1"
                    />
                  </span>{" "}
                  {t("forEvery", {
                    amount: thresholdLabel,
                    defaultValue: "for every",
                  })}
                </p>
                <div className="tw:mt-2 tw:p-2 tw:bg-green-50 tw:rounded tw:border-l-4 tw:border-green-400">
                  <p className="tw:text-xs tw:text-green-800 tw:font-medium">
                    {t("coinValueNote")}
                  </p>
                </div>
              </div>
            </div>
          </AppCard>

          <AppCard className="tw:mb-0">
            <div className="tw:space-y-4">
              <div className="tw:flex tw:items-start tw:space-x-3">
                <div className="tw:flex-shrink-0 tw:bg-orange-100 tw:rounded-sm tw:flex tw:items-center tw:justify-center tw:p-1">
                  <Gift className=" tw:text-orange-600" size={32} />
                </div>
                <div>
                  <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:mb-1">
                    {t("redeemTitle", "Redeeming Coins")}
                  </h3>
                  <p className="tw:text-sm tw:text-gray-600">
                    {t("redeemDescription")}
                  </p>
                </div>
              </div>
            </div>
          </AppCard>
        </div>

        <AppCard className="tw:mb-0">
          {/* Quick Reference */}

          <div className="tw:flex tw:items-center tw:space-x-2 tw:mb-3">
            <Calculator className="tw:w-4 tw:h-4 tw:md:w-5 tw:md:h-5 tw:text-gray-600" />
            <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900">
              {t("quickReference", "Quick Reference")}
            </h3>
          </div>
          <div className="tw:space-y-2 tw:text-xs tw:md:text-sm">
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-gray-600">
                {t("quickReference_firstLabel", {
                  amount: thresholdLabel,
                  defaultValue: "For your first {{amount}}",
                })}
              </span>
              <span className="tw:font-semibold tw:text-green-600 tw:inline-flex tw:items-center">
                {pointsPerThreshold}
                <ImgRender
                  src="kingcoins/logo.png"
                  className="tw:h-4 tw:ml-1"
                />
              </span>
            </div>
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-gray-600">
                {t("quickReference_everyLabel", {
                  amount: thresholdLabel,
                  defaultValue: "For every {{amount}}",
                })}
              </span>
              <span className="tw:font-semibold tw:text-green-600 tw:inline-flex tw:items-center">
                {pointsPerThreshold}
                <ImgRender
                  src="kingcoins/logo.png"
                  className="tw:h-4 tw:ml-1"
                />
              </span>
            </div>
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-gray-600">
                {t("quickReference_coinValueLabel")}
              </span>
              <span className="tw:font-semibold tw:text-blue-600">
                {t("quickReference_coinValueValue")}
              </span>
            </div>
            <div className="tw:border-t-2 tw:border-t-dashed tw:border-gray-200 tw:pt-2 tw:mt-2">
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-gray-600">
                  {t("quickReference_redemptionLabel")}
                </span>
                <span className="tw:font-semibold tw:text-orange-600 tw:text-xs">
                  {t("quickReference_redemptionValue")}
                </span>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <AppCard className="tw:mb-6">
        <div className="tw:space-y-6">
          {/* Calculation Examples */}
          <div>
            <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:mb-4 tw:flex tw:items-center tw:space-x-2">
              <Calculator className="tw:w-4 tw:h-4" />
              <span>{t("calculationExamplesTitle")}</span>
            </h3>

            {/* Desktop Table View */}
            <div className="tw:hidden tw:md:block tw:overflow-x-auto">
              <table className="tw:w-full tw:border-collapse">
                <thead>
                  <tr className="tw:border-b tw:border-gray-200">
                    <th className="tw:text-left tw:py-2 tw:px-3 tw:text-xs tw:font-medium tw:text-gray-500 tw:uppercase tw:tracking-wider">
                      {t("table.orderValue")}
                    </th>
                    <th className="tw:text-left tw:py-2 tw:px-3 tw:text-xs tw:font-medium tw:text-gray-500 tw:uppercase tw:tracking-wider">
                      {t("table.coinsEarned")}
                    </th>
                    {/* <th className="tw:text-left tw:py-2 tw:px-3 tw:text-xs tw:font-medium tw:text-gray-500 tw:uppercase tw:tracking-wider">
                    {t("table.breakdown")}
                  </th> */}
                  </tr>
                </thead>
                <tbody className="tw:divide-y tw:divide-gray-100">
                  {calculationExamples.map((example, index) => (
                    <tr key={index} className="tw:hover:bg-gray-50">
                      <td className="tw:py-3 tw:px-3">
                        <Amount
                          value={example.orderValue}
                          className="tw:font-semibold tw:text-gray-900"
                        />
                      </td>
                      <td className="tw:py-3 tw:px-3">
                        <span className="tw:font-semibold tw:text-green-600">
                          {example.coins}{" "}
                        </span>
                        <ImgRender
                          src="kingcoins/logo.png"
                          className="tw:h-4"
                        />
                      </td>
                      {/* <td className="tw:py-3 tw:px-3 tw:text-sm tw:text-gray-600">
                      {example.description}
                    </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="tw:md:hidden tw:space-y-3">
              {calculationExamples.map((example, index) => (
                <div
                  key={index}
                  className={clsx(
                    "tw:bg-white  tw:border-gray-200 tw:p-3",

                    index === calculationExamples.length - 1
                      ? ""
                      : "tw:border-b",
                  )}
                >
                  <div className="tw:flex tw:justify-between tw:items-center">
                    <Amount
                      value={example.orderValue}
                      className="tw:font-semibold tw:text-gray-900 tw:text-sm"
                    />
                    <span className="tw:inline-flex tw:items-center tw:px-2 tw:py-1 tw:rounded-full tw:text-xs tw:font-medium tw:bg-green-100 tw:text-green-800">
                      {example.coins} {t("coin", { count: example.coins })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppCard>

      {/* Exclusions (info only) — these do not earn coins */}
      {excludeGroups.length > 0 && (
        <AppCard className="tw:mb-6">
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
            <Ban className="tw:w-4 tw:h-4 tw:text-red-500 tw:shrink-0" />
            <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900">
              {t("exclusionsTitle", "Excluded from Coin Rewards")}
            </h3>
            <span className="tw:text-xs tw:text-gray-400">
              {t(
                "exclusionsSubtitle",
                "Orders with the following items will not earn coins.",
              )}
            </span>
          </div>
          <div className="tw:divide-y tw:divide-gray-100">
            {excludeGroups.map((group) => (
              <div
                key={group.key}
                className="tw:flex tw:items-baseline tw:gap-2 tw:py-1.5"
              >
                <span className="tw:shrink-0 tw:w-20 tw:text-xs tw:font-medium tw:text-gray-500 tw:uppercase tw:tracking-wider">
                  {group.label}
                </span>
                <div className="tw:flex tw:flex-wrap tw:gap-1">
                  {group.items.map((item) => (
                    <span
                      key={item.id || item.refId}
                      className="tw:inline-flex tw:items-center tw:px-1.5 tw:py-0.5 tw:rounded tw:text-xs tw:font-medium tw:bg-red-50 tw:text-red-700"
                    >
                      {item.name || item.refId}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      )}

      {/* Important Notes */}
      <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:p-3 tw:md:p-4">
        <div className="tw:flex tw:items-start tw:space-x-3">
          <Info className="tw:w-4 tw:h-4 tw:md:w-5 tw:md:h-5 tw:text-blue-600 tw:flex-shrink-0 tw:mt-0.5" />
          <div>
            <h4 className="tw:text-sm tw:font-semibold tw:text-blue-900 tw:mb-2">
              {t("importantNotesTitle")}
            </h4>
            <ul className="tw:text-xs tw:md:text-sm tw:text-blue-800 tw:space-y-1">
              <li>{t("note_1")}</li>
              <li>{t("note_2")}</li>
              <li>{t("note_3")}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default CoinSystemInfo;
