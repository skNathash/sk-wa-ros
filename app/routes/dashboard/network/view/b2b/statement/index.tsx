import { useParams } from "react-router";
import PageAccessService from "~/services/PageAccessService";
import NetworkStatement from "~/shared/accounts/components/network-statement/NetworkStatement";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["NETWORK.VIEW-B2B-STATEMENT"]);
}

const B2BStatement = () => {
  const { id } = useParams();

  return (
    <>
      <NetworkStatement id={id || ""} title="B2B Statement" />
    </>
  );
};

export default B2BStatement;
