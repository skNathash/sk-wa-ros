import { Gift, MessageCircle, Plus, Send, Star } from "lucide-react";
import { useEffect, useState } from "react";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import PaylaterService from "~/services/PaylaterService";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import PartyHero, {
  type PartyHeroAction,
  type PartyHeroChip,
} from "~/shared/network/components/party-hero/PartyHero";
import type { Customer } from "../Overview";

interface CustomerHeroProps {
  customer: Customer;
  className?: string;
}

/** What a seller does to a customer straight off the hero. */
const ACTIONS: PartyHeroAction[] = [
  { key: "ping", label: "Ping", icon: MessageCircle, tone: "primary" },
  { key: "coin-store", label: "Store", icon: Gift, tone: "amber" },
  { key: "offer", label: "Offer", icon: Send, tone: "violet" },
  { key: "new-bill", label: "Bill", icon: Plus, tone: "slate" },
];

/**
 * Identity hero for the B2C customer page — who the customer is, the three
 * numbers that decide what happens next (coins, credit left, lifetime value)
 * and the four actions the seller takes on them. Owns its own wallet read, so
 * the page only says which customer it is.
 */
const CustomerHero = ({ customer, className }: CustomerHeroProps) => {
  const appNav = useAppNav();

  const [whatsappModal, setWhatsappModal] = useState<{
    show: boolean;
    data?: any;
    users?: { name?: string; mobile?: string }[];
    ignoreCategories?: string[];
  }>({ show: false });

  // Credit left on the paylater wallet — the hero's own read, so the strip
  // shows the same number as the ladder further down the page.
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

  const record = customer as Record<string, any>;
  const basePath = `/dashboard/network/view/b2c/${customer._id}`;

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
    if (action === "coin-store") {
      appNav.to(`${basePath}/loyalty-program`);
      return;
    }
    if (action === "new-bill") {
      appNav.to("/pos/billing", {
        type: "b2c",
        customerId: customer._id,
      });
    }
  };

  // Segment first (how they buy), membership second (what they've earned) —
  // both only show once the record actually carries them.
  const chips: PartyHeroChip[] = [];
  if (record.tag) {
    chips.push({
      key: "tag",
      label: record.tag,
      icon: Star,
      tone: "amber",
    });
  }
  if (customer.status) {
    chips.push({ key: "status", label: customer.status, tone: "gold" });
  }

  return (
    <>
      <PartyHero
        className={className}
        name={customer.name}
        subtitle={customer.mobile}
        chips={chips}
        stats={[
          { key: "coins", label: "Coins", value: customer.points ?? 0 },
          {
            key: "paylater",
            label: "Paylater",
            value: CommonService.formatCompact(paylaterAvailable, {
              style: "short",
            }),
            highlight: true,
          },
          {
            key: "ltv",
            label: "LTV",
            value: CommonService.formatCompact(record.ltv || 0, {
              style: "short",
            }),
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
        templateFor={["B2C"]}
        ignoreCategories={whatsappModal.ignoreCategories}
        callback={() => setWhatsappModal({ show: false })}
      />
    </>
  );
};

export default CustomerHero;
