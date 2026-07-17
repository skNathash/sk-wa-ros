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
            <span className="tw:text-xs tw:text-gray-500 tw:uppercase">
              {t("openingBalance")}
            </span>
            <div className="tw:mt-1 tw:text-base tw:font-bold tw:text-gray-900">
              <Amount value={opening} />
            </div>
          </div>
        </div>

        <div className="tw:flex-1 tw:bg-gray-50/50 tw:border-l">
          <div className="tw:p-1 tw:md:p-2">
            <div className="tw:pl-2">
              <span className="tw:text-xs tw:text-gray-500 tw:uppercase">
                {t("closingBalance")}
              </span>
              <div className="tw:mt-1 tw:text-base tw:font-bold tw:text-emerald-600">
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
