import { useEffect, useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Check, Copy, Info, Loader2, QrCode } from "lucide-react";
import ImgRender from "~/components/core/img/ImgRender";
import { AppSelect } from "~/components/core/form";
import { fetchUpiConfigs, type UpiConfig } from "./helper";

const CURRENCY_SYMBOL = "₹";

type Props = {
  /** Amount to collect on this rail. */
  amount: number;
  /** Selected config, by its `paymentMethod` value. */
  method?: string;
  /** UTR / reference the customer reads back after paying. */
  reference?: string;
  /** Locks the amount field — the split step owns the allocation itself. */
  amountReadOnly?: boolean;
  /**
   * Narrow layout — the split step sits this rail beside the cash one, so the
   * field labels give way and each control names itself in its placeholder.
   */
  compact?: boolean;
  /**
   * Fires on every edit with only the field that changed, plus
   * `{ action: "configs" }` once the store's payment modes have loaded.
   */
  callback: (payload: { action: string; data?: any }) => void;
  className?: string;
};

/**
 * The UPI rail: the store's QR on the left for the customer to scan, the
 * amount and which of the store's configured collection modes it went to on
 * the right.
 *
 * A store with no payment mode configured can't collect here at all, so the
 * whole block gives way to a single note rather than showing dead controls.
 */
const UpiSection = ({
  amount = 0,
  method,
  reference = "",
  amountReadOnly = false,
  compact = false,
  callback,
  className,
}: Props) => {
  const fieldId = useId();
  const amountRef = useRef<HTMLInputElement>(null);

  const [configs, setConfigs] = useState<UpiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchUpiConfigs();
        if (cancelled) return;
        setConfigs(data);
        callback({ action: "configs", data: { configs: data } });
        // Nothing picked yet — start on the first configured mode so the QR
        // panel is never blank on a store that has one.
        if (!method && data[0]) {
          callback({ action: "change", data: { method: data[0].value } });
        }
      } catch (e) {
        console.error("Error loading payment configs", e);
        if (!cancelled) setConfigs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => configs.find((config) => config.value === method) || configs[0],
    [configs, method],
  );

  const options = useMemo(
    () => configs.map(({ value, label }) => ({ value, label })),
    [configs],
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    callback({
      action: "change",
      data: { amount: raw ? parseInt(raw, 10) : 0 },
    });
  };

  const handleCopy = async () => {
    if (!selected?.refCode) return;
    await navigator.clipboard.writeText(selected.refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div
        className={clsx(
          "tw:flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:bg-slate-50 tw:p-4 tw:text-xs tw:text-slate-500",
          className,
        )}
      >
        <Loader2 className="tw:size-3.5 tw:animate-spin" />
        Loading payment modes…
      </div>
    );
  }

  if (!configs.length) {
    return (
      <div
        className={clsx(
          "tw:flex tw:items-start tw:gap-2 tw:rounded-xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-2.5",
          className,
        )}
      >
        <Info className="tw:mt-0.5 tw:size-3.5 tw:shrink-0 tw:text-amber-600" />
        <div className="tw:text-xs tw:text-amber-900">
          <div className="tw:font-semibold">No payment mode configured</div>
          <p className="tw:mt-0.5 tw:text-[11px] tw:text-amber-800">
            Add a UPI or QR collection mode under Settings › Payment config to
            accept payments here. Collect in cash for now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "tw:flex tw:gap-2.5 tw:rounded-xl tw:bg-slate-50 tw:p-2.5",
        className,
      )}
    >
      {/* QR — what the customer actually points a phone at */}
      <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-center tw:gap-1">
        <div className="tw:flex tw:size-24 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white tw:p-1">
          {selected?.qrAssetId ? (
            <ImgRender
              assetId={selected.qrAssetId}
              alt={selected.label}
              className="tw:size-full tw:object-contain"
              fallback={<NoQrPlaceholder />}
            />
          ) : (
            <NoQrPlaceholder />
          )}
        </div>

        {selected?.refCode && (
          <button
            type="button"
            onClick={handleCopy}
            className="tw:flex tw:max-w-24 tw:cursor-pointer tw:items-center tw:gap-1 tw:text-[11px] tw:text-slate-600 tw:transition-colors hover:tw:text-emerald-700"
          >
            <span className="tw:truncate">{selected.refCode}</span>
            {copied ? (
              <Check className="tw:size-3 tw:shrink-0 tw:text-emerald-600" />
            ) : (
              <Copy className="tw:size-3 tw:shrink-0" />
            )}
          </button>
        )}
      </div>

      {/* Amount, mode and the reference the customer reads back */}
      <div className="tw:min-w-0 tw:flex-1 tw:space-y-1.5">
        <div className="tw:flex tw:items-center tw:gap-2">
          {!compact && (
            <label
              htmlFor={`${fieldId}-amount`}
              className="tw:w-16 tw:shrink-0 tw:text-xs tw:text-slate-600"
            >
              Amount
            </label>
          )}
          <div
            onClick={() => amountRef.current?.focus()}
            className={clsx(
              "tw:flex tw:h-9 tw:min-w-0 tw:flex-1 tw:items-center tw:gap-1 tw:rounded-lg tw:border tw:border-slate-200 tw:px-3",
              amountReadOnly ? "tw:bg-slate-100" : "tw:cursor-text tw:bg-white",
            )}
          >
            <span className="tw:text-sm tw:font-bold tw:text-slate-400">
              {CURRENCY_SYMBOL}
            </span>
            <input
              id={`${fieldId}-amount`}
              ref={amountRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              readOnly={amountReadOnly}
              value={amount > 0 ? amount.toString() : ""}
              onChange={handleAmountChange}
              placeholder={compact ? "Amount" : "0"}
              className="tw:h-full tw:w-full tw:min-w-0 tw:bg-transparent tw:text-right tw:text-base tw:font-bold tw:tabular-nums tw:text-slate-800 tw:outline-none tw:placeholder:text-xs tw:placeholder:font-normal tw:placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="tw:flex tw:items-center tw:gap-2">
          {!compact && (
            <label className="tw:w-16 tw:shrink-0 tw:text-xs tw:text-slate-600">
              Mode
            </label>
          )}
          <AppSelect
            className="tw:min-w-0 tw:flex-1"
            value={selected?.value}
            options={options}
            onChange={(value: any) =>
              callback({ action: "change", data: { method: value } })
            }
            inputClassName="tw:h-9 tw:w-full tw:bg-white"
            placeholder={compact ? "Mode" : "Select payment mode"}
          />
        </div>

        <div className="tw:flex tw:items-center tw:gap-2">
          {!compact && (
            <label
              htmlFor={`${fieldId}-reference`}
              className="tw:w-16 tw:shrink-0 tw:text-xs tw:text-slate-600"
            >
              Ref / UTR
            </label>
          )}
          <input
            id={`${fieldId}-reference`}
            type="text"
            autoComplete="off"
            value={reference}
            onChange={(e) =>
              callback({
                action: "change",
                data: { reference: e.target.value },
              })
            }
            placeholder={compact ? "Ref / UTR" : "UPI reference number"}
            className="tw:h-9 tw:min-w-0 tw:flex-1 tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white tw:px-3 tw:text-sm tw:text-slate-800 tw:outline-none tw:placeholder:text-xs tw:placeholder:text-slate-400"
          />
        </div>

        {selected?.note && (
          <p className="tw:text-[11px] tw:text-slate-500">{selected.note}</p>
        )}
      </div>
    </div>
  );
};

/** Stands in wherever a configured mode has no QR image uploaded. */
const NoQrPlaceholder = () => (
  <div className="tw:flex tw:size-full tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:rounded-md tw:border tw:border-dashed tw:border-slate-300 tw:bg-slate-50 tw:text-slate-400">
    <QrCode className="tw:size-5" strokeWidth={1.5} />
    <span className="tw:text-[10px]">No QR</span>
  </div>
);

export default UpiSection;
