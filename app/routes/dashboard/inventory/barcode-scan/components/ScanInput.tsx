import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { ScanLine, Keyboard } from "lucide-react";

import AppButton from "~/components/core/button/AppButton";
import BarcodeScanComp from "~/components/core/barcode-scan/BarcodeScan";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import MiscService from "~/services/MiscService";

interface ScanInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (barcode: string) => void;
  isLoading?: boolean;
}

export interface ScanInputHandle {
  focus: () => void;
}

const ScanInput = forwardRef<ScanInputHandle, ScanInputProps>(({
  value,
  onChange,
  onSubmit,
  isLoading,
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isMobile } = useScreenView();
  const { show: showToast } = useAppToast();
  const hasCordova = MiscService.hasCordova();

  const scannerDetector = useMemo(
    () => MiscService.createScannerDetector(),
    [],
  );

  useEffect(() => {
    return () => {
      if (selectTimeoutRef.current) clearTimeout(selectTimeoutRef.current);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (isMobile) return;
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    },
  }));

  const submit = (raw: string) => {
    // Block new scans while a lookup is in flight — a USB scanner auto-submit
    // or Enter would otherwise abort the running request and start over.
    if (isLoading) {
      showToast({ msg: "Please wait for the current scan to finish", color: "warning" });
      return;
    }
    const trimmed = (raw || "").trim();
    if (!trimmed) {
      showToast({ msg: "Enter a barcode", color: "error" });
      return;
    }
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectTimeoutRef.current) {
        clearTimeout(selectTimeoutRef.current);
        selectTimeoutRef.current = null;
      }
      submit(inputRef.current?.value ?? value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    const isFromScanner = scannerDetector.trackKeystroke();
    if (isFromScanner && val.trim()) {
      if (selectTimeoutRef.current) clearTimeout(selectTimeoutRef.current);
      selectTimeoutRef.current = setTimeout(() => {
        selectTimeoutRef.current = null;
        submit(inputRef.current?.value ?? val);
      }, 100);
    }
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      {hasCordova && (
        <BarcodeScanComp
          callback={(r) => {
            if (r.action === "scan" && r.data) submit(r.data);
            else if (r.action === "error")
              showToast({ msg: r.data, color: "error" });
          }}
          className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:w-full tw:bg-blue-600 active:tw:bg-blue-700 tw:text-white tw:font-semibold tw:text-sm tw:rounded-lg tw:py-2.5 tw:shadow-sm tw:transition tw:cursor-pointer"
        >
          <ScanLine className="tw:w-4 tw:h-4" />
          Tap to scan
        </BarcodeScanComp>
      )}
      {/* On cordova the camera scan lives in the button above, and this field is
          type-only — mark it as the "or type it in" alternative so the two paths
          don't both read as scanning. */}
      {hasCordova && (
        <div className="tw:flex tw:items-center tw:gap-3 tw:text-[11px] tw:font-medium tw:text-gray-400">
          <span className="tw:h-px tw:flex-1 tw:bg-gray-200" />
          or type it in
          <span className="tw:h-px tw:flex-1 tw:bg-gray-200" />
        </div>
      )}
      <div className="tw:relative tw:flex tw:gap-2">
        <div className="tw:relative tw:flex-1">
          {hasCordova ? (
            <Keyboard className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:w-4 tw:h-4 tw:text-gray-400 tw:pointer-events-none" />
          ) : (
            <ScanLine className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:w-4 tw:h-4 tw:text-blue-600 tw:pointer-events-none" />
          )}
          <input
            ref={inputRef}
            autoFocus={!isMobile}
            type="text"
            value={value}
            onChange={handleChange}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            onKeyDown={handleKeyDown}
            readOnly={isLoading}
            placeholder="Name, model or barcode…"
            inputMode="text"
            className="tw:w-full tw:h-10 tw:border-2 tw:border-blue-500 tw:rounded-lg tw:pl-9 tw:pr-3 tw:text-sm tw:font-mono tw:bg-white tw:transition tw:shadow-sm tw:shadow-blue-500/10 focus:tw:outline-none focus:tw:border-blue-600 focus:tw:ring-4 focus:tw:ring-blue-100 read-only:tw:bg-gray-50 read-only:tw:cursor-not-allowed read-only:tw:opacity-70"
          />
        </div>
        <AppButton
          onClick={() => submit(value)}
          isLoading={isLoading}
          disabled={isLoading}
        >
          Find
        </AppButton>
      </div>
      {!isMobile && (
        <div className="tw:text-[10px] tw:text-gray-500">
          USB scanner auto-submits · Typing? Press{" "}
          <kbd className="tw:px-1 tw:bg-gray-100 tw:border tw:border-gray-200 tw:rounded tw:font-mono">
            Enter
          </kbd>
        </div>
      )}
    </div>
  );
});

ScanInput.displayName = "ScanInput";

export default ScanInput;
