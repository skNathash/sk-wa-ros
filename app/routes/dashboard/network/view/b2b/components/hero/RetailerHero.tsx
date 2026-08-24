import { FileText, MessageCircle, Plus, Send, Star } from "lucide-react";
import { useEffect, useState } from "react";
import ImgRender from "~/components/core/img/ImgRender";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import PaylaterService from "~/services/PaylaterService";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import PartyHero, {
  type PartyHeroAction,
  type PartyHeroChip,
} from "~/shared/network/components/party-hero/PartyHero";

interface RetailerHeroProps {
  /** The franchise record loaded by the layout. */
  franchise: Record<string, any>;
  className?: string;
}

/** What a seller does to a retailer straight off the hero. */
const ACTIONS: PartyHeroAction[] = [
  { key: "ping", label: "Ping", icon: MessageCircle, tone: "primary" },
  { key: "new-order", label: "Order", icon: Plus, tone: "emerald" },
  { key: "offer", label: "Offer", icon: Send, tone: "violet" },
  { key: "statement", label: "Statement", icon: FileText, tone: "slate" },
];

/**
 * Identity hero for the B2B retailer page — who the shop is, the three numbers
 * that decide what happens next (credit left, dues, business booked) and the
 * four actions the seller takes on them. Owns its own wallet read, so the page
 * only says which retailer it is.
 */
const RetailerHero = ({ franchise, className }: RetailerHeroProps) => {
  const appNav = useAppNav();

  const [whatsappModal, setWhatsappModal] = useState<{
    show: boolean;
    data?: any;
    users?: { name?: string; mobile?: string }[];
    ignoreCategories?: string[];
  }>({ show: false });

  // Credit left on (and drawn from) the paylater wallet — the hero's own read,
  // so the strip shows the same numbers as the ladder further down the page.
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

  const handleAction = (action: string) => {
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
      appNav.to("/pos/billing", {
        type: "b2b",
        retailerId: franchiseId,
      });
      return;
    }
    if (action === "statement") {
      appNav.to(`${basePath}/statement`);
    }
  };

  // Group first (how the shop buys), status second — both only show once the
  // record actually carries them.
  const chips: PartyHeroChip[] = [];
  if (franchise.groupName || franchise.type) {
    chips.push({
      key: "group",
      label: franchise.groupName || franchise.type,
      icon: Star,
      tone: "amber",
    });
  }
  if (franchise.status) {
    chips.push({ key: "status", label: franchise.status, tone: "gold" });
  }

  return (
    <>
      <PartyHero
        className={className}
        name={name}
        subtitle={[mobile, franchise.franchiseId].filter(Boolean).join(" · ")}
        avatar={
          franchise.approvedShopImage ? (
            <ImgRender
              assetId={franchise.approvedShopImage}
              className="tw:size-14 tw:shrink-0 tw:rounded-full tw:object-cover tw:ring-2 tw:ring-white/30 tw:lg:ring-primary/20"
            />
          ) : undefined
        }
        chips={chips}
        stats={[
          {
            key: "paylater",
            label: "Paylater",
            value: CommonService.formatCompact(wallet.available, {
              style: "short",
            }),
            highlight: true,
          },
          {
            key: "dues",
            label: "Dues",
            value: CommonService.formatCompact(wallet.dues, {
              style: "short",
            }),
          },
          {
            key: "business",
            label: "Business",
            value: CommonService.formatCompact(
              franchise.ltv || franchise.totalBusiness || 0,
              { style: "short" },
            ),
          },
        ]}
        actions={ACTIONS}
        onAction={handleAction}
      />

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

export default RetailerHero;
