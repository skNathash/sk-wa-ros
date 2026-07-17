import React, { useEffect, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import { ClipboardList } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";
import SellerService from "~/services/SellerService";
import PickingSummary from "./PickingSummary";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";

interface PickingLogItem {
  _id: string;
  createdBy: { name: string };
  totalPickedQty: number;
  pickingStartedOn: string; // ISO date
  order?: {
    id: string;
    orderRefNo: string;
    orderedDate: string;
  };
}

interface PickingLogModalProps {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  dealId?: string;
  binId?: string;
  binName?: string;
  productName?: string;
  selectedStockUom?: string;
}

// empty initial; will be populated from API
// note: PickingLogItem shape may vary from API; adjust as needed

const PickingLogModal: React.FC<PickingLogModalProps> = ({
  show,
  callback,
  dealId,
  binId,
  binName,
  productName,
  selectedStockUom,
}) => {
  const { isMobile } = useScreenView();
  const [logs, setLogs] = useState<PickingLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState({
    totalPickedUnits: 0,
    totalPickingSessions: 0,
  });

  const handleClose = () => {
    callback({ action: "close" });
  };

  useEffect(() => {
    const fetchLogs = async () => {
      // Only fetch when modal is shown and required ids are present
      if (!show) return;
      setLoading(true);
      try {
        const franchiseId = AuthService.getLoggedInUserId();
        if (typeof franchiseId === "string" && franchiseId && dealId) {
          // default filter per requirement
          const baseFilter = {
            isPacked: false,
            status: { $in: ["Completed", "Partially Completed"] },
          } as const;

          // Prepare params for getPickingList
          const params: Record<string, any> = { filter: baseFilter };
          if (binId) {
            // Bin-wise listing
            params.listBy = "binWise";
            params.binId = binId;
          }

          const resAny: any = await SellerService.getPickingList(
            franchiseId,
            dealId,
            params
          );

          if (resAny && resAny.statusCode === 200) {
            // API might return res.data as an array or { data: [...] }
            const dataArr: any[] = Array.isArray(resAny.data?.data)
              ? resAny.data?.data
              : [];
            setLogs(dataArr as PickingLogItem[]);

            // Calculate summary
            const totalPickedUnits = dataArr.reduce(
              (sum, item) => sum + (item.totalPickedQty || 0),
              0
            );
            setSummary({
              totalPickedUnits,
              totalPickingSessions: dataArr.length,
            });
          } else {
            setLogs([]);
            setSummary({
              totalPickedUnits: 0,
              totalPickingSessions: 0,
            });
          }
        } else {
          setLogs([]);
          setSummary({
            totalPickedUnits: 0,
            totalPickingSessions: 0,
          });
        }
      } catch (e) {
        setLogs([]);
        setSummary({
          totalPickedUnits: 0,
          totalPickingSessions: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [show, dealId, binId]);

  return (
    <AppModal
      show={show}
      callback={handleClose}
      className="tw:h-[90vh] tw:!max-w-4xl"
    >
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center">
          <ClipboardList className="tw:w-5 tw:h-5 tw:mr-2 tw:text-primary" />
          <div className="tw:flex tw:flex-col">
            <span>Picking Log - {productName}</span>
            {binId && (
              <span className="tw:text-sm tw:text-gray-600 tw:font-normal">
                Bin: {binName || binId}
              </span>
            )}
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[80vh]">
        <PickingSummary
          summary={summary}
          binId={binId}
          selectedStockUom={selectedStockUom}
        />
        {isMobile ? (
          <MobileView
            data={logs}
            loading={loading}
            selectedStockUom={selectedStockUom}
          />
        ) : (
          <DesktopView
            data={logs}
            loading={loading}
            selectedStockUom={selectedStockUom}
          />
        )}
      </AppModal.Content>

      <AppModal.Footer className="tw:shadow-inner tw:bg-gray-50/70">
        <div className="tw:flex tw:justify-end tw:gap-3 tw:px-2">
          <AppButton color="dark" fill="outline" onClick={handleClose}>
            Close
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default PickingLogModal;
