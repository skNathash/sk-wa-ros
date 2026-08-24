import { format, isValid, parseISO } from "date-fns";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";

/** One contact the reminder can go to — the customer or a nominee. */
export interface ReminderContact {
  name: string;
  mobile: string;
  type: string;
}

/** Everything `WhatsappTemplateModal` needs for a PayLater reminder. */
export interface ReminderModalData {
  data: { dynamicData: Record<string, any> };
  users: ReminderContact[];
  categories: string[];
  templateFor: string[];
}

/** Due date as the PayLater templates render it — "12 Aug 2026". */
export const formatReminderDueDate = (value: any): string => {
  if (!value) return "";
  try {
    const parsed = typeof value === "string" ? parseISO(value) : value;
    return isValid(parsed) ? format(parsed, "dd MMM yyyy") : String(value);
  } catch (e) {
    return String(value);
  }
};

/**
 * The reminder payload every PayLater surface hands the WhatsApp template
 * modal — one shape, so the template variables read the same wherever the
 * nudge is fired from.
 */
export const buildReminderModalData = ({
  customerName,
  customerId,
  mobile,
  amount,
  dueDate,
  userCategory,
  nominees = [],
}: {
  customerName?: string;
  customerId?: string;
  mobile?: string;
  amount?: number;
  dueDate?: any;
  userCategory?: string;
  nominees?: Array<{ name?: string; mobile?: string }>;
}): ReminderModalData => ({
  data: {
    dynamicData: {
      customerName: customerName || "",
      franchiseName: AuthService.getLoggedInUser()?.name,
      amount: CommonService.formattedAmount(amount || 0),
      dueDate: formatReminderDueDate(dueDate),
      franchiseId: AuthService.getLoggedInUserId(),
      customerId,
    },
  },
  users: [
    {
      name: customerName || "",
      mobile: mobile || "",
      type: "Customer",
    },
    ...nominees.map((nominee) => ({
      name: nominee?.name || "",
      mobile: nominee?.mobile || "",
      type: "Nominee",
    })),
  ],
  categories: ["payLater"],
  templateFor: [userCategory === "B2B" ? "B2B" : "B2C"],
});

/** Same payload, built straight off a due-collection request row. */
export const buildReminderModalDataFromRequest = (item: any) =>
  buildReminderModalData({
    customerName: item?.userInfo?.name,
    customerId: item?.userInfo?._id,
    mobile: item?.userInfo?.mobile,
    amount: item?.totalPayableAmount,
    dueDate: item?.validityEndDate,
    userCategory: item?.userCategory,
    nominees: item?.NomineeDetails || [],
  });

/**
 * Network profile link for a PayLater account — B2C (customer) goes to the
 * B2C view page, everything else maps to B2B (franchise / retailer).
 */
export const getNetworkViewLink = (
  userType: string,
  userId: string,
): string => {
  const normalized = (userType || "").toString().toLowerCase().trim();
  const category =
    normalized === "customer" || normalized === "b2c" ? "b2c" : "b2b";
  return `/dashboard/network/view/${category}/${userId}`;
};
