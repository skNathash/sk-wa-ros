import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import PurchaseOrderService from "~/services/PurchaseOrderService";

interface DueSummaryData {
  totalAmount: number;
  invoiceCount: number;
  sellerCount: number;
  vendorCount: number;
  days: number;
}

// TODO: adjust mapping once the actual `dueSoon` response structure is shared.
const mapDueSummary = (data: any): DueSummaryData => ({
  totalAmount: Number(data?.totalAmount) || 0,
  invoiceCount: Number(data?.invoiceCount) || 0,
  sellerCount: Number(data?.sellerCount) || 0,
  vendorCount: Number(data?.vendorCount) || 0,
  days: Number(data?.days) || 14,
});

/**
 * "Next 14 days · Due" summary with a bulk Pay all action.
 * Fetches the insights block and reads `dueSoon`.
 */
const DueSummary = () => {
  const [summary, setSummary] = useState<DueSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const fetchDueSummary = async () => {
      try {
        setLoading(true);
        const response = await PurchaseOrderService.getDashboardInsights({
          filter: { type: "dueSoon" },
        });
        if (!active) return;
        setSummary(mapDueSummary(response.data?.data?.dueSoon));
      } catch (error) {
        console.error("Due summary insights error:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDueSummary();
    return () => {
      active = false;
    };
  }, []);

  if (loading || !summary) return null;

  return (
    <div className="tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70 tw:border-t-2 tw:border-[#8B4513]">
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div>
          <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
            Next {summary.days} days · Due
          </p>
          <Amount
            value={summary.totalAmount}
            className="tw:mt-1 tw:block tw:text-2xl tw:font-bold tw:text-slate-900"
          />
          <p className="tw:mt-0.5 tw:text-xs tw:text-gray-500">
            {summary.invoiceCount} invoices · {summary.sellerCount} to sellers ·{" "}
            {summary.vendorCount} to vendors
          </p>
        </div>
        <AppButton
          size="small"
          color="primary"
          className="tw:rounded-full tw:shrink-0"
        >
          Pay all
        </AppButton>
      </div>
    </div>
  );
};

export default DueSummary;
