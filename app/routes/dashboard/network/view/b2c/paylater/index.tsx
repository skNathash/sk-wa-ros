import { useParams } from "react-router";
import NoData from "~/components/core/no-data/NoData";
import PaylaterNetworkStatement from "~/shared/accounts/paylater/network-statement/PaylaterNetworkStatement";

export default function PaylaterTabContent() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <NoData />;
  }
  return <PaylaterNetworkStatement userId={id} type="b2c" />;
}
