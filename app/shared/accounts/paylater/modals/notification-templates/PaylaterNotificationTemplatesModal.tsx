import { Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import Divider from "~/components/core/divider/Divider";
import AppModal from "~/components/core/modal/AppModal";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import MiscService from "~/services/MiscService";
import PaylaterNotificationTemplateService from "~/services/PaylaterNotificationTemplateService";
import ShareService from "~/services/ShareService";
import type { PaylaterNotificationTemplate } from "~/types/PayalterTypes";

interface PaylaterNotificationTemplatesModalProps {
  show: boolean;
  callback: (payload: { action: string; data: any }) => void;
  data: {
    templateData?: PaylaterNotificationTemplate;
    userInfo?: { name?: string; mobile?: string };
    nominees?: any[];
  };
}

const languages = [
  { value: "en", label: "English" },
  { value: "kn", label: "ಕನ್ನಡ" },
];

const PaylaterNotificationTemplatesModal: React.FC<
  PaylaterNotificationTemplatesModalProps
> = ({ show, callback, data = {} }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templates, setTemplates] = useState<{ msg: string }[]>([]);
  const [recipients, setRecipients] = useState<
    Array<{
      id: string;
      type: "customer" | "nominee";
      name?: string;
      mobile?: string;
      nomineeIndex?: number;
    }>
  >([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("0");

  // Get templates from service
  const getTemplates = useCallback(
    (lang: string) => {
      const templates = PaylaterNotificationTemplateService.getDueTemplates(
        data.templateData || {},
        lang,
        "\n\n",
      );
      return templates;
    },
    [data.templateData],
  );

  // Load templates when modal opens or language changes
  useEffect(() => {
    if (show && data) {
      const currentLang = MiscService.getSelectedLang();
      setSelectedLanguage(currentLang);
      const langTemplates = getTemplates(currentLang);
      setTemplates(langTemplates);
      if (langTemplates.length > 0) {
        setSelectedTemplate("0");
      }
      // build recipients list (customer first, then nominees)
      const list: Array<any> = [];
      list.push({
        id: "0",
        type: "customer",
        name: data.templateData?.customerName || data.userInfo?.name || "-",
        mobile: data.userInfo?.mobile || "",
      });
      if (data.nominees && Array.isArray(data.nominees)) {
        data.nominees.forEach((n: any, idx: number) => {
          list.push({
            id: `n-${idx}`,
            type: "nominee",
            name: n?.name || "-",
            mobile: n?.mobile || "",
            nomineeIndex: idx,
          });
        });
      }
      setRecipients(list);
      setSelectedRecipient(list.length > 0 ? list[0].id : "");
    }
  }, [show, data, getTemplates]);

  // Update templates when language changes
  useEffect(() => {
    if (show && selectedLanguage) {
      const langTemplates = getTemplates(selectedLanguage);
      setTemplates(langTemplates);
      if (langTemplates.length > 0) {
        setSelectedTemplate("0");
      }
    }
  }, [selectedLanguage, show, getTemplates]);

  // Reset when modal closes
  useEffect(() => {
    if (!show) {
      setSelectedTemplate("");
      setSelectedLanguage(MiscService.getSelectedLang());
      setRecipients([]);
      setSelectedRecipient("0");
    }
  }, [show]);

  const handleClose = useCallback(() => {
    callback({ action: "close", data: {} });
  }, [callback]);

  const handleLanguageChange = useCallback((lang: string) => {
    setSelectedLanguage(lang);
    setSelectedTemplate("");
  }, []);

  const handleSend = useCallback(() => {
    const templates = PaylaterNotificationTemplateService.getDueTemplates(
      data.templateData || {},
      selectedLanguage,
    );

    const selectedTemplateMsg = templates[parseInt(selectedTemplate)].msg;
    // Determine recipient mobile
    let mobileToSend: string | undefined;
    const recipient = recipients.find((r) => r.id === selectedRecipient);
    if (recipient) {
      mobileToSend = recipient.mobile;
    }

    // Send message via ShareService with optional phone
    ShareService.share({
      msg: selectedTemplateMsg,
      phone: mobileToSend,
    });

    // Close modal after sending
    handleClose();
  }, [
    selectedTemplate,
    selectedLanguage,
    data,
    handleClose,
    recipients,
    selectedRecipient,
  ]);

  return (
    <AppModal
      show={show}
      callback={handleClose}
      className="tw:max-w-2xl tw:max-h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">Send Reminder</div>
        <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
          Choose a template and language to send reminder to customer
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[90vh]">
        {/* Recipients (customer + nominees) - compact single-select list */}
        <div className="tw:mb-4">
          <div className="tw:flex tw:items-center tw:justify-between">
            <div className="tw:text-sm tw:font-medium">Send To</div>
            <div className="tw:text-xs tw:text-gray-500">
              Select one recipient
            </div>
          </div>

          <div className="tw:mt-3">
            <RadioGroup
              value={selectedRecipient}
              onValueChange={setSelectedRecipient}
              className="tw:space-y-2"
            >
              {recipients.map((r) => (
                <div
                  key={r.id}
                  className={`tw:border tw:rounded-lg tw:px-3 tw:py-2 tw:cursor-pointer tw:flex tw:items-center tw:justify-between tw:gap-3 ${
                    selectedRecipient === r.id
                      ? "tw:border-blue-500 tw:bg-blue-50"
                      : "tw:border-gray-200 tw:bg-white hover:tw:bg-gray-50"
                  }`}
                  onClick={() => setSelectedRecipient(r.id)}
                >
                  <div className="tw:flex tw:flex-col">
                    <div className="tw:text-sm tw:font-medium tw:text-gray-900">
                      {r.name || "-"}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500">
                      {r.mobile || "-"}
                    </div>
                  </div>
                  <RadioGroupItem value={r.id} className="tw:ml-4" />
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <Divider />

        {/* Language Selection */}
        <div className="tw:mb-6">
          <div className="tw:text-sm tw:font-semibold tw:mb-3 tw:text-gray-700">
            Select Language
          </div>
          <div className="tw:flex tw:gap-2">
            {languages.map((lang) => (
              <button
                key={lang.value}
                onClick={() => handleLanguageChange(lang.value)}
                className={`tw:px-4 tw:py-2 tw:rounded-full tw:text-sm tw:font-medium tw:transition-all tw:border ${
                  selectedLanguage === lang.value
                    ? "tw:bg-blue-500 tw:text-white tw:border-blue-500 tw:shadow-sm"
                    : "tw:bg-white tw:text-gray-700 tw:border-gray-300 hover:tw:bg-gray-50 hover:tw:border-gray-400"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template Selection */}
        <div className="tw:mb-4">
          <div className="tw:text-sm tw:font-semibold tw:mb-3 tw:text-gray-700">
            Select Template
          </div>
          <RadioGroup
            value={selectedTemplate}
            onValueChange={setSelectedTemplate}
            className="tw:space-y-3"
          >
            {templates.map((template, index) => (
              <div
                key={index}
                className={`tw:border tw:rounded-lg tw:p-4 tw:cursor-pointer tw:transition-all ${
                  selectedTemplate === index.toString()
                    ? "tw:border-blue-500 tw:bg-blue-50"
                    : "tw:border-gray-200 tw:bg-white hover:tw:bg-gray-50"
                }`}
                onClick={() => setSelectedTemplate(index.toString())}
              >
                <div className="tw:flex tw:items-start tw:gap-3">
                  <RadioGroupItem
                    value={index.toString()}
                    className="tw:mt-1"
                  />
                  <div className="tw:flex-1">
                    <div className="tw:text-sm tw:whitespace-pre-wrap tw:text-gray-700">
                      {template.msg}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:gap-2 tw:justify-end">
          <AppButton
            size="small"
            color="light"
            fill="outline"
            onClick={handleClose}
          >
            Cancel
          </AppButton>
          <AppButton
            size="small"
            color="primary"
            onClick={handleSend}
            disabled={!selectedTemplate || !selectedRecipient}
          >
            <Send size={16} />
            Send Reminder
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default PaylaterNotificationTemplatesModal;
