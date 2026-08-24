import { useEffect, useState } from "react";
import { useParams } from "react-router";
import FranchiseService from "~/services/FranchiseService";
import PageAccessService from "~/services/PageAccessService";
import NetworkStatement from "~/shared/accounts/components/network-statement/NetworkStatement";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["NETWORK.VIEW-B2B-STATEMENT"]);
}

const B2BStatement = () => {
  const { id } = useParams();
  const [party, setParty] = useState<{ name?: string; phone?: string }>({});

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const loadParty = async () => {
      try {
        const resp = await FranchiseService.getFranchise(id);
        if (cancelled) return;
        const data = resp?.data?.data;
        setParty({
          name: data?.name || data?.storeName || "",
          phone: data?.mobile || "",
        });
      } catch {
        if (!cancelled) setParty({});
      }
    };

    loadParty();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <NetworkStatement
      id={id || ""}
      title="B2B Statement"
      partyName={party.name}
      partyPhone={party.phone}
    />
  );
};

export default B2BStatement;
