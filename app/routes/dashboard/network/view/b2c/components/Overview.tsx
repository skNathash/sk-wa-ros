import React from "react";
import { Mail, Phone, Calendar, Coins, Camera, Send } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import UserPic from "~/shared/users/components/UserPic";
import AppButton from "~/components/core/button/AppButton";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import CustomerUpdateModal from "~/shared/users/modals/customer-update/CustomerUpdateModal";
import AuthService from "~/services/AuthService";

export type Customer = {
  franchiseInfo?: { id: string; name: string };
  address?: {
    street?: string;
    city?: string;
    district?: string;
    state?: string;
    postcode?: string;
  };
  points?: number | null;
  _id: string;
  referenceId?: string;
  email?: string;
  name: string;
  registeredFrom?: string;
  mobile?: string;
  status?: string;
  profileImages?: string[];
  gender?: string;
  isActive?: boolean;
  createdAt?: string;
  dateOfRegistration?: string;
  __v?: number;
  userId?: string;
};

interface OverviewProps {
  customer: Customer;
  onRefresh?: () => void;
}

function getInitials(name: string) {
  if (!name) return "";
  const parts = name.split(" ");
  return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
}

export default function Overview({ customer, onRefresh }: OverviewProps) {
  const user = {
    initials: getInitials(customer.name),
    name: customer.name,
    membership: customer.status || "MEMBER",
    email: customer.email || "",
    phone: customer.mobile || "",
    joined: customer.dateOfRegistration || "",
    points: customer.points ?? 0,
  };

  const [whatsappModal, setWhatsappModal] = React.useState<{
    show: boolean;
    data?: any;
    users?: { name?: string; mobile?: string }[];
    categories?: string[];
    ignoreCategories?: string[];
    templateFor?: string[];
  }>({
    show: false,
    data: undefined,
    users: [],
    categories: undefined,
    ignoreCategories: undefined,
    templateFor: undefined,
  });

  const [updateModal, setUpdateModal] = React.useState<{
    show: boolean;
    inputs: string[];
  }>({ show: false, inputs: [] });

  const handleWhatsappCallback = (a: { action: string; data?: any }) => {
    setWhatsappModal((s) => ({ ...s, show: false, category: undefined }));
  };

  const handleWhatsappClick = () => {
    setWhatsappModal({
      show: true,
      data: {
        dynamicData: {
          customerName: user.name,
          orderId: "-",
          franchiseName: AuthService.getLoggedInUser()?.name || "",
          franchiseId: AuthService.getLoggedInUserId(),
          customerId: customer._id,
        },
      },
      users: [{ name: user.name, mobile: user.phone }],
      categories: [],
      ignoreCategories: ["Invite", "payLater"],
      templateFor: ["B2C"],
    });
  };

  const handleEditClick = (fields: string[]) => {
    setUpdateModal({ show: true, inputs: fields });
  };

  const handleUpdateCallback = (result: { action: string; data?: any }) => {
    setUpdateModal({ show: false, inputs: [] });
    if (result.action === "success") {
      onRefresh?.();
    }
  };

  const editBtn = (fields: string[]) => (
    <button
      type="button"
      onClick={() => handleEditClick(fields)}
      className="tw:px-1.5 tw:py-0.5 tw:rounded hover:tw:bg-gray-100 tw:cursor-pointer tw:transition-colors tw:inline-flex tw:items-center tw:gap-0.5 tw:text-xs tw:text-gray-400 hover:tw:text-gray-600"
      title="Edit"
    >
      <Camera size={11} />
      Edit
    </button>
  );

  const renderItem = (
    icon: React.ReactNode,
    label: string,
    value: React.ReactNode,
    bgColor: string = "tw:bg-gray-50",
    editFields?: string[],
  ) => {
    return (
      <div className="tw:flex tw:items-center tw:gap-4">
        <div className={`tw:p-2 ${bgColor} tw:rounded`}>{icon}</div>
        <div className="tw:flex-1">
          <div className="tw:flex tw:items-center tw:gap-1">
            <div className="tw:text-xs tw:text-gray-500 tw:font-semibold">
              {label}
            </div>
            {editFields && editBtn(editFields)}
          </div>
          <span className="tw:text-sm tw:font-semibold">{value}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <AppCard noPadding>
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-2">
          <div className="tw:bg-linear-to-br tw:from-primary tw:to-primary/80 tw:md:w-36 tw:h-36 tw:md:h-auto tw:flex tw:items-center tw:justify-center tw:shadow-lg tw:relative tw:overflow-hidden">
            {/* Background decoration */}
            <div className="tw:absolute tw:inset-0 tw:opacity-10">
              <div className="tw:absolute tw:top-0 tw:right-0 tw:w-20 tw:h-20 tw:bg-white tw:rounded-full tw:-mr-10 tw:-mt-10"></div>
              <div className="tw:absolute tw:bottom-0 tw:left-0 tw:w-16 tw:h-16 tw:bg-white tw:rounded-full tw:-ml-8 tw:-mb-8"></div>
            </div>
            {/* Initials / photo */}
            <div className="tw:relative tw:z-10">
              <div className="tw:w-20 tw:h-20 tw:rounded-full tw:overflow-hidden tw:border-2 tw:border-white/30">
                <UserPic
                  assetId={customer.profileImages?.[0]}
                  gender={customer.gender}
                  type="b2c"
                  alt={user.name}
                  className="tw:w-full tw:h-full tw:object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => handleEditClick(["photo"])}
                className="tw:absolute tw:-bottom-1 tw:left-1/2 tw:-translate-x-1/2 tw:bg-white tw:rounded-full tw:px-2 tw:py-0.5 tw:shadow tw:cursor-pointer tw:flex tw:items-center tw:gap-1 hover:tw:bg-gray-50 tw:transition-colors"
                title="Upload photo"
              >
                <Camera size={12} className="tw:text-primary" />
                <span className="tw:text-[10px] tw:font-medium tw:text-primary">
                  Photo
                </span>
              </button>
            </div>
          </div>
          <div className="tw:flex-1 tw:p-4">
            <div className="tw:flex tw:flex-col tw:sm:flex-row tw:gap-2 tw:mb-6 tw:sm:justify-between tw:sm:items-center">
              <div>
                <div className="tw:text-xl tw:md:text-2xl tw:font-semibold tw:text-gray-900 tw:mb-1">
                  {user.name}
                </div>

                {user.email && (
                  <div className="tw:flex tw:items-center tw:gap-1 tw:text-gray-700 tw:text-xs">
                    <Mail className="tw:text-gray-400" size={14} />
                    {user.email}
                  </div>
                )}
              </div>

              <div className="tw:self-start">
                <AppButton
                  onClick={handleWhatsappClick}
                  size="small"
                  className="tw:flex tw:items-center tw:gap-2 tw:bg-green-500 tw:text-white hover:tw:bg-green-600 tw:shadow-sm tw:px-4 tw:whitespace-nowrap"
                >
                  <ImgRender
                    src="whatsapp-logo.png"
                    className="tw:w-5 tw:h-5 tw:object-cover tw:brightness-0 tw:invert"
                  />
                  <span className="tw:text-sm tw:font-semibold">
                    Promote via WhatsApp
                  </span>
                  <Send size={14} />
                </AppButton>
              </div>
            </div>

            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4">
              {renderItem(
                <Phone className="tw:w-5 tw:h-5 tw:text-red-400" />,
                "Mobile No.",
                user.phone,
                "tw:bg-red-50",
              )}

              {renderItem(
                <Calendar className="tw:w-5 tw:h-5 tw:text-green-400" />,
                "Joined",
                <DateFormat value={user.joined} formatStr="dd MMM yyyy" />,
                "tw:bg-green-50",
              )}

              {renderItem(
                <Coins className="tw:w-5 tw:h-5 tw:text-blue-400" />,
                "King Coins",
                user.points,
                "tw:bg-blue-50",
              )}
            </div>
          </div>
        </div>
      </AppCard>

      <WhatsappTemplateModal
        show={!!whatsappModal.show}
        data={whatsappModal.data}
        users={whatsappModal.users}
        categories={whatsappModal.categories}
        templateFor={whatsappModal.templateFor}
        callback={handleWhatsappCallback}
        ignoreCategories={whatsappModal.ignoreCategories}
      />

      <CustomerUpdateModal
        cid={customer._id}
        show={updateModal.show}
        inputs={updateModal.inputs}
        callback={handleUpdateCallback}
      />
    </>
  );
}
