import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import PaylaterService from "~/services/PaylaterService";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import ContactDetails from "./ContactDetails";
import QuickActions, { type QuickActionKey } from "./QuickActions";
import RetailerInfo from "./RetailerInfo";
import Summary from "./Summary";

interface RetailerSidePaneProps {
  /** The franchise record loaded by the layout. */
  franchise: Record<string, any>;
  className?: string;
}

/**
 * Side-pane contents for the B2B retailer detail page in theme-2 desktop — who
 * the shop is, the three numbers that matter, the actions the seller takes on
 * them and how to reach them. Mirrors `CustomerSidePane` on the B2C side; the
 * page drops it into `AppPaneSide` and the CSS re-homes it as the fixed pane
 * beside the section rail.
 */
const RetailerSidePane = ({ franchise, className }: RetailerSidePaneProps) => {
  const appNav = useAppNav();

  const [whatsappModal, setWhatsappModal] = useState<{
    show: boolean;
    data?: any;
    users?: { name?: string; mobile?: string }[];
    ignoreCategories?: string[];
  }>({ show: false });

  // Credit left on (and drawn from) the paylater wallet — the pane's own read,
  // so the strip shows the same numbers as the ladder in the main column.
  const [wallet, setWallet] = useState<{ available: number; dues: number }>({
    available: 0,
    dues: 0,
  });

  const franchiseId = franchise._id;

  useEffect(() => {
    let cancelled = false;

    const fetchWallet = async () => {
      if (!franchiseId) return;
      try {
        const resp: any = await PaylaterService.validateEligibility({
          userInfo: { id: franchiseId, type: "franchise" },
          franchiseInfo: { id: AuthService.getLoggedInUserId() },
        });
        const info = resp?.data?.data?.paylaterInfo;
        if (!cancelled) {
          setWallet({
            available: info?.creditAvailable ?? info?.creditLimit ?? 0,
            dues: info?.totalPayableAmount ?? 0,
          });
        }
      } catch {
        if (!cancelled) setWallet({ available: 0, dues: 0 });
      }
    };

    fetchWallet();
    return () => {
      cancelled = true;
    };
  }, [franchiseId]);

  const basePath = `/dashboard/network/view/b2b/${franchiseId}`;

  const name = franchise.name;
  const mobile = franchise.mobile;

  const address = [
    franchise.city || franchise.town,
    franchise.district,
    franchise.state,
  ]
    .filter(Boolean)
    .join(", ");

  const { gst } = FranchiseService.getFranchiseDocumentInfo(franchise) || {};

  const openWhatsapp = (ignoreCategories: string[]) => {
    setWhatsappModal({
      show: true,
      data: {
        dynamicData: {
          customerName: name,
          orderId: "-",
          franchiseName: AuthService.getLoggedInUser()?.name || "",
          franchiseId: AuthService.getLoggedInUserId(),
          customerId: franchiseId,
        },
      },
      users: [{ name, mobile }],
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
    if (action === "new-order") {
      appNav.to(`/pos/b2b-checkout?assisted=true&retailerId=${franchiseId}`);
      return;
    }
    if (action === "statement") {
      appNav.to(`${basePath}/statement`);
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
      key: "orders",
      code: "OR",
      tone: "tw:bg-emerald-600",
      title: "Orders",
      detail: "Everything this shop has booked",
      path: basePath,
    },
    {
      key: "kyc",
      code: "KY",
      tone: "tw:bg-sky-600",
      title: "KYC",
      detail: gst ? `GST · ${gst}` : "Documents & verification",
      path: `${basePath}/kyc`,
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
          <RetailerInfo
            name={name}
            mobile={mobile}
            shopImage={franchise.approvedShopImage}
            franchiseId={franchise.franchiseId}
          />
          <Summary
            paylater={wallet.available}
            dues={wallet.dues}
            business={franchise.ltv || franchise.totalBusiness || 0}
          />
        </div>

        <QuickActions callback={handleQuickAction} />

        <ContactDetails
          mobile={mobile}
          address={address}
          business={franchise.primaryBusiness}
          registeredOn={franchise.createdAt}
        />

        {/* Where the rest of this retailer lives — the tabs a seller opens
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
                <ChevronRight
                  size={16}
                  className="tw:shrink-0 tw:text-slate-400"
                />
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
        templateFor={["B2B"]}
        ignoreCategories={whatsappModal.ignoreCategories}
        callback={() => setWhatsappModal({ show: false })}
      />
    </>
  );
};

export default RetailerSidePane;
