import React from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";

interface FinancialTaxCardProps {
  data: {
    gstNo: string;
    panNo: string;
  };
}

const FinancialTaxCard: React.FC<FinancialTaxCardProps> = ({ data }) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppCard title={t("financialAndTaxDetails")} icon="file-text">
      <KeyValue label={t("gstNo")} size="sm" className="tw:mb-4">
        {data.gstNo || t("nA")}
      </KeyValue>

      <KeyValue label={t("panNo")} size="sm">
        {data.panNo || t("nA")}
      </KeyValue>
    </AppCard>
  );
};

export default FinancialTaxCard;
