import { Barcode as BarcodeIcon, Check, Copy, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import BarcodeScan from "~/components/core/barcode-scan/BarcodeScan";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import BarcodeInput from "~/shared/inventory/components/barcode-input/BarcodeInput";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";

type FormValues = {
  barcode: string;
};

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  dealId: string;
};

const AddBarcodeModal = ({ show, callback, dealId }: Props) => {
  const { t } = useTranslation(["common"]);
  const toast = useAppToast();

  const [loading, setLoading] = useState(false);
  const [deal, setDeal] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [recentCodes, setRecentCodes] = useState<string[]>([]);
  const [addedAny, setAddedAny] = useState(false);

  const { getValues, setValue, watch } = useForm<FormValues>({
    defaultValues: { barcode: "" },
  });
  const barcodeValue = watch("barcode");

  useEffect(() => {
    if (show && dealId) {
      setValue("barcode", "");
      fetchDealDetails();
    } else {
      setDeal(null);
      setRecentCodes([]);
      setAddedAny(false);
    }
  }, [show, dealId]);

  const fetchDealDetails = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const resp = await SellerCatalogService.getProducts({
        filter: {
          dealId: dealId,
        },
      });
      const formattedResponse = SellerCatalogService.formatProductResponse(
        resp.data?.data || [],
      );
      let data: any = formattedResponse?.[0];
      setDeal(data || null);
    } catch (error) {
      console.error("Error fetching deal details:", error);
      toast.show({ msg: "Failed to fetch deal details", color: "error" });
      setDeal(null);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleClose = () => {
    callback({
      action: addedAny ? "submit" : "close",
      data: addedAny ? { addedBarcodes: recentCodes } : undefined,
    });
  };

  const handleAddBarcode = async (overrideCode?: string) => {
    const code =
      (overrideCode ?? getValues("barcode"))?.toString().trim() || "";

    if (!code) {
      toast.show({ msg: "Please enter a valid barcode", color: "error" });
      return;
    }

    setAdding(true);

    try {
      const params: Record<string, any> = {
        dealId: deal?._id || "",
        dealRefId: deal?.id || "",
        dealName: deal?.name || "",
        type: "BARCODE_UPDATE",
        newBarcodes: [code],
        remarks: "",
      };

      const resp =
        await InventorySubscribeService.createSellerDealRequests(params);

      if (resp && (resp.statusCode === 200 || resp.statusCode === 201)) {
        toast.show({ msg: "Barcode added successfully", color: "success" });
        setValue("barcode", "");
        setRecentCodes((prev) => [code, ...prev.filter((c) => c !== code)]);
        setAddedAny(true);
        await fetchDealDetails(true);
      } else {
        const err = resp?.data?.message || "Failed to add barcode";
        toast.show({ msg: err, color: "error" });
      }
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message || "Network error. Please try again";
      toast.show({ msg: errMsg, color: "error" });
    } finally {
      setAdding(false);
    }
  };

  const handleGenerateBarcode = async () => {
    setGenerating(true);
    try {
      const resp = await CommonService.generateBarcode({
        dealId: deal?._id || dealId,
        // quantity: 1,
        // format: "1up",
      });

      if (resp && (resp.statusCode === 200 || resp.statusCode === 201)) {
        const generatedBarcode = resp.data?.data?.barcode || "";
        if (generatedBarcode) {
          toast.show({ msg: "Barcode added successfully", color: "success" });
          setRecentCodes((prev) => [
            generatedBarcode,
            ...prev.filter((c) => c !== generatedBarcode),
          ]);
          setAddedAny(true);
          await fetchDealDetails(true);
        } else {
          toast.show({ msg: "No barcode generated", color: "error" });
        }
      } else {
        const err = resp?.data?.message || "Failed to generate barcode";
        toast.show({ msg: err, color: "error" });
      }
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message || "Failed to generate barcode";
      toast.show({ msg: errMsg, color: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (code: string, idx: number) => {
    CommonService.copyToClipboard(code);
    toast.show({ msg: "Copied to clipboard", color: "success" });
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const handleBarcodeScanCb = (r: { action: string; data: any }) => {
    if (r.action === "scan" && r.data) {
      setValue("barcode", r.data);
    }
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-w-md">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-baseline tw:gap-2">
          <span className="tw:font-semibold tw:text-gray-900">
            {t("addBarcode")}
          </span>
          {deal?.barcodes?.length > 0 && (
            <span className="tw:text-xs tw:text-gray-500 tw:font-medium">
              {deal.barcodes.length}{" "}
              {deal.barcodes.length === 1 ? "code" : "codes"}
            </span>
          )}
        </div>
      </AppModal.Title>

      <AppModal.Content>
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-32">
            <AppSpinner />
          </div>
        ) : (
          <div className="tw:space-y-3.5">
            {deal && (
              <div className="tw:flex tw:items-start tw:gap-2 tw:py-2 tw:border-b tw:border-gray-100">
                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:leading-snug tw:truncate">
                    {deal.name || "-"}
                  </div>
                  <div className="tw:text-[11px] tw:text-gray-500 tw:font-mono tw:tabular-nums tw:mt-0.5">
                    {deal.id || "-"}
                  </div>
                </div>
              </div>
            )}

            <div className="tw:space-y-2.5">
              <label className="tw:block tw:text-xs tw:font-medium tw:text-gray-600">
                {t("barcode")}
              </label>

              <div className="tw:flex tw:gap-1.5 tw:items-center">
                <div className="tw:flex-1">
                  <BarcodeInput
                    value={barcodeValue || ""}
                    onChange={(v) => setValue("barcode", v)}
                    placeholder="Type or scan a barcode"
                    dealId={deal?._id || dealId}
                    uom={deal?.selectedStockUom}
                  />
                </div>
                <div title="Scan barcode with camera">
                  <BarcodeScan
                    callback={handleBarcodeScanCb}
                    className="tw:cursor-pointer tw:p-1.5 tw:rounded tw:text-gray-500 hover:tw:text-primary-600 hover:tw:bg-gray-100 tw:transition-colors"
                  />
                </div>
                <AppButton
                  onClick={() => handleAddBarcode()}
                  isLoading={adding}
                >
                  Add
                </AppButton>
              </div>

              <>
                <div className="tw:flex tw:items-center tw:gap-2 tw:text-[11px] tw:text-gray-400 tw:font-medium tw:uppercase tw:tracking-wide">
                  <span className="tw:flex-1 tw:h-px tw:bg-gray-200" />
                  <span>or</span>
                  <span className="tw:flex-1 tw:h-px tw:bg-gray-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  disabled={generating || !deal}
                  className="tw:group tw:w-full tw:flex tw:items-center tw:gap-2.5 tw:px-3 tw:py-2 tw:rounded-md tw:border tw:border-dashed tw:border-gray-300 tw:bg-white hover:tw:border-primary-400 hover:tw:bg-primary-50/40 disabled:tw:opacity-50 disabled:tw:cursor-not-allowed tw:cursor-pointer tw:transition-colors tw:text-left"
                >
                  <span className="tw:flex tw:items-center tw:justify-center tw:w-7 tw:h-7 tw:rounded tw:bg-gray-100 tw:text-gray-600 group-hover:tw:bg-primary-100 group-hover:tw:text-primary-700 tw:transition-colors tw:shrink-0">
                    {generating ? (
                      <AppSpinner size="sm" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                  </span>
                  <span className="tw:flex tw:flex-col tw:min-w-0">
                    <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                      {generating
                        ? adding
                          ? "Adding…"
                          : "Generating…"
                        : "Generate & add barcode"}
                    </span>
                    <span className="tw:text-[11px] tw:text-gray-500">
                      Creates a unique code and adds it instantly
                    </span>
                  </span>
                </button>
              </>
            </div>

            {(() => {
              const existing: string[] = Array.isArray(deal?.barcodes)
                ? deal.barcodes
                : [];
              const seen = new Set<string>();
              const merged: string[] = [];
              for (const c of recentCodes) {
                if (!seen.has(c)) {
                  seen.add(c);
                  merged.push(c);
                }
              }
              for (const c of existing) {
                if (!seen.has(c)) {
                  seen.add(c);
                  merged.push(c);
                }
              }
              return merged.length > 0 ? (
              <div>
                <div className="tw:text-[11px] tw:uppercase tw:tracking-wide tw:font-semibold tw:text-gray-500 tw:mb-1.5">
                  {t("barcodes")}
                </div>
                <ul className="tw:flex tw:flex-col tw:max-h-56 tw:overflow-y-auto tw:rounded-md tw:border tw:border-gray-200 tw:divide-y tw:divide-gray-100">
                  {merged.map((c: string, idx: number) => {
                      const recentIdx = recentCodes.indexOf(c);
                      const isRecent = recentIdx !== -1;
                      const isLatest = recentIdx === 0;
                      return (
                        <li
                          key={c + idx}
                          className={`tw:group tw:flex tw:justify-between tw:items-center tw:px-2.5 tw:py-2 tw:transition-colors ${
                            isRecent
                              ? "tw:bg-emerald-50/60"
                              : "hover:tw:bg-gray-50"
                          }`}
                        >
                          <div className="tw:flex tw:items-center tw:gap-2.5 tw:min-w-0">
                            <span className="tw:text-[10px] tw:text-gray-400 tw:font-mono tw:tabular-nums tw:w-4 tw:text-right">
                              {idx + 1}
                            </span>
                            <code className="tw:text-sm tw:text-gray-900 tw:font-mono tw:tabular-nums tw:truncate">
                              {c}
                            </code>
                            {isLatest && (
                              <span className="tw:relative tw:flex tw:items-center tw:gap-1 tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-emerald-100 tw:text-emerald-800 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide">
                                <span className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-emerald-500 tw:animate-pulse" />
                                Just added
                              </span>
                            )}
                            {isRecent && !isLatest && (
                              <span className="tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-emerald-50 tw:text-emerald-700 tw:text-[10px] tw:font-medium">
                                New
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleCopy(c, idx)}
                            className={`tw:cursor-pointer tw:p-1 tw:rounded tw:text-gray-400 hover:tw:text-primary-600 hover:tw:bg-white tw:transition-colors tw:shrink-0 ${
                              isRecent
                                ? ""
                                : "tw:opacity-0 group-hover:tw:opacity-100 focus:tw:opacity-100"
                            }`}
                            title="Copy"
                          >
                            {copiedIdx === idx ? (
                              <Check size={13} className="tw:text-green-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
              ) : (
              <div className="tw:flex tw:items-center tw:gap-2.5 tw:py-3 tw:px-3 tw:rounded-md tw:border tw:border-dashed tw:border-gray-200 tw:bg-gray-50/50">
                <BarcodeIcon className="tw:w-4 tw:h-4 tw:text-gray-400 tw:shrink-0" />
                <div className="tw:text-xs tw:text-gray-600">
                  No barcodes yet — add one above to get started.
                </div>
              </div>
              );
            })()}
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton onClick={handleClose} color="light" fill="outline">
            {addedAny ? "Done" : t("cancel")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default AddBarcodeModal;
