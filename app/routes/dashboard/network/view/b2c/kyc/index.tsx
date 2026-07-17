import { useParams } from "react-router";
import NoData from "~/components/core/no-data/NoData";
import NetworkKyc from "~/shared/accounts/paylater/network-kyc/NetworkKyc";

export default function B2CKyc() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <NoData />;
  }
  return <NetworkKyc userId={id} />;
}
