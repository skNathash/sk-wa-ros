import { FileText } from "lucide-react";
import React, { useState } from "react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";

interface BulkUploadProduct {
  name: string;
  brand: string;
  category: string;
  mrp: number;
  price: number;
  unit: string;
  barcode: string;
  qty: number;
  status?: string;
  importId?: string;
  dealId?: string;
  dealRef?: string;
  dealRefId?: string;
  hsn?: string;
  hsnNumber?: string;
  gst?: number;
  tax?: number;
  images?: string[];
  isSubscribed?: boolean;
}

interface PreviewProps {
  products: BulkUploadProduct[];
  fileName?: string;
  callback?: (params: { action: string; data?: any }) => void;
  commission?: number;
  mode?: "detailed" | "dealId";
}

const Preview: React.FC<PreviewProps> = ({
  products,
  fileName = "product_upload_template.csv",
  callback,
  commission,
  mode = "detailed",
}) => {
  const { isMobile } = useScreenView();
  const appToast = useAppToast();
  const [submitting, setSubmitting] = useState(false);

  // AppAlertDialog state
  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    successCb: () => void;
    cancelCb: () => void;
  }>({
    show: false,
    title: "",
    description: "",
    successCb: () => {},
    cancelCb: () => {},
  });

  const subscribedCount = products.filter(
    (p) =>
      p.isSubscribed &&
      String((p as any).status || "").toUpperCase() !== "INVALID",
  ).length;
  const invalidCount = products.filter(
    (p) => String((p as any).status || "").toUpperCase() === "INVALID",
  ).length;
  const validProducts =
    mode === "dealId"
      ? products.filter((p) => {
          const status = String((p as any).status || "").toUpperCase();
          return status === "VALID" && !p.isSubscribed;
        })
      : products;
  const validCount = validProducts.length;

  // API call logic from import/list/index.tsx
  const handleSubmitForReview = async () => {
    if (!validProducts.length) {
      appToast.show({
        msg: "No valid records to submit",
        color: "danger",
      });
      return;
    }

    setAppAlertDialog({
      show: true,
      title: mode === "dealId" ? "Subscribe" : "Submit Products for Review",
      description:
        mode === "dealId"
          ? `Are you sure you want to add ${validProducts.length} deal(s) to cart?${invalidCount > 0 ? ` ${invalidCount} invalid row(s) will be skipped.` : ""}${subscribedCount > 0 ? ` ${subscribedCount} already-subscribed row(s) will be skipped.` : ""}`
          : `Are you sure you want to submit ${validProducts.length} products for review?${invalidCount > 0 ? ` ${invalidCount} invalid row(s) will be skipped.` : ""}${subscribedCount > 0 ? ` ${subscribedCount} already-subscribed row(s) will be skipped.` : ""}`,
      successCb: async () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        setSubmitting(true);
        try {
          if (mode === "dealId") {
            const products = validProducts.map((p) => {
              const hsnVal = p.hsn || p.hsnNumber;
              const gstVal = p.gst ?? p.tax;
              return {
                dealId: p.dealId || "",
                dealRefId: p.dealRefId || "",
                name: p.name,
                quantity: 0,
                mrp: p.mrp,
                price: p.mrp,
                images: p.images || [],
                barcodes: p.barcode ? [p.barcode] : [],
                ...(hsnVal ? { hsnNumber: hsnVal } : {}),
                ...(gstVal !== undefined && gstVal !== null && gstVal !== 0
                  ? { gst: Number(gstVal) }
                  : {}),
              };
            });

            const resp =
              await InventorySubscribeService.bulkSubscription(products);
            if (resp?.statusCode !== 200) {
              appToast.show({
                msg: resp?.data?.message || "Submit failed",
                color: "danger",
              });
              setSubmitting(false);
              return;
            }

            const subscribedProducts = resp.data?.data?.cart?.products || [];
            const localCartData: Array<{
              dealId: string;
              dealName: string;
              quantity: number;
              price: number;
              images: string[];
              itemId: string;
            }> = subscribedProducts
              .map((product: any) => {
                const selectedItem = validProducts.find(
                  (item) => (item.importId || item.dealId) === product.dealId,
                );
                if (!selectedItem) return null;

                return {
                  dealId: selectedItem.importId || selectedItem.dealId || "",
                  dealName: selectedItem.name,
                  quantity: 0,
                  price: selectedItem.mrp,
                  images: [],
                  itemId: product.itemId || product._id,
                };
              })
              .filter(Boolean) as Array<{
              dealId: string;
              dealName: string;
              quantity: number;
              price: number;
              images: string[];
              itemId: string;
            }>;

            if (localCartData.length > 0) {
              InventorySubscribeService.saveBulkInLocalCart(localCartData);
            }

            InventorySubscribeService.triggerItemAddedEvent({
              bulk: true,
              count: localCartData.length,
              dealIds: localCartData.map((item: any) => item.dealId),
            });

            appToast.show({
              msg: "Deals added to cart!",
              color: "success",
            });
            if (callback) {
              callback({
                action: "submitted",
                data: {
                  mode: "dealId",
                  count: localCartData.length,
                  dealIds: localCartData.map((item: any) => item.dealId),
                },
              });
            }
          } else {
            const user = AuthService.getLoggedInUser();
            const payload = {
              franchise: {
                id: user?._id,
                name: user?.name,
                address: user?.address,
                state: user?.state,
                district: user?.district,
                town: user?.town,
                gstNo: user?.finance_details?.gstNo,
              },
              productList: validProducts.map((p) => ({
                name: p.name,
                brand: p.brand,
                category: p.category,
                mrp: p.mrp,
                price: AuthService.isMasterLogin() ? p.mrp : p.price,
                purchasePrice: AuthService.isMasterLogin() ? p.mrp : p.price,
                uom: p.unit,
                barcode: p.barcode,
                qty: p.qty,
                importId: p.importId || "",
                status: "Submitted",
              })),
            };
            const resp =
              await InventorySubscribeService.uploadProducts(payload);
            if (resp?.statusCode && resp.statusCode !== 200) {
              appToast.show({
                msg: resp?.data?.message || "Submit failed",
                color: "danger",
              });
              setSubmitting(false);
              return;
            }
            appToast.show({
              msg: "Products submitted for review!",
              color: "success",
            });
          }
          setSubmitting(false);
          if (mode !== "dealId" && callback) {
            callback({ action: "submitted", data: { mode: "detailed" } });
          }
        } catch (e: any) {
          appToast.show({
            msg: e?.message || "Submit failed",
            color: "danger",
          });
          setSubmitting(false);
        }
      },
      cancelCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const previewTitle =
    mode === "dealId" ? "Preview Deal IDs" : "Preview Uploaded Data";
  const previewSubtitle = `Found ${products.length} products${
    fileName ? ` in "${fileName}"` : ""
  }. Review the data below before submitting.`;

  const actionFooter = (
    <div className="tw:sticky tw:bottom-0 tw:z-20 tw:-mx-4 tw:mt-6 tw:border-t tw:border-gray-200 tw:bg-white/95 tw:backdrop-blur-sm tw:px-4 tw:py-4">
      <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
        {commission !== undefined && commission > 0 && (
          <div className="tw:mr-auto tw:flex tw:items-center tw:gap-2">
            <span className="tw:text-sm tw:text-gray-600">Commission:</span>
            <Amount
              value={commission}
              className="tw:text-sm tw:font-medium tw:text-gray-900"
            />
          </div>
        )}
        <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
          <AppButton
            fill="outline"
            onClick={() => callback && callback({ action: "back" })}
            color="light"
          >
            Back to Upload
          </AppButton>
          <AppButton
            onClick={handleSubmitForReview}
            isLoading={submitting}
            disabled={submitting}
            noShadow={true}
            color="success"
          >
            {mode === "dealId" ? "Subscribe" : "Submit Products for Review"}
          </AppButton>
        </div>
      </div>
    </div>
  );

  const summaryItems: Array<{
    label: string;
    count: number;
    border: string;
    bg: string;
    labelColor: string;
    valueColor: string;
  }> = [
    {
      label: "Valid",
      count: validCount,
      border: "tw:border-emerald-100",
      bg: "tw:bg-emerald-50",
      labelColor: "tw:text-emerald-600",
      valueColor: "tw:text-emerald-900",
    },
    {
      label: "Invalid",
      count: invalidCount,
      border: "tw:border-rose-100",
      bg: "tw:bg-rose-50",
      labelColor: "tw:text-rose-600",
      valueColor: "tw:text-rose-900",
    },
    {
      label: "Subscribed",
      count: subscribedCount,
      border: "tw:border-sky-100",
      bg: "tw:bg-sky-50",
      labelColor: "tw:text-sky-600",
      valueColor: "tw:text-sky-900",
    },
  ];

  const summaryBlock = (
    <div className="tw:grid tw:grid-cols-3 tw:gap-3">
      {summaryItems.map((item) => (
        <div
          key={item.label}
          className={`tw:flex tw:flex-col tw:justify-between tw:rounded-xl tw:border ${item.border} ${item.bg} tw:px-3 tw:py-2 tw:min-h-16`}
        >
          <div
            className={`tw:text-[11px] tw:uppercase tw:tracking-wide tw:font-semibold tw:leading-tight tw:truncate ${item.labelColor}`}
          >
            {item.label}
          </div>
          <div
            className={`tw:text-lg tw:font-semibold tw:leading-none ${item.valueColor}`}
          >
            {item.count}
          </div>
        </div>
      ))}
    </div>
  );

  const previewBlock = (
    <div className="tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-3">
      <div className="tw:flex tw:items-center tw:gap-2">
        <FileText className="tw:w-4 tw:h-4 tw:text-gray-600" />
        <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
          {previewTitle}
        </div>
      </div>
      <div className="tw:mt-1 tw:text-xs tw:text-gray-500">
        {previewSubtitle}
      </div>
    </div>
  );

  return (
    <div className="tw:space-y-6">
      {previewBlock}
      {mode === "dealId" && summaryBlock}

      {!isMobile ? (
        <AppCard noPadding>
          <DesktopView products={products} mode={mode} />
        </AppCard>
      ) : (
        <MobileView products={products} mode={mode} />
      )}

      {actionFooter}

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        onConfirm={appAlertDialog.successCb}
        onCancel={appAlertDialog.cancelCb}
      />
    </div>
  );
};

export default Preview;
