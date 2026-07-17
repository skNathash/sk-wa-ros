import React, { useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import AppTextarea from "~/components/core/form/AppTextarea";
import BarcodeScan from "~/components/core/barcode-scan/BarcodeScan";
import useAppToast from "~/hooks/useAppToast";
import SellerCatalogService from "~/services/SellerCatalogService";
import { useForm, useWatch } from "react-hook-form";
import {
  formatBulkBarcodeResponse,
  parseBarcodes,
  type BarcodeDealType,
} from "../helper";
import { Barcode, ScanLine } from "lucide-react";

interface BarcodeTextAreaProps {
  callback: (data: BarcodeDealType[]) => void;
}

const BarcodeTextArea: React.FC<BarcodeTextAreaProps> = ({ callback }) => {
  const MAX_BARCODES = 50;
  const { register, control, getValues, setValue } = useForm({
    defaultValues: { barcodes: "" },
  });
  const appToast = useAppToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // useWatch from react-hook-form - watch form control for barcodes
  const watchedValue = useWatch({ control, name: "barcodes" }) || "";
  const currentTokens = parseBarcodes(String(watchedValue));

  const handleSubmit = async () => {
    const raw = getValues("barcodes") || "";
    // use shared parser to get tokens
    const tokens = parseBarcodes(raw);

    if (tokens.length > MAX_BARCODES) {
      appToast.show({
        msg: `Maximum ${MAX_BARCODES} barcodes are allowed. You entered ${tokens.length}.`,
        color: "danger",
      });
      return;
    }

    if (tokens.length === 0) {
      appToast.show({
        msg: "Please enter at least one barcode.",
        color: "danger",
      });
      return;
    }

    // basic validation: ensure tokens are not too long and are reasonable
    const invalids = tokens.filter((t) => t.length > 200);
    if (invalids.length > 0) {
      appToast.show({
        msg: `Found ${invalids.length} invalid barcode(s).`,
        color: "danger",
      });
      return;
    }

    // setIsSubmitting(true);

    setIsSubmitting(true);

    try {
      const response: any = await SellerCatalogService.bulkBarcodeSearch(
        tokens
      );
      const records = response?.data?.data || [];

      const formatted = formatBulkBarcodeResponse(records);

      callback(formatted);

      appToast.show({
        msg: `Fetched ${
          Array.isArray(records) ? records.length : 0
        } result(s).`,
        color: "success",
      });
    } catch (err: any) {
      appToast.show({
        msg: err?.message || "Failed to fetch barcode details.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScannerCb = (r: { action: string; data: any }) => {
    if (r.action === "scan") {
      const code = String(r.data || "").trim();
      if (!code) {
        appToast.show({ msg: "Scanned empty code", color: "danger" });
        return;
      }

      const raw = getValues("barcodes") || "";
      const tokens = parseBarcodes(raw);

      if (tokens.length >= MAX_BARCODES) {
        appToast.show({
          msg: `Cannot add more barcodes. Maximum ${MAX_BARCODES} allowed.`,
          color: "danger",
        });
        return;
      }

      if (tokens.includes(code)) {
        appToast.show({ msg: "Barcode already added", color: "warning" });
        return;
      }

      // append as comma separated
      const next = raw ? `${raw},${code}` : code;
      setValue("barcodes", next, { shouldDirty: true });
      appToast.show({ msg: "Barcode added from scanner", color: "success" });
    } else if (r.action === "error") {
      appToast.show({ msg: r.data || "Scanner error", color: "danger" });
    }
  };

  return (
    <AppCard title="Enter Barcodes (comma separated)" icon={<Barcode />}>
      <div className="tw:space-y-4">
        <AppTextarea
          label="Barcodes"
          placeholder="Enter comma separated barcodes (or paste from your file)"
          name="barcodes"
          register={register}
          rows={6}
          inputClassName="tw:text-sm"
          isRequired={true}
        />

        <div className="tw:flex tw:items-center tw:justify-between tw:text-xs tw:text-gray-600">
          <div>50 barcodes are allowed</div>
          <div className="tw:font-medium">
            {/* Styled badge: shows current / max and changes color when near or at limit */}
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:text-xs tw:text-gray-500">Total</span>
              <span
                className={
                  `tw:inline-flex tw:items-center tw:justify-center tw:text-sm tw:font-semibold tw:rounded-full tw:px-2 tw:py-1 ` +
                  (currentTokens.length >= MAX_BARCODES
                    ? "tw:bg-red-100 tw:text-red-800"
                    : currentTokens.length >= Math.floor(MAX_BARCODES * 0.8)
                    ? "tw:bg-yellow-100 tw:text-yellow-800"
                    : "tw:bg-green-100 tw:text-green-800")
                }
              >
                {currentTokens.length} / {MAX_BARCODES}
              </span>
            </div>
          </div>
        </div>

        <div className="tw:flex tw:justify-between tw:items-center tw:gap-3">
          <div>
            <BarcodeScan
              callback={handleScannerCb}
              className={
                "tw:inline-flex tw:items-center tw:gap-2 tw:whitespace-nowrap tw:rounded-md tw:text-sm tw:font-medium tw:transition-all " +
                "tw:h-9 tw:px-4 tw:py-2 tw:border tw:border-green-600 tw:bg-green-600 tw:text-white tw:shadow-md hover:tw:bg-green-700"
              }
            >
              <>
                <ScanLine className="tw:w-4 tw:h-4 tw:text-white" />
                <span>Open Camera</span>
              </>
            </BarcodeScan>
          </div>

          <AppButton
            onClick={handleSubmit}
            isLoading={isSubmitting}
            color="primary"
          >
            Submit Barcodes
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
};

export default BarcodeTextArea;
