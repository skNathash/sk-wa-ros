import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import PaylaterService from "~/services/PaylaterService";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import type { Customer } from "../Overview";
import ContactDetails from "./ContactDetails";
import CustomerInfo from "./CustomerInfo";
import QuickActions, { type QuickActionKey } from "./QuickActions";
import Summary from "./Summary";

interface CustomerSidePaneProps {
  customer: Customer;
  className?: string;
}

/**
 * Side-pane contents for the B2C customer detail page in theme-2 desktop —
 * who the customer is, the three numbers that matter, the actions the seller
 * takes on them and how to reach them. Mirrors `VendorSidePane` on the supply
 * side; the page drops it into `AppPaneSide` and the CSS re-homes it as the
 * fixed pane beside the section rail.
 */
const CustomerSidePane = ({ customer, className }: CustomerSidePaneProps) => {
  const appNav = useAppNav();

  const [whatsappModal, setWhatsappModal] = useState<{
    show: boolean;
    data?: any;
    users?: { name?: string; mobile?: string }[];
    ignoreCategories?: string[];
  }>({ show: false });

  // Credit left on the paylater wallet — the pane's own read, so the strip
  // shows the same number as the ladder in the main column.
  const [paylaterAvailable, setPaylaterAvailable] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchWallet = async () => {
      if (!customer._id) return;
      try {
        const resp: any = await PaylaterService.validateEligibility({
          userInfo: { id: customer._id, type: "customer" },
          franchiseInfo: { id: AuthService.getLoggedInUserId() },
        });
        const wallet = resp?.data?.data?.paylaterInfo;
        if (!cancelled) {
          setPaylaterAvailable(
            wallet?.creditAvailable ?? wallet?.creditLimit ?? 0,
          );
        }
      } catch {
        if (!cancelled) setPaylaterAvailable(0);
      }
    };

    fetchWallet();
    return () => {
      cancelled = true;
    };
  }, [customer._id]);

  const basePath = `/dashboard/network/view/b2c/${customer._id}`;

  const address = [customer.address?.city, customer.address?.district]
    .filter(Boolean)
    .join(", ");

  const openWhatsapp = (ignoreCategories: string[]) => {
    setWhatsappModal({
      show: true,
      data: {
        dynamicData: {
          customerName: customer.name,
          orderId: "-",
          franchiseName: AuthService.getLoggedInUser()?.name || "",
          franchiseId: AuthService.getLoggedInUserId(),
          customerId: customer._id,
        },
      },
      users: [{ name: customer.name, mobile: customer.mobile }],
      ignoreCategories,
    });
  };

  const handleQuickAction = ({ action }: { action: QuickActionKey }) => {
    if (action === "ping") {
      openWhatsapp(["Invite", "payLater"]);
      return;
    }
    if (action === "offer") {
      // Offers ride the same template picker, minus the transactional ones.
      openWhatsapp(["Invite", "payLater", "Order"]);
      return;
    }
    if (action === "coin-store") {
      appNav.to(`${basePath}/loyalty-program`);
      return;
    }
    if (action === "new-bill") {
      appNav.to("/pos/billing");
    }
  };

  const related = [
    {
      key: "paylater",
      code: "PL",
      tone: "tw:bg-violet-500",
      title: "Paylater wallet",
      detail: "Limit, dues & statement",
      path: `${basePath}/paylater`,
    },
    {
      key: "coins",
      code: "CN",
      tone: "tw:bg-amber-500",
      title: "King Coins",
      detail: `${customer.points ?? 0} coins · redeem now`,
      path: `${basePath}/loyalty-program`,
    },
  ];

  return (
    <>
      <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
        {/* Identity band — who we're looking at, and their headline numbers.
            `app-bleed-x` cancels the pane's side gutters and `app-pane-hero`
            its top padding, so the band owns the pane's top-left corner and
            sits flush against the icon rail instead of floating as a card. */}
        <div className="app-bleed-x app-pane-hero tw:bg-linear-to-br tw:from-primary tw:to-primary/80 tw:p-4">
          <CustomerInfo name={customer.name} mobile={customer.mobile} />
          <Summary
            coins={customer.points ?? 0}
            paylater={paylaterAvailable}
            ltv={(customer as Record<string, any>).ltv}
          />
        </div>

        <QuickActions callback={handleQuickAction} />

        <ContactDetails
          mobile={customer.mobile}
          address={address}
          dob={(customer as any).dob}
        />

        {/* Where the rest of this customer lives — the two tabs a seller opens
            most, reachable without walking the tab bar. */}
        <div className="tw:mb-4">
          <p className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
            Related
          </p>

          {/* Edge-to-edge list: `app-bleed-x` cancels the pane gutter (and the
              radius with it), so the rows read as pane sections separated by
              hairlines rather than floating cards. The row padding restores
              the gutter inside. */}
          <div className="app-bleed-x tw:mt-2 tw:flex tw:flex-col tw:divide-y tw:divide-slate-200 tw:border-y tw:border-slate-200">
            {related.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => appNav.to(item.path)}
                className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-none tw:bg-white tw:px-4 tw:py-2.5 tw:text-left tw:transition-colors tw:hover:bg-slate-50"
              >
                <span
                  className={clsx(
                    "tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:text-xs tw:font-bold tw:text-white",
                    item.tone,
                  )}
                >
                  {item.code}
                </span>
                <span className="tw:min-w-0 tw:flex-1">
                  <span className="tw:block tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
                    {item.title}
                  </span>
                  <span className="tw:block tw:truncate tw:text-xs tw:text-slate-500">
                    {item.detail}
                  </span>
                </span>
                <ChevronRight size={16} className="tw:shrink-0 tw:text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <WhatsappTemplateModal
        show={!!whatsappModal.show}
        data={whatsappModal.data}
        users={whatsappModal.users}
        categories={[]}
        templateFor={["B2C"]}
        ignoreCategories={whatsappModal.ignoreCategories}
        callback={() => setWhatsappModal({ show: false })}
      />
    </>
  );
};

export default CustomerSidePane;
