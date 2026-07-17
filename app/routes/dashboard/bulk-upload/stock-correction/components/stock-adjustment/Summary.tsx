import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import { CheckCircle, AlertTriangle, Package } from "lucide-react";

interface SummaryProps {
  valid: number;
  invalid: number;
  total: number;
}

const Summary: React.FC<SummaryProps> = ({ valid, invalid, total }) => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3 tw:mb-4">
      <AppStatsCard label="Valid Records" icon={<CheckCircle />} color="success" template={2}>
        <div className="tw:text-xl tw:font-bold tw:text-green-600">{valid}</div>
        <div className="tw:text-xs tw:text-gray-500">Ready to process</div>
      </AppStatsCard>
      <AppStatsCard label="Invalid Records" icon={<AlertTriangle />} color="danger" template={2}>
        <div className="tw:text-xl tw:font-bold tw:text-red-600">{invalid}</div>
        <div className="tw:text-xs tw:text-gray-500">Need attention</div>
      </AppStatsCard>
      <AppStatsCard label="Total Records" icon={<Package />} color="info" template={2}>
        <div className="tw:text-xl tw:font-bold tw:text-blue-600">{total}</div>
        <div className="tw:text-xs tw:text-gray-500">In this batch</div>
      </AppStatsCard>
    </div>
  );
};

export default Summary;
