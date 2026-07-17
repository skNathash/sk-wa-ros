import React, { useState, useCallback } from "react";
import TermsModal from "~/modals/core/terms-modal/TermsModal";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import { Calendar, Eye, FileCheck2 } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";

type TermItem = {
  code?: string;
  name?: string;
  version?: string;
  status?: string;
  agreedAt: string;
};

type Props = {
  terms?: TermItem[] | null;
};

const AgreedTerms: React.FC<Props> = ({ terms }) => {
  const [modalState, setModalState] = useState<{
    show: boolean;
    code?: string;
    title?: string;
    version?: string;
  }>({ show: false });

  const openTerm = useCallback(
    (code?: string, title?: string, version?: string) => {
      setModalState({
        show: true,
        code: code || "",
        title,
        version,
      });
    },
    []
  );

  const closeModal = useCallback((a: { action: string }) => {
    setModalState({ show: false });
  }, []);

  if (!terms || terms.length === 0) return null;

  return (
    <>
      <AppCard
        title={<div className="tw:font-medium">Agreed Terms & Policies</div>}
        icon={<FileCheck2 />}
        className="tw:mt-4"
      >
        <div className="tw:space-y-2">
          {terms.map((t, idx) => (
            <div
              key={idx}
              className="tw:flex tw:items-center tw:justify-between tw:border tw:border-gray-100 tw:p-3 tw:rounded"
            >
              <div>
                <div className="tw:font-medium">
                  {t.name || t.code || "Terms"}
                </div>
                <div className="tw:flex tw:items-center tw:space-x-2 tw:text-xs tw:text-gray-500">
                  {t.version ? <div>Version: {t.version}</div> : null}

                  <div className="tw:flex tw:gap-1 tw:items-center">
                    <Calendar size={12} />
                    On
                    <DateFormat value={t.agreedAt} />
                  </div>
                </div>
              </div>
              <div>
                <AppButton
                  type="button"
                  onClick={() => openTerm(t.code, t.name, t.version)}
                  size="small"
                  color="light"
                  fill="outline"
                >
                  <Eye />
                  View
                </AppButton>
              </div>
            </div>
          ))}
        </div>
      </AppCard>
      <TermsModal
        code={modalState.code || ""}
        show={modalState.show}
        title={modalState.title}
        version={modalState.version}
        callback={closeModal}
      />
    </>
  );
};

export default AgreedTerms;
