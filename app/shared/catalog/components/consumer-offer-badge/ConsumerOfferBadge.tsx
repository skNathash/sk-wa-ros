import clsx from "clsx";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";

const ConsumerOfferBadge = ({ size = "sm" }: { size?: "sm" | "md" | "lg" }) => {
  const { t } = useTranslation(["common"]);
  return (
    <AppBadge variant="warning">
      <span
        className={clsx("tw:font-medium tw:uppercase", {
          "tw:text-xs tw:leading-none": size === "sm",
          "tw:text-base": size === "lg",
        })}
      >
        {t("offer")}
      </span>
    </AppBadge>
  );
};

export default ConsumerOfferBadge;
