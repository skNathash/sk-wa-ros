import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import RichTextEditor from "~/components/core/rich-text-editor/RichTextEditor";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import DateFormat from "~/components/core/date/DateFormat";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AuthService from "~/services/AuthService";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import NoteContent from "./components/NoteContent";

interface NotesModalProps {
  show: boolean;
  callback: (r: { action: string; data?: any }) => void;
}

const TABS = {
  list: "list",
  create: "create",
} as const;

interface FormValues {
  notes: string;
}

// Strip HTML tags to measure/validate the actual text content the user typed
const stripHtml = (html?: string): string => {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
};

const validationSchema = yup.object({
  notes: yup
    .string()
    .default("")
    .test(
      "required",
      "Note content is required",
      (value) => stripHtml(value).length > 0,
    ),
});

const NotesModal: React.FC<NotesModalProps> = ({ show, callback }) => {
  const toast = useAppToast();
  const [notesList, setNotesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(TABS.create);

  const tabs: TabItem[] = [
    {
      key: TABS.create,
      name: "Add Note",
      icon: "plus",
    },
    {
      key: TABS.list,
      name: "Notes",
      icon: "list",
      count: notesList.length || undefined,
    },
  ];

  const methods = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: { notes: "" },
  });

  const { register, handleSubmit, reset, formState, watch, setValue } = methods;
  const { errors } = formState;

  // Register the field so RHF tracks it while we drive it via setValue from the editor
  register("notes");

  const notesValue = watch("notes");
  const charCount = stripHtml(notesValue).length;

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const resp = await FranchiseService.getNotes({
        page: 1,
        count: 1000,
        // limit: 1000,
        filter: {
          "franchiseInfo.id": AuthService.getLoggedInUserId(),
        },
      });
      if (resp && resp.statusCode === 200) {
        // Paginated/list responses wrap the array at different depths depending
        // on the endpoint, so pull the first array we find.
        const d = resp.data?.data;
        const list = Array.isArray(d) ? d : [];
        setNotesList(list);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchNotes();
      reset({ notes: "" });
      setActiveTab(TABS.create);
    }
  }, [show, reset]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = { noteContent: (values.notes || "").trim() };
      const resp = await FranchiseService.createNote(payload);

      if (resp && (resp.statusCode === 200 || resp.statusCode !== 201)) {
        toast.show({ msg: "Note added successfully", color: "success" });
        reset({ notes: "" });
        fetchNotes();
        setActiveTab(TABS.list);
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to add note",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast.show({
        msg: "Failed to add note, try again",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:max-w-2xl tw:lg:max-w-4xl tw:h-[90vh]"
    >
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:w-10 tw:h-10 tw:rounded-lg tw:bg-blue-100 tw:flex tw:items-center tw:justify-center">
            <span className="tw:text-xl">📝</span>
          </div>
          <div>
            <div className="tw:font-semibold tw:text-lg">Store Notes</div>
            <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
              View and add internal notes
              {notesList.length > 0 && (
                <span>
                  {" "}
                  · {notesList.length} note{notesList.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:h-[90vh]">
        <div className="tw:p-1 tw:space-y-4">
          <AppTab
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab.key)}
          />

          {/* Add New Note */}
          {activeTab === TABS.create && (
            <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-3">
              <div>
                <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                  <label className="tw:block tw:text-sm tw:font-medium tw:text-gray-700">
                    New Note <span className="tw:text-red-500">*</span>
                  </label>
                  {charCount > 0 && (
                    <span className="tw:text-xs tw:font-medium tw:text-green-600">
                      {charCount} characters
                    </span>
                  )}
                </div>

                <RichTextEditor
                  value={notesValue || ""}
                  callback={(html) =>
                    setValue("notes", html, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  className="tw:w-full"
                />
                {errors.notes?.message && (
                  <p className="tw:mt-1 tw:text-xs tw:text-red-600">
                    {errors.notes.message}
                  </p>
                )}
              </div>
            </form>
          )}

          {/* Notes List */}
          {activeTab === TABS.list && (
            <div className="tw:max-h-[60vh] tw:overflow-y-auto tw:pr-1">
              {loading ? (
                <div className="tw:flex tw:justify-center tw:py-8">
                  <AppSpinner />
                </div>
              ) : notesList.length > 0 ? (
                <div className="tw:space-y-3">
                  {notesList.map((item, index) => (
                    <div
                      key={item._id || index}
                      className="tw:p-3 tw:rounded-lg tw:bg-gray-50 tw:border tw:border-gray-100"
                    >
                      <NoteContent html={item.noteContent} />
                      <div className="tw:mt-2 tw:text-xs tw:text-gray-400 tw:flex tw:items-center tw:justify-between">
                        {item.createdBy?.name && (
                          <span className="tw:text-gray-500 tw:font-medium">
                            — {item.createdBy.name}
                          </span>
                        )}
                        <DateFormat value={item.createdAt} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tw:py-10 tw:text-center tw:text-sm tw:text-gray-400">
                  No notes yet
                </div>
              )}
            </div>
          )}
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton
            type="button"
            color="light"
            fill="outline"
            onClick={() => callback({ action: "close" })}
            disabled={submitting}
          >
            Close
          </AppButton>
          {activeTab === TABS.create && (
            <AppButton
              type="submit"
              color="primary"
              onClick={handleSubmit(onSubmit)}
              isLoading={submitting}
              disabled={submitting || charCount === 0}
            >
              Add Note
            </AppButton>
          )}
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default NotesModal;
