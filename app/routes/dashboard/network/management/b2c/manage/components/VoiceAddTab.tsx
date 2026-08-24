import { Check, Mic } from "lucide-react";
import { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import VoiceSearch from "~/components/core/voice-search/VoiceSearch";
import { parseVoiceCustomer, type ParsedVoiceCustomer } from "../helper";

interface VoiceAddTabProps {
  onCreate: (data: Record<string, any>) => Promise<boolean>;
  submitting: boolean;
}

const initialsOf = (name: string, mobile: string) =>
  (name.trim()[0] || mobile.trim()[0] || "?").toUpperCase();

/**
 * Route B — the retailer dictates "Add Anita nine eight four five…" and the
 * transcript is parsed into a name and a mobile they can correct before
 * confirming. The mic never leaves the counter, so the phone stays down.
 */
const VoiceAddTab = ({ onCreate, submitting }: VoiceAddTabProps) => {
  const [parsed, setParsed] = useState<ParsedVoiceCustomer | null>(null);

  const handleVoice = ({ data }: { action: string; data?: any }) => {
    const transcript = data?.search;
    if (!transcript) return;
    setParsed(parseVoiceCustomer(transcript));
  };

  const confirm = async () => {
    if (!parsed) return;
    const created = await onCreate({
      name: parsed.name,
      mobile: parsed.mobile,
    });
    if (created) setParsed(null);
  };

  return (
    <div className="tw:overflow-hidden tw:rounded-xl tw:bg-white tw:ring-1 tw:ring-slate-100">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-5 tw:pt-5">
        <div className="tw:flex tw:items-center tw:gap-3">
          <span className="tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-violet-500 tw:text-white">
            <Mic size={18} />
          </span>
          <div>
            <p className="tw:text-sm tw:font-bold tw:text-slate-800">
              B · Voice add
            </p>
            <p className="tw:text-xs tw:text-slate-500">
              English + Kannada · multi-parse
            </p>
          </div>
        </div>
      </div>

      <div className="tw:p-5">
        {parsed ? (
          <>
            <div className="tw:rounded-xl tw:bg-primary tw:px-4 tw:py-3.5 tw:text-white">
              <p className="tw:text-sm tw:font-medium">
                &ldquo;{parsed.transcript}&rdquo;
              </p>
            </div>

            <p
              className="tw:mt-4 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Parsed · 1 customer
            </p>

            <div className="tw:mt-2 tw:rounded-xl tw:border-2 tw:border-primary tw:p-4">
              <div className="tw:flex tw:items-center tw:gap-3">
                <span className="tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-700 tw:text-sm tw:font-bold tw:text-white">
                  {initialsOf(parsed.name, parsed.mobile)}
                </span>
                <div className="tw:min-w-0">
                  <p className="tw:truncate tw:text-sm tw:font-bold tw:text-slate-800">
                    {parsed.name || "Name not caught"}
                  </p>
                  <p className="tw:text-xs tw:text-slate-500">
                    {parsed.mobile ? `+91 ${parsed.mobile}` : "No number heard"}
                  </p>
                </div>
              </div>

              <div className="tw:mt-4 tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-2">
                <label className="tw:block tw:rounded-lg tw:bg-slate-50 tw:px-3 tw:py-2">
                  <span
                    className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Name
                  </span>
                  <input
                    value={parsed.name}
                    onChange={(event) =>
                      setParsed({ ...parsed, name: event.target.value })
                    }
                    placeholder="Add a name"
                    className="tw:w-full tw:border-0 tw:bg-transparent tw:text-sm tw:font-semibold tw:text-slate-800 tw:outline-none"
                  />
                </label>

                <label className="tw:block tw:rounded-lg tw:bg-slate-50 tw:px-3 tw:py-2">
                  <span
                    className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Mobile
                  </span>
                  <input
                    value={parsed.mobile}
                    inputMode="numeric"
                    maxLength={10}
                    onChange={(event) =>
                      setParsed({
                        ...parsed,
                        mobile: event.target.value.replace(/[^0-9]/g, ""),
                      })
                    }
                    placeholder="10-digit mobile"
                    className="tw:w-full tw:border-0 tw:bg-transparent tw:text-sm tw:font-semibold tw:text-slate-800 tw:outline-none"
                  />
                </label>
              </div>
            </div>
          </>
        ) : (
          <div className="tw:rounded-xl tw:bg-slate-50 tw:px-4 tw:py-8 tw:text-center">
            <p className="tw:text-sm tw:font-semibold tw:text-slate-700">
              Tap the mic and say the name and number
            </p>
            <p className="tw:mt-1 tw:text-xs tw:text-slate-500">
              &ldquo;Add Anita nine eight four five six one two zero three
              four&rdquo;
            </p>
          </div>
        )}

        <div className="tw:mt-4 tw:rounded-xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-4">
          <p
            className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-amber-700"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Speed tip
          </p>
          <p className="tw:mt-1 tw:text-sm tw:text-slate-700">
            Numbers can be said digit by digit, and a &ldquo;+91&rdquo; prefix
            is dropped automatically. Correct anything the mic mishears before
            you confirm.
          </p>
        </div>

        <div className="tw:mt-5 tw:flex tw:items-center tw:justify-between tw:gap-3">
          <VoiceSearch
            mode="raw"
            callback={handleVoice}
            className="tw:flex tw:size-14 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:bg-red-500 tw:text-white tw:shadow-lg tw:ring-4 tw:ring-red-100 tw:transition-transform tw:active:scale-95"
          >
            <Mic size={22} />
          </VoiceSearch>

          <AppButton
            color="primary"
            size="large"
            onClick={confirm}
            isLoading={submitting}
            disabled={submitting || !parsed?.mobile}
          >
            <Check size={18} />
            Confirm
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default VoiceAddTab;
