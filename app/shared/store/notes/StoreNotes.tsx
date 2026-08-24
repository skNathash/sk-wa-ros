import { yupResolver } from "@hookform/resolvers/yup";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import RichTextEditor from "~/components/core/rich-text-editor/RichTextEditor";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppTab from "~/components/core/tab/AppTab";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import useAppToast from "~/hooks/useAppToast";
import type { TabItem } from "~/types/CommonTypes";
import NoteContent from "./components/NoteContent";

interface StoreNotesProps {
  className?: string;
  /** Called after a note is successfully created. */
  onAfterSubmit?: () => void;
  /**
   * When true, renders without the outer title/card chrome so the component
   * can be embedded inside a modal that already provides its own header.
   */
  embedded?: boolean;
}

const TABS = {
  list: "list",
  create: "create",
} as const;

interface FormValues {
  notes: string;
}

// Strip HTML tags to measure/validate the actual text content the user typed.
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

const StoreNotes: React.FC<StoreNotesProps> = ({
  className,
  onAfterSubmit,
  embedded,
}) => {
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

  // Register the field so RHF tracks it while we drive it via setValue from the editor.
  register("notes");

  const notesValue = watch("notes");
  const charCount = stripHtml(notesValue).length;

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const resp = await FranchiseService.getNotes({
        page: 1,
        count: 1000,
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
    fetchNotes();
    reset({ notes: "" });
    setActiveTab(TABS.create);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = { noteContent: (values.notes || "").trim() };
      const resp = await FranchiseService.createNote(payload);

      if (resp && resp.statusCode === 200) {
        toast.show({ msg: "Note added successfully", color: "success" });
        reset({ notes: "" });
        fetchNotes();
        setActiveTab(TABS.list);
        onAfterSubmit?.();
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

  const content = (
    <div className="tw:space-y-4">
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

          <div className="tw:flex tw:justify-end">
            <AppButton
              type="submit"
              color="primary"
              isLoading={submitting}
              disabled={submitting || charCount === 0}
            >
              Add Note
            </AppButton>
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
  );

  if (embedded) {
    return <div className={className}>{content}</div>;
  }

  return (
    <AppCard
      className={className}
      title={
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
                  · {notesList.length} note
                  {notesList.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        </div>
      }
    >
      {content}
    </AppCard>
  );
};

export default StoreNotes;
