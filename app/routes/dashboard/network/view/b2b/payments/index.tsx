import { useParams } from "react-router";
import PayablesReceivablesList from "~/shared/accounts/components/payables-receivables/PayablesReceivablesList";

const Payments = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <PayablesReceivablesList
      entityId={id || ""}
      entityType="franchise"
      paymentType="receivePayment"
    />
  );
};

export default Payments;
