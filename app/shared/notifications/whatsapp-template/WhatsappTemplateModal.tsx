import { ArrowLeft, Send } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import AppTab from "~/components/core/tab/AppTab";
import CommonService from "~/services/CommonService";
import ShareService from "~/services/ShareService";
import WhatsappTemplateService from "~/services/WhatsappTemplateService";
import { getCount, getData, prepareParams, getCategories } from "./helper";
import { AppSelect } from "~/components/core/form";
import WhatsappTemplateList from "./WhatsappTemplateList";
import WhatsappTemplatePreview from "./WhatsappTemplatePreview";

import type { TabItem } from "~/types/CommonTypes";
import AuthService from "~/services/AuthService";
import { CLUB_STORE_URL, ROS_STORE_URL } from "~/constants";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  data?: {
    dynamicData?: Record<string, any>;
  };
  users?: { name?: string; mobile?: string; type?: string }[];
  categories?: string[];
  ignoreCategories?: string[];
  templateFor?: string[];
  showTemplateForSelect?: boolean;
  showCategoryDropdown?: boolean;
};

const b2bOptions = [
  { label: "All Types", value: "all" },
  { label: "B2B", value: "B2B" },
  { label: "B2C", value: "B2C" },
];

export const languages: TabItem[] = [
  { key: "all", name: "All" },
  ...CommonService.getAppSupportedLanguages().map((lang) => ({
    key: lang.value,
    name: lang.label,
  })),
];

const WhatsappTemplateModal: React.FC<Props> = ({
  show,
  callback,
  data,
  users = [],
  categories,
  ignoreCategories,
  templateFor,
  showTemplateForSelect = false,
  showCategoryDropdown = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSendingTemplateId, setIsSendingTemplateId] = useState<
    string | number | null
  >(null);
  const [selectedContactIdx, setSelectedContactIdx] = useState<number>(0);
  const [activeLangTab, setActiveLangTab] = useState<string>("all");
  const [totalCount, setTotalCount] = useState(0);
  const [view, setView] = useState<"list" | "preview">("list");
  const [categoryList, setCategoryList] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [selectedTemplateFor, setSelectedTemplateFor] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [activeMainTab, setActiveMainTab] = useState<string>("all");

  const mainTabs: TabItem[] = [
    { key: "all", name: "All Templates" },
    { key: "recommended", name: "Recommended" },
  ];

  const paginationRef = useRef({
    activePage: 1,
    rowsPerPage: 50,
    startSlNo: 1,
    endSlNo: 50,
    totalRecords: 0,
  });

  const filterRef = useRef<Record<string, any>>({
    search: "",
    language: activeLangTab,
    categories,
    ignoreCategories,
    templateFor,
  });

  // Reset UI state when modal opens
  useEffect(() => {
    if (!show) return;
    setSelectedContactIdx(0);
    setView("list");
    setSelectedTemplate(null);
    setActiveMainTab("all");
    filterRef.current.showAll = true;
    // reset templateFor filter and dropdown when modal opens
    if (templateFor && Array.isArray(templateFor) && templateFor.length > 0) {
      filterRef.current.templateFor = templateFor;
      if (templateFor.length === 1) {
        const val = String(templateFor[0]);
        setSelectedTemplateFor(val === "B2B" || val === "B2C" ? val : "all");
      } else {
        setSelectedTemplateFor("all");
      }
    } else {
      setSelectedTemplateFor("all");
      filterRef.current.templateFor = undefined;
    }
    setSelectedCategory("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // Re-fetch templates when modal is open and filters change
  useEffect(() => {
    if (!show) return;
    filterRef.current.language = activeLangTab;
    filterRef.current.categories = categories;
    filterRef.current.ignoreCategories = ignoreCategories;
    loadCategories();
    paginationRef.current.activePage = 1;
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, activeLangTab, categories, templateFor]);

  const loadCategories = async () => {
    try {
      const params = {
        language: filterRef.current.language,
        templateFor: filterRef.current.templateFor,
        ignoreCategories: filterRef.current.ignoreCategories,
      };
      const cats = await getCategories(params);
      setCategoryList(cats || []);
    } catch (error) {
      console.error("loadCategories", error);
      setCategoryList([]);
    }
  };

  const applyFilter = async () => {
    setLoading(true);
    paginationRef.current.activePage = 1;
    const params = prepareParams(
      filterRef.current,
      paginationRef.current as any,
    );
    try {
      // include store links so placeholders like {{storeLink}} get rendered in preview
      let mobile = AuthService.getLoggedInUser()?.mobile;
      if (AuthService.isManpowerLoggedIn()) {
        mobile = AuthService.getManpower()?.mobile || mobile;
      }
      const dynamicDataWithLinks = {
        ...(data?.dynamicData || {}),
        b2bStoreLink: `${ROS_STORE_URL}${mobile || ""}`,
        storeLink: `${CLUB_STORE_URL}${mobile || ""}`,
      };

      const dataList = await getData(params, dynamicDataWithLinks);
      setTemplates(Array.isArray(dataList) ? dataList : []);
      setHasMore(
        (Array.isArray(dataList) ? dataList.length : 0) ===
          paginationRef.current.rowsPerPage,
      );
      const count = await getCount(params);
      paginationRef.current.totalRecords = count;
      setTotalCount(count);
    } catch (error) {
      console.error(error);
      setTemplates([]);
      paginationRef.current.totalRecords = 0;
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    setIsLoadingMore(true);
    paginationRef.current.activePage = paginationRef.current.activePage + 1;
    const params = prepareParams(
      filterRef.current,
      paginationRef.current as any,
    );
    try {
      // include store links for subsequent pages too
      let mobile = AuthService.getLoggedInUser()?.mobile;
      if (AuthService.isManpowerLoggedIn()) {
        mobile = AuthService.getManpower()?.mobile || mobile;
      }
      const dynamicDataWithLinks = {
        ...(data?.dynamicData || {}),
        b2bStoreLink: `${ROS_STORE_URL}${mobile || ""}`,
        storeLink: `${CLUB_STORE_URL}${mobile || ""}`,
      };

      const dataList = await getData(params, dynamicDataWithLinks);
      setTemplates((prev) => [
        ...prev,
        ...(Array.isArray(dataList) ? dataList : []),
      ]);
      setHasMore(
        (Array.isArray(dataList) ? dataList.length : 0) ===
          paginationRef.current.rowsPerPage,
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleClose = () => {
    if (view === "preview") {
      setView("list");
      return;
    }
    callback({ action: "close" });
  };

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    setView("preview");
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    // Update filterRef categories to either all (null) or selected one
    if (cat) {
      filterRef.current.categories = [cat];
    } else {
      // if null, remove category filter (but keep ignoreCategories)
      filterRef.current.categories = categories;
    }
    paginationRef.current.activePage = 1;
    applyFilter();
  };

  const handleSend = async (template: any) => {
    if (!template || !template._id) return;
    const templateId = template._id;
    setIsSendingTemplateId(templateId);
    try {
      const dynamicData = data?.dynamicData || {};

      let mobile = AuthService.getLoggedInUser()?.mobile;
      if (AuthService.isManpowerLoggedIn()) {
        mobile = AuthService.getManpower()?.mobile || mobile;
      }

      const resp = await WhatsappTemplateService.send(templateId, {
        ...dynamicData,
        b2bStoreLink: `${ROS_STORE_URL}${mobile || ""}`,
        storeLink: `${CLUB_STORE_URL}${mobile || ""}`,
        mobileNo: mobile,
      });
      // Extract generated link from response and send via ShareService
      const link =
        resp && resp.data && resp.data.data ? resp.data.data.link : "";
      const body = template?.renderedBody || "";
      const shouldAttachLink = link && template?.isShareDynamic;
      const msg = shouldAttachLink
        ? body
          ? `${link}\n\n${body}`
          : link
        : body;
      // If a single user is provided, send to that phone; otherwise open generic share
      // Prefer selected contact if available, otherwise fallback to single user
      const phone =
        users && users.length > 0
          ? users[selectedContactIdx]?.mobile
          : undefined;
      ShareService.share({ msg, phone });

      // On success, return the generated link or response to caller
      callback({ action: "send", data: { template, users, resp } });
    } catch (error) {
      console.error("WhatsappTemplateModal.handleSend", error);
      // Inform caller about error
      callback({ action: "send_error", data: { template, users, error } });
    } finally {
      setIsSendingTemplateId(null);
    }
  };

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:max-w-2xl tw:w-full tw:h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:justify-between tw:w-full">
          <div className="tw:flex tw:items-center tw:gap-2">
            {view === "preview" && (
              <button
                onClick={() => setView("list")}
                className="tw:p-1 tw:hover:bg-gray-100 dark:tw:hover:bg-neutral-800 tw:rounded-full tw:transition-colors"
                aria-label="Back to list"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <ImgRender
              src="whatsapp-logo.png"
              alt="WhatsApp"
              className="tw:shrink-0 tw:w-5 tw:h-5"
            />
            <div className="tw:font-semibold tw:text-base">
              {view === "list"
                ? "Local WhatsApp Promotion"
                : "Template Preview"}
            </div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:h-[90vh]">
        <div className="tw:space-y-3">
          {/* Compact Users Section */}
          {users && users.length > 0 && (
            <div>
              <div className="tw:text-xs tw:font-medium tw:text-gray-900 dark:tw:text-gray-100 tw:mb-2">
                Select Recipients
              </div>
              <div className="tw:mb-2">
                <AppSwiper
                  config={{
                    slidesPerView: Math.min(3, users.length),
                    spaceBetween: 8,
                  }}
                >
                  {users.map((u, idx) => (
                    <AppSwiper.Slide key={idx} className="tw:px-1">
                      <button
                        onClick={() => setSelectedContactIdx(idx)}
                        className={`tw:w-full tw:text-left tw:py-2 tw:px-3 tw:rounded-lg tw:border tw:border-gray-200 dark:tw:border-neutral-800 tw:text-sm ${
                          selectedContactIdx === idx
                            ? "tw:bg-white dark:tw:bg-gray-800 tw:border-green-300 dark:tw:border-green-700 tw:shadow-sm"
                            : "tw:bg-transparent"
                        }`}
                      >
                        <div className="tw:flex tw:items-center tw:gap-1">
                          <div className="tw:font-medium tw:text-xs tw:truncate">
                            {u.name || u.mobile}
                          </div>
                          {u.type && (
                            <span className="tw:text-[9px] tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-gray-200 dark:tw:bg-neutral-700 tw:text-gray-600 dark:tw:text-gray-300 tw:whitespace-nowrap">
                              {u.type}
                            </span>
                          )}
                        </div>
                        <div className="tw:text-[10px] tw:text-gray-500 dark:tw:text-gray-400">
                          {u.mobile}
                        </div>
                      </button>
                    </AppSwiper.Slide>
                  ))}
                </AppSwiper>
              </div>
            </div>
          )}

          {/* Main Tabs: All Templates / Recommended For You (hidden in preview) */}
          {view === "list" && (
            <div className="tw:mb-1">
              <AppTab
                tabs={mainTabs}
                activeTab={activeMainTab}
                variant="underline"
                noShadow
                onTabChange={(tab) => {
                  setActiveMainTab(tab.key);
                  filterRef.current.showAll = tab.key === "all";
                  paginationRef.current.activePage = 1;
                  applyFilter();
                }}
              />
            </div>
          )}

          {/* Language Tabs (hidden in preview) */}
          {view === "list" && (
            <div className="tw:mb-3">
              <AppTab
                tabs={languages}
                activeTab={activeLangTab}
                onTabChange={(tab) => setActiveLangTab(tab.key)}
              />
            </div>
          )}

          {/* Templates Section (hide choose/ dropdown in preview) */}
          {view === "list" ? (
            <div className="tw:text-section">
              <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
                {/* Left column: title and count (count on new line) */}
                <div className="tw:flex-1">
                  <div className="tw:text-xs tw:font-medium tw:text-gray-900 dark:tw:text-gray-100">
                    Choose Template
                  </div>
                  <div className="tw:text-[12px] tw:text-gray-500 dark:tw:text-gray-400 tw:mt-1">
                    {`${totalCount || templates.length} templates`}
                  </div>
                </div>

                <div className="tw:shrink-0 tw:flex tw:items-center tw:gap-2">
                  {categoryList?.length && showCategoryDropdown ? (
                    <div className="tw:w-40">
                      <AppSelect
                        value={selectedCategory}
                        onChange={(v: any) => handleCategoryChange(v || null)}
                        options={categoryList}
                        inputClassName="tw:w-full tw:text-sm"
                        size="sm"
                      />
                    </div>
                  ) : null}

                  {showTemplateForSelect ? (
                    <div className="tw:flex tw:items-center tw:gap-1 tw:bg-gray-100 dark:tw:bg-neutral-800 tw:rounded-lg tw:p-1">
                      {b2bOptions.map((option) => {
                        const isSelected = selectedTemplateFor === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              const val = option.value;
                              setSelectedTemplateFor(val);
                              // if 'all', remove templateFor filter; otherwise pass as array
                              filterRef.current.templateFor =
                                val && String(val).toLowerCase() !== "all"
                                  ? [String(val)]
                                  : undefined;
                              paginationRef.current.activePage = 1;
                              // reload categories (they depend on templateFor) then apply
                              loadCategories();
                              applyFilter();
                            }}
                            className={`tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:rounded-md tw:transition-all tw:whitespace-nowrap ${
                              isSelected
                                ? "tw:bg-white dark:tw:bg-gray-900 tw:text-gray-900 dark:tw:text-gray-100 tw:shadow-sm"
                                : "tw:text-gray-600 dark:tw:text-gray-400 hover:tw:text-gray-900 dark:hover:tw:text-gray-200"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {loading && templates.length === 0 ? (
            <div className="tw:flex tw:items-center tw:justify-center tw:h-64">
              <AppSpinner />
            </div>
          ) : templates.length === 0 ? (
            <div className="tw:flex tw:items-center tw:justify-center tw:h-64 tw:text-sm tw:text-gray-500">
              No templates found
            </div>
          ) : view === "list" ? (
            <WhatsappTemplateList
              templates={templates}
              onSelect={handleSelectTemplate}
              selectedTemplateId={selectedTemplate?._id}
              loadMore={loadMore}
              loading={isLoadingMore}
              totalCount={totalCount}
            />
          ) : (
            <WhatsappTemplatePreview
              body={
                selectedTemplate?.renderedBody || selectedTemplate?.body || ""
              }
              imgUrl={selectedTemplate?.featureImage || ""}
              isAssetFeatureImage={selectedTemplate?.isAssetFeatureImage}
            />
          )}
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:w-full tw:flex tw:items-center tw:justify-between">
          <div className="tw:flex-1">
            {view === "preview" && (
              <AppButton
                onClick={() => setView("list")}
                size="small"
                fill="outline"
                color="secondary"
                className="tw:px-4"
              >
                Back to List
              </AppButton>
            )}
          </div>

          <div className="tw:flex tw:items-center tw:justify-end tw:gap-2 tw:flex-1">
            {view === "preview" && (
              <AppButton
                onClick={() => handleSend(selectedTemplate)}
                disabled={!selectedTemplate}
                size="small"
                fill="solid"
                color="primary"
                isLoading={
                  isSendingTemplateId === (selectedTemplate?._id as any)
                }
                className="tw:flex tw:items-center tw:gap-2 tw:px-4"
              >
                <Send size={14} />
                <span className="tw:text-sm">Send</span>
              </AppButton>
            )}
          </div>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default WhatsappTemplateModal;
