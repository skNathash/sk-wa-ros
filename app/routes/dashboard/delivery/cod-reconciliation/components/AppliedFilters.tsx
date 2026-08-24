import { useTranslation } from "react-i18next";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import type { AppliedFilterLabel } from "~/types/CommonTypes";

interface AppliedFiltersProps {
  dateRange?: Date[] | null;
  callback: (data: any) => void;
}

/**
 * The collected-on range, echoed back as a removable chip. The date input in
 * the top strip collapses to its placeholder once the popover closes on
 * narrow screens, so without this the only sign a range is active is a
 * shorter list — and a summary missing its pending card.
 */
const AppliedFilters: React.FC<AppliedFiltersProps> = ({
  dateRange,
  callback,
}) => {
  const { t } = useTranslation(["common"]);

  const mapping: Record<string, AppliedFilterLabel> = {
    dateRange: {
      label: t("collectedDate"),
      type: "dateRange",
      resetValue: null,
      dateFormat: "dd MMM yyyy",
    },
  };

  const handleCallback = (result: { action: string; data?: any }) => {
    if (result.action === "remove") {
      callback({ formData: { dateRange: null } });
    }
  };

  return (
    <AppliedFilter
      filter={{ dateRange: dateRange ?? null }}
      mapping={mapping}
      callback={handleCallback}
      className="tw:mb-4"
    />
  );
};

export default AppliedFilters;
