import useScreenView from "~/hooks/useScreenView";
import MobileView from "./MobileView";
import DesktopView from "./DesktopView";
import AppCard from "~/components/core/card/AppCard";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import {
  ArrowLeft,
  Check,
  FileText,
  Package,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import { useEffect, useState } from "react";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import SellerCatalogService from "~/services/SellerCatalogService";
import PlatformFeeInfo from "~/shared/catalog/components/PlatformFeeInfo";
import FranchiseService from "~/services/FranchiseService";
import AuthService from "~/services/AuthService";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";

const Preview = ({
  products,
  validProductCount,
  invalidProductCount,
  callback,
}: {
  products: any[];
  validProductCount: number;
  invalidProductCount: number;
  callback: (a: { action: string; data?: any }) => void;
}) => {
  const appToast = useAppToast();

  const isMasterLogin = AuthService.isMasterLogin();
  const isMasterWithFullAccess = AuthService.isMasterLoginWithFullAccess();
  const canSubmit = !isMasterLogin || isMasterWithFullAccess;

  const { isMobile } = useScreenView();

  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const [busyLoader, setBusyLoader] = useState({
    show: false,
    message: "",
  });

  const appNav = useAppNav();

  const [commissionInfo, setCommissionInfo] = useState({
    commissionAmount: 0,
    commissionPercentage: 0,
    planName: "",
    planType: "",
    typeOfPlan: "",
    availableAmount: 0,
    hasSufficientBalance: true,
    isCalculating: false,
  });

  const handleBackToUpload = () => {
    callback({ action: "back" });
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      appToast.show({ msg: "Master login users cannot submit.", color: "error" });
      return;
    }
    setShowSubmitDialog(true);
  };

  const handleBuyPlan = () => {
    appNav.to(FranchiseService.getBuyPlanLink());
  };

  const doUpload = async () => {
    setShowSubmitDialog(false);

    await new Promise((resolve) => setTimeout(resolve, 300));

    setBusyLoader({ show: true, message: "Uploading stock..." });

    const payload = {
      productList: products
        .filter((p) => p.status === "VALID")
        .map((p) => ({
          dealId: p.dealId,
          dealName: p.dealName,
          dealRefId: p.dealRefId,
          qty: p.qty,
          mrp: p.mrp,
          purchasePrice: p.purchasePrice,
          remarks: "Bulk Upload",
        })),
    };

    const resp = await SellerCatalogService.addStocksInventory(payload);

    setBusyLoader({ show: false, message: "" });

    await new Promise((resolve) => setTimeout(resolve, 100));

    if (resp?.statusCode === 200) {
      appToast.show({
        msg: "Upload successful",
        color: "success",
      });
      callback({ action: "submit" });
    } else {
      appToast.show({
        msg: resp?.data?.message || "Upload failed",
        color: "danger",
      });
    }
  };

  // calculate commission for valid products whenever products change
  useEffect(() => {
    const validDeals = (products || []).filter((p) => p.status === "VALID");
    if (!validDeals || validDeals.length === 0) {
      setCommissionInfo((prev) => ({ ...prev, commissionAmount: 0, isCalculating: false }));
      return;
    }

    const deals = validDeals.map((p) => ({
      dealId: p.dealId,
      quantity: Number(p.qty) || 0,
      purchasePrice: Number(p.purchasePrice) || 0,
      mrp: Number(p.mrp) || 0,
    }));

    let mounted = true;
    const fetch = async () => {
      setCommissionInfo((prev) => ({ ...prev, isCalculating: true }));
      try {
        const payload = { deals };
        const result = await FranchiseService.getChargeByDeal(payload);
        if (!mounted) return;
        setCommissionInfo({
          commissionAmount: result.commissionAmount || 0,
          commissionPercentage: result.commissionPercentage || 0,
          planName: result.planName || "",
          planType: result.planType || "",
          typeOfPlan: result.typeOfPlan || "",
          availableAmount: result.availableAmount || 0,
          hasSufficientBalance: result.hasSufficientBalance ?? true,
          isCalculating: false,
        });
      } catch (err) {
        if (!mounted) return;
        console.error("Error calculating commission:", err);
        setCommissionInfo((prev) => ({
          ...prev,
          commissionAmount: 0,
          commissionPercentage: 0,
          hasSufficientBalance: true,
          isCalculating: false,
        }));
      }
    };

    fetch();
    return () => {
      mounted = false;
    };
  }, [products]);

  const handleItemCallback = (a: { action: string; data?: any }) => {
    if (a.action === "remove") {
      callback({ action: "remove", data: { index: a.data.index } });
    }
  };

  return (
    <>
      <AppCard
        noContentPadding
        title="Preview Overall Uploaded Data"
        icon={<FileText />}
        subtitle="Review the data below before submitting."
      >
        {/* Summary Stats Cards */}
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3 tw:mb-4 tw:mx-4">
          <AppStatsCard
            label="Valid Products"
            icon={<CheckCircle />}
            color="success"
            template={2}
          >
            <div className="tw:text-xl tw:font-bold tw:text-green-600">
              {validProductCount}
            </div>
            <div className="tw:text-xs tw:text-gray-500">Ready to upload</div>
          </AppStatsCard>

          <AppStatsCard
            label="Invalid Products"
            icon={<AlertTriangle />}
            color="danger"
            template={2}
          >
            <div className="tw:text-xl tw:font-bold tw:text-red-600">
              {invalidProductCount}
            </div>
            <div className="tw:text-xs tw:text-gray-500">Need attention</div>
          </AppStatsCard>

          <AppStatsCard
            label="Total Products"
            icon={<Package />}
            color="info"
            template={2}
          >
            <div className="tw:text-xl tw:font-bold tw:text-blue-600">
              {products.length}
            </div>
            <div className="tw:text-xs tw:text-gray-500">In this batch</div>
          </AppStatsCard>
        </div>

        {isMobile ? (
          <MobileView products={products} callback={handleItemCallback} />
        ) : (
          <DesktopView products={products} callback={handleItemCallback} />
        )}
      </AppCard>
        {/* Platform Fee Info: show when commission applies or calculating */}
        {(commissionInfo.commissionAmount > 0 || commissionInfo.isCalculating) && (
          <div className="tw:my-3">
            <PlatformFeeInfo
              commissionAmount={commissionInfo.commissionAmount}
              commissionPercentage={commissionInfo.commissionPercentage}
              planName={commissionInfo.planName}
              planType={commissionInfo.planType}
              typeOfPlan={commissionInfo.typeOfPlan}
              availableAmount={commissionInfo.availableAmount}
              hasSufficientBalance={commissionInfo.hasSufficientBalance}
              calculating={commissionInfo.isCalculating}
              onBuyPlan={handleBuyPlan}
            />
          </div>
        )}
      <div className="tw:sticky tw:bottom-0 tw:bg-white tw:p-4">
        <div className="tw:flex tw:justify-end tw:mt-4 tw:gap-2">
          <AppButton
            color="light"
            size="small"
            fill="outline"
            onClick={handleBackToUpload}
          >
            <ArrowLeft size={16} />
            Back to Upload
          </AppButton>

          <AppButton
            color="success"
            size="small"
            fill="solid"
            onClick={handleSubmit}
            disabled={commissionInfo.hasSufficientBalance === false}
          >
            <Check size={16} />
            Submit
          </AppButton>
        </div>
      </div>

      <AppAlertDialog
        show={showSubmitDialog}
        title="Submit Stock"
        description="Are you sure you want to submit the stock?"
        onConfirm={doUpload}
        onCancel={() => setShowSubmitDialog(false)}
      />

      <BusyLoader show={busyLoader.show} message={busyLoader.message} />
    </>
  );
};

export default Preview;
