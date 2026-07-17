import { CheckCircle2Icon, ShieldCheck } from "lucide-react";
import React, { useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppModal from "~/components/core/modal/AppModal";
import AuthService from "~/services/AuthService";
import DeclarationSignedBlock from "./DeclarationSignedBlock";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  mobile?: boolean;
  title?: string;
  acceptedAt?: Date;
};

const DeclarationAgreementModal: React.FC<Props> = ({
  show,
  callback,
  title = "Declaration Agreement",
  acceptedAt,
}) => {
  const [user, setUser] = useState<any>();

  useEffect(() => {
    if (show) {
      const user = AuthService.getLoggedInUser();
      let address = ["addressLine1", "addressLine2"]
        .map((field) => user?.[field])
        .filter(Boolean)
        .join(", ");
      setUser({ ...user, displayAddress: address });
    }
  }, [show]);

  const onClose = () => {
    callback({ action: "close" });
  };

  const handleModalCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action === "close") {
      onClose();
    } else {
      // forward other actions to parent
      callback({ action, data });
    }
  };

  return (
    <AppModal
      show={show}
      callback={handleModalCallback}
      className="tw:md:!max-w-3xl tw:h-[90vh]"
    >
      <AppModal.Title onClose={onClose}>
        <h2 className="tw:text-lg tw:font-semibold tw:text-gray-900">
          {title}
        </h2>
      </AppModal.Title>

      <AppModal.Content className="tw:md:text-sm tw:text-xs tw:max-h-[90vh] tw:font-serif tw:leading-relaxed">
        <div className="tw:mb-6">
          This declaration is made on this day of{" "}
          <span className="tw:underline tw:font-semibold">
            <DateFormat
              value={acceptedAt || new Date()}
              formatStr="dd MMM yyyy"
            />
          </span>
        </div>

        <div className="tw:mb-4 tw:font-semibold tw:text-sm">BY</div>

        <div className="tw:mb-4">
          <span className="tw:border-b tw:border-black tw:font-semibold">
            {user?.name}
          </span>
          , a company/partnership firm/sole proprietorship, having its place of
          business at{" "}
          <span className="tw:border-b tw:border-black tw:font-semibold">
            {user?.displayAddress}{" "}
          </span>
          (the <span className="tw:font-semibold">“Shop Premises”</span>),
          hereinafter referred to as the “Super Franchise” (which expression
          shall unless the context otherwise requires, include their/its
          partners, successors and permitted assigns), represented herein by its
          director/partner/ proprietor{" "}
          <span className="tw:border-b tw:border-black tw:font-semibold">
            {user?.ownerDetails?.name || "--"}
          </span>{" "}
          of the ONE PART;
        </div>

        <div className="tw:font-semibold tw:my-4 tw:uppercase">
          IN FAVOUR OF
        </div>

        <div className="tw:mb-4">
          <span className="tw:font-semibold">
            LocalCube Commerce Private Limited,
          </span>{" "}
          a company incorporated under Companies Act, 1956 and having its
          corporate office at Plot 14 - F1, KIADB Layout, Behind Deccan Herald,
          Kumbalgodu 2nd Stage, Mysore Road, Bangalore – 560074 (hereinafter
          referred to as “Storeking" which expression shall unless repugnant to
          the context or meaning thereof mean and include its successors and
          permitted assigns) of the OTHER PART;
        </div>

        <div className="tw:mb-4">
          <span className="tw:font-semibold">WHEREAS</span> the Super Franchisee
          has entered into a Super Franchisee Agreement dated{" "}
          <span className="tw:border-b tw:border-black tw:font-semibold">
            <DateFormat value={user?.createdAt} formatStr="dd MMM yyyy" />
          </span>{" "}
          with Storeking (the{" "}
          <span className="tw:font-semibold">“Super Franchise Agreement”</span>
          ), whereunder the Super Franchisee has agreed to undertake certain
          activities at its Shop Premises, using the Storeking platform/
          application.
        </div>

        <div className="tw:mb-4 tw:font-semibold tw:uppercase">
          IN CONSIDERATION OF THE MUTUAL COVENANTS AND PROMISES MADE UNDER THE
          SUPER FRANCHISE AGREEMENT, THE SUPER FRANCHISEE DECLARES AS FOLLOWS:
        </div>

        <div className="tw:mb-4">
          The Super Franchisee hereby declares that it is in occupation of the
          Shop Premises and has all requisite rights to occupy the Shop Premises
          and to operate a shop at the said premises. The Super Franchisee also
          declares that it has obtained all requisite licenses, permissions,
          registrations and authorizations from the concerned authorities in
          order to operate a store at the Shop Premises.
        </div>

        <div className="tw:mb-4">
          The Super Franchisee agrees to indemnify and hold harmless Storeking
          and its directors, agents, shareholders etc., against any claim, loss
          or liability whatsoever arising on the aforementioned persons on
          account of a breach by the Super Franchisee of its
          representations/declarations made hereunder.
        </div>

        <div className="tw:mb-4">
          The declarations made by the Super Franchisee hereunder shall be
          deemed to form part of the representations made by the Super
          Franchisee under the Super Franchise Agreement and any breach of the
          said declarations shall constitute a material breach of the Super
          Franchise Agreement.
        </div>

        <div className="tw:mb-6 tw:font-semibold tw:uppercase">
          IN WITNESS WHEREOF, THE PARTIES HERETO HAVE CAUSED THIS AGREEMENT TO
          BE DULY EXECUTED AND DELIVERED BY THEIR DULY AUTHORISED
          REPRESENTATIVES AS OF THE DAY AND YEAR HEREINABOVE WRITTEN
        </div>

        <div className="tw:mb-6">
          Signed and delivered for and on behalf of the Super Franchisee
        </div>

        {/* Digital Signature Block - Industry Standard Format */}
        <div className="tw:mt-8 tw:mb-8 tw:relative">
          {acceptedAt ? (
            <DeclarationSignedBlock
              name={user?.ownerDetails?.name}
              date={acceptedAt}
            />
          ) : null}
        </div>

        {/* Traditional Signature Lines */}
        {!acceptedAt ? (
          <div className="tw:flex tw:gap-8 tw:items-start">
            <div className="tw:flex-1">
              <div className="tw:text-xs tw:text-gray-700 tw:font-medium">
                Signature
              </div>
              <div className="tw:border-b-2 tw:border-gray-400 tw:w-3/4 tw:h-0 tw:mt-3" />
              <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                {user?.ownerDetails?.name}
              </div>
            </div>

            <div className="tw:w-40">
              <div className="tw:text-xs tw:text-gray-700 tw:font-medium">
                Date
              </div>
              <div className="tw:border-b-2 tw:border-gray-400 tw:w-full tw:h-0 tw:mt-3" />
              <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                <DateFormat value={new Date()} formatStr="dd/MM/yyyy" />
              </div>
            </div>
          </div>
        ) : null}
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2 tw:w-full">
          <AppButton
            onClick={onClose}
            fill="outline"
            size="small"
            color="light"
          >
            Close
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default DeclarationAgreementModal;
