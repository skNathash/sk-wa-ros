import { ArrowRight } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { getData, prepareParams, type ConfigLogType } from "./helper";

type Log = {
  loggedAt: string;
  loggedBy?: { name?: string };
  remarks?: string;
  newValues?: Record<string, any>;
  oldValues?: Record<string, any>;
};

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  type: ConfigLogType;
};

const TITLE_MAP: Record<ConfigLogType, string> = {
  minOrderAmount: "Minimum Cart Change Log",
  enableOtpForPOS: "OTP Verification Change Log",
  compositionGST: "GST Type Change Log",
};

const hasKey = (obj: Record<string, any> | undefined, key: string) =>
  !!obj && Object.prototype.hasOwnProperty.call(obj, key);

const renderValue = (type: ConfigLogType, value: any) => {
  if (typeof value === "undefined") return <>-</>;
  if (type === "minOrderAmount") {
    return <Amount value={value} decimalPlaces={2} />;
  }
  if (type === "enableOtpForPOS") {
    return <>{value ? "Enabled" : "Disabled"}</>;
  }
  if (type === "compositionGST") {
    return <>{value ? "Composite GST" : "Regular GST"}</>;
  }
  return <>{String(value)}</>;
};

const ConfigLogModal: React.FC<Props> = ({ show, callback, type }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

  const filterRef = useRef<Record<string, any>>({ type });

  const onClose = () => callback({ action: "close" });

  const applyFilter = async () => {
    setLoading(true);
    filterRef.current.type = type;
    const params = prepareParams(filterRef.current, {} as any);
    try {
      const list = await getData(params);
      const filtered = (Array.isArray(list) ? list : []).filter(
        (log: Log) =>
          hasKey(log.newValues, type) || hasKey(log.oldValues, type),
      );
      setLogs(filtered);
    } catch (error) {
      console.error("ConfigLogModal.applyFilter", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!show) return;
    filterRef.current.type = type;
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, type]);

  return (
    <AppModal
      show={show}
      callback={onClose}
      className="tw:max-w-md tw:w-full"
    >
      <AppModal.Title onClose={onClose} noShadow>
        <div className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
            {TITLE_MAP[type]}
          </span>
          {!loading && logs.length > 0 && (
            <span className="tw:text-[10px] tw:font-semibold tw:text-indigo-700 tw:bg-indigo-50 tw:px-1.5 tw:py-0.5 tw:rounded">
              {logs.length}
            </span>
          )}
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[75vh] tw:p-0">
        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:py-10">
            <AppSpinner />
          </div>
        ) : logs.length === 0 ? (
          <div className="tw:text-center tw:py-10 tw:text-slate-500 tw:text-xs">
            No change logs found.
          </div>
        ) : (
          <ul className="tw:divide-y tw:divide-gray-100">
            {logs.map((log, idx) => {
              const name = log.loggedBy?.name || "Unknown";
              const initial = name.charAt(0).toUpperCase();
              return (
                <li
                  key={idx}
                  className="tw:px-3 tw:py-2.5 hover:tw:bg-gray-50 tw:transition-colors"
                >
                  <div className="tw:flex tw:items-start tw:gap-2.5">
                    <div className="tw:w-6 tw:h-6 tw:shrink-0 tw:rounded-full tw:bg-indigo-50 tw:border tw:border-indigo-100 tw:flex tw:items-center tw:justify-center">
                      <span className="tw:text-[10px] tw:font-bold tw:text-indigo-600">
                        {initial}
                      </span>
                    </div>

                    <div className="tw:flex-1 tw:min-w-0">
                      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                        <span className="tw:text-xs tw:font-medium tw:text-gray-900 tw:truncate">
                          {name}
                        </span>
                        <span className="tw:text-[10px] tw:text-gray-500 tw:shrink-0">
                          <DateFormat value={log.loggedAt} />
                        </span>
                      </div>

                      <div className="tw:mt-1 tw:flex tw:items-center tw:gap-1.5 tw:text-xs">
                        <span className="tw:text-gray-500 tw:line-through tw:truncate">
                          {renderValue(type, log.oldValues?.[type])}
                        </span>
                        <ArrowRight className="tw:w-3 tw:h-3 tw:text-gray-400 tw:shrink-0" />
                        <span className="tw:font-semibold tw:text-gray-900 tw:truncate">
                          {renderValue(type, log.newValues?.[type])}
                        </span>
                      </div>

                      {log.remarks && (
                        <div className="tw:mt-1 tw:text-[11px] tw:text-gray-600 tw:leading-snug">
                          {log.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default ConfigLogModal;
