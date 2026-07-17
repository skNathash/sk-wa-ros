import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";

interface BalanceDisplayProps {
  opening: number;
  closing: number;
}

const BalanceDisplay = ({ opening, closing }: BalanceDisplayProps) => {
  const { t } = useTranslation();

  return (
    <AppCard noPadding className="tw:border-l-4 tw:border-l-primary tw:mb-2">
      <div className="tw:grid tw:grid-cols-2">
        <div className="tw:flex-1 tw:bg-white tw:p-1 tw:md:p-2">
          <div className="tw:pl-2">
            <span className="wa-section-label">{t("openingBalance")}</span>
            <div className="wa-amount tw:mt-1 tw:text-base tw:font-bold tw:text-foreground">
              <Amount value={opening} />
            </div>
          </div>
        </div>

        <div className="tw:flex-1 tw:border-l tw:bg-gray-50/50">
          <div className="tw:p-1 tw:md:p-2">
            <div className="tw:pl-2">
              <span className="wa-section-label">{t("closingBalance")}</span>
              <div className="wa-amount tw:mt-1 tw:text-base tw:font-bold tw:text-[color:var(--wa-domain-in)]">
                <Amount value={closing} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default BalanceDisplay;
