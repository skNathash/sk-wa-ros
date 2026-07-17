import { Award } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  points?: number | null;
  className?: string;
};

const CustomerPoints = ({ points, className }: Props) => {
  const { t } = useTranslation(["posbilling"]);

  if (points == null) return null;

  return (
    <div
      className={`tw:flex tw:items-center tw:gap-2 tw:text-xs ${
        className || ""
      }`}
    >
      <Award size={14} />
      <div>
        <span className="wa-mono">
          {t("checkoutModal.customer.customerCard.pointsCount", {
            count: points,
            defaultValue: `${points} points`,
          })}
        </span>
      </div>
    </div>
  );
};

export default CustomerPoints;
