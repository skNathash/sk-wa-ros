import React, { useEffect, useState } from "react";

type Props = {
  vpa: string;
};

const UpiQrCode: React.FC<Props> = ({ vpa }) => {
  const [qrSrc, setQrSrc] = useState<string>("");
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    setQrError(null);
    setQrSrc("");
    const text = (vpa || "").trim();
    if (!text) {
      setQrError("No UPI ID");
      return;
    }
    // Build UPI payment URI per requirement: upi://pay?pa={vpa}
    // URL-encode the VPA to be safe for inclusion in the query string
    const payload = `upi://pay?pa=${encodeURIComponent(text)}`;
    (async () => {
      try {
        const mod: any = await import("qrcode");
        const url: string = await mod.toDataURL(payload, {
          margin: 2,
          errorCorrectionLevel: "M",
          width: 256,
        });
        setQrSrc(url);
      } catch (e) {
        setQrError("Failed to render QR");
      }
    })();
  }, [vpa]);

  if (qrError) {
    return <div className="tw:text-red-500 tw:text-center">{qrError}</div>;
  }

  return (
    <div className="tw:text-center">
      <h4 className="tw:text-md tw:font-semibold tw:text-gray-800 tw:mb-4">
        Scan QR Code
      </h4>
      <div className="tw:flex tw:flex-col tw:items-center tw:gap-4">
        <img
          src={qrSrc}
          alt="UPI QR Code"
          className="tw:w-48 tw:h-48 tw:rounded-lg tw:shadow-md"
        />
        <div className="tw:text-sm tw:text-gray-600">
          Scan this QR code with any UPI app to pay
        </div>
      </div>
    </div>
  );
};

export default UpiQrCode;
