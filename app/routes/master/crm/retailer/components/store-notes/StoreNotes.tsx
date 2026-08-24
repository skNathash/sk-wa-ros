import { MessageSquarePlus, StickyNote } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";
import CreateNoteModal from "../../../modals/CreateNoteModal";
import {
  defaultFilter,
  getCount,
  getData,
  prepareParams,
  type NoteFilterForm,
} from "./helper";

interface StoreNotesProps {
  fid: string;
}

const StoreNotes: React.FC<StoreNotesProps> = ({ fid }) => {
  const formMethods = useForm<NoteFilterForm>({
    defaultValues: defaultFilter,
  });

  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Notes can only be logged by master users; others are told why on click.
  const canAddNote = AuthService.isMasterLogin();
  const appToast = useAppToast();

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: SortValue }>({
    key: "createdAt",
    value: "desc",
  });

  // Fetch page 1 for the current form values and refresh the total count.
  const applyFilter = useCallback(async () => {
    if (!fid) return;
    setLoading(true);
    setNotes([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(
        fid,
        formMethods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const result = await getData(params);
      setNotes(result || []);
      const total = await getCount(params);
      paginationRef.current.totalRecords = total || 0;
      setHasMoreData((result || []).length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setNotes([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [fid, formMethods]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData || !fid) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        fid,
        formMethods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const result = await getData(params);
      setNotes((prev) => [...prev, ...(result || [])]);
      setHasMoreData((result || []).length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // keep existing notes on a failed page fetch
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, fid, formMethods]);

  // Reload whenever the franchise in view changes.
  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const openAdd = () => {
    if (!canAddNote) {
      appToast.show({
        msg: "Only master users can add a note",
        color: "danger",
      });
      return;
    }
    setShowAdd(true);
  };

  // The modal reports back through `callback`; on a successful create we close
  // it and reload the timeline so the new note appears in order.
  const handleNoteModal = (payload: { action: string; data?: any }) => {
    setShowAdd(false);
    if (payload.action === "created") {
      applyFilter();
    }
  };

  return (
    <div className="tw:p-4">
      <div className="tw:mb-4 tw:flex tw:items-center tw:justify-between tw:gap-2">
        <div>
          <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
            Store Notes
          </div>
          <div className="tw:text-xs tw:text-gray-500">
            Log of every contact made with this retailer.
          </div>
        </div>
        <AppButton size="small" color="success" onClick={openAdd}>
          <MessageSquarePlus size={16} className="tw:mr-1" />
          Add Note
        </AppButton>
      </div>

      {loading ? (
        <div className="tw:flex tw:items-center tw:justify-center tw:py-10">
          <AppSpinner />
        </div>
      ) : notes.length === 0 ? (
        <NoData
          title="No notes yet"
          description={
            canAddNote
              ? "Add the first note after contacting this retailer."
              : "No notes have been logged for this retailer yet."
          }
        />
      ) : (
        <>
          <ol className="tw:relative">
            {notes.map((note, idx) => {
              const isLast = idx === notes.length - 1;
              const author = note.employee?.name || "—";
              return (
                <li key={note._id || idx} className="tw:flex tw:gap-3">
                  {/* Marker + connector */}
                  <div className="tw:flex tw:flex-col tw:items-center">
                    <span className="tw:z-10 tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-50 tw:text-emerald-600 tw:ring-1 tw:ring-emerald-200">
                      <StickyNote size={15} />
                    </span>
                    {!isLast && (
                      <span className="tw:w-px tw:flex-1 tw:bg-gray-200" />
                    )}
                  </div>

                  {/* Card */}
                  <div className={isLast ? "tw:pb-1" : "tw:pb-5"}>
                    <div className="tw:rounded-xl tw:border tw:border-gray-100 tw:bg-white tw:p-3 tw:shadow-sm">
                      <p className="tw:whitespace-pre-wrap tw:text-sm tw:text-gray-700">
                        {note.remarks}
                      </p>
                      <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2 tw:text-[11px] tw:text-gray-400">
                        <span className="tw:flex tw:h-5 tw:w-5 tw:items-center tw:justify-center tw:rounded-full tw:bg-gray-100 tw:text-[9px] tw:font-bold tw:text-gray-500">
                          {note.initial}
                        </span>
                        <span className="tw:font-medium tw:text-gray-600">
                          {author}
                        </span>
                        {(note.createdAt || note.loggedOn) && (
                          <>
                            <span className="tw:text-gray-300">•</span>
                            <DateFormat value={note.createdAt || note.loggedOn} />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {hasMoreData && (
            <div className="tw:mt-3 tw:flex tw:justify-center">
              <AppButton
                size="small"
                color="light"
                onClick={loadMore}
                isLoading={loadingMore}
                disabled={loadingMore}
              >
                Load more
              </AppButton>
            </div>
          )}
        </>
      )}

      <CreateNoteModal
        show={showAdd}
        franchiseId={fid}
        callback={handleNoteModal}
      />
    </div>
  );
};

export default StoreNotes;
