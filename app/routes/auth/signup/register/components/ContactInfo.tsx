import { useFormContext } from "react-hook-form";
import { AppInput } from "~/components/core/form";
import InpBlock from "./InpBlock";
import { Contact } from "lucide-react";
import { useTranslation } from "react-i18next";

const ContactInfo = () => {
  const { register } = useFormContext();
  const { t } = useTranslation(["signup"]);

  return (
    <InpBlock
      className="tw:h-full"
      title={t("register.contact.title")}
      defaultExpanded={false}
      expandOnDesktop={true}
      icon={<Contact size={20} />}
    >
      <div>
        <AppInput
          type="number"
          maxLength={10}
          name="mobile"
          register={register}
          label={t("register.contact.mobile.label")}
          placeholder={t("register.contact.mobile.placeholder")}
          isRequired={true}
          className="tw:mb-4"
        />

        <div className="tw:text-xs tw:text-app-gray-7 tw:mb-4 tw:text-gray-500">
          {t("register.contact.mobile.note")}
        </div>

        <div className="tw:flex tw:items-center tw:gap-2">
          <input type="checkbox" name="isWhatsapp" />
          <span className="tw:text-xs tw:text-app-gray-7">
            {t("register.contact.mobile.isWhatsapp")}
          </span>
        </div>

        <AppInput
          name="ownerName"
          register={register}
          label={t("register.contact.name.label")}
          placeholder={t("register.contact.name.placeholder")}
          isRequired={true}
          className="tw:mb-4 tw:mt-4"
        />

        <AppInput
          name="email"
          register={register}
          label={t("register.contact.email.label")}
          placeholder={t("register.contact.email.placeholder")}
          isRequired={false}
          className="tw:mb-4"
        />
      </div>
    </InpBlock>
  );
};

export default ContactInfo;
