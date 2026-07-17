import { FileText } from "lucide-react";
import React, { useEffect, useState } from "react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppCard from "~/components/core/card/AppCard";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import type { ViewToggleType } from "~/types/CommonTypes";
import type { BarcodeDealType } from "../helper";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import Summary from "./Summary";

interface PreviewProps {
  products: BarcodeDealType[];
  fileName?: string;
  // onRemove now receives the index of the product in the array
  onRemoveProduct?: (index: number) => void;
  // onSubscribe now receives the index of the product in the array
  onSubscribeProduct?: (index: number) => void;
}

const Preview: React.FC<PreviewProps> = ({
  products,
  fileName = "product_upload_template.csv",
  onRemoveProduct,
  onSubscribeProduct,
}) => {
  const { isMobile } = useScreenView();
  const [view, setView] = useState<ViewToggleType>("list");

  const [summary, setSummary] = useState<{
    total: number;
    valid: number;
    invalid: number;
    subscribed: number;
  }>({
    total: 0,
    valid: 0,
    invalid: 0,
    subscribed: 0,
  });

  useEffect(() => {
    setSummary({
      total: products.length,
      valid: products.filter((product) => product.status === "VALID").length,
      invalid: products.filter((product) => product.status === "INVALID")
        .length,
      subscribed: products.filter((product) => product.isSubscribed).length,
    });
  }, [products]);

  // Handle remove product
  const handleRemoveProduct = (index: number) => {
    if (onRemoveProduct) {
      onRemoveProduct(index);
    }
  };

  // Handle subscribe product
  const handleSubscribeProduct = (index: number) => {
    if (onSubscribeProduct) {
      onSubscribeProduct(index);
    }
  };

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

  return (
    <div className="tw:space-y-6">
      <AppCard noContentPadding={true}>
        {/* Custom Header */}
        <div className="tw:px-6 tw:pb-4 tw:border-b tw:border-gray-200">
          <div className="tw:flex tw:items-center tw:justify-between">
            <div className="tw:flex tw:items-center tw:gap-2">
              <FileText className="tw:mr-2" />
              <div>
                <h3 className="tw:text-lg tw:font-semibold tw:text-gray-900">
                  Preview Uploaded Data
                </h3>
                <p className="tw:text-sm tw:text-gray-500">
                  Found{" "}
                  <span className="tw:font-semibold tw:text-gray-900">
                    {products.length}
                  </span>{" "}
                  products. Review the data below before submitting.
                </p>
              </div>
            </div>
            <ViewToggle viewType={view} callback={setView} />
          </div>
        </div>

        <div className="tw:px-6 tw:py-4 tw:space-y-4">
          <Summary
            totalProducts={summary.total}
            validProducts={summary.valid}
            invalidProducts={summary.invalid}
            subscribedProducts={summary.subscribed}
          />
          {/* Products display */}
          {isMobile || view === "card" ? (
            <MobileView
              products={products}
              onRemove={handleRemoveProduct}
              onSubscribe={handleSubscribeProduct}
            />
          ) : (
            <DesktopView
              products={products}
              onRemove={handleRemoveProduct}
              onSubscribe={handleSubscribeProduct}
            />
          )}
        </div>
      </AppCard>

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
