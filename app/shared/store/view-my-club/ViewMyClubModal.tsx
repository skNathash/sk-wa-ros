import { Camera, ExternalLink, Printer } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import AuthService from "~/services/AuthService";
import MiscService from "~/services/MiscService";

type Props = {
  show: boolean;
  onClose: () => void;
  title?: string;
  /**
   * The URL or text to encode in the QR code.
   */
  value: string;
  /**
   * Optional: direct link to open in a new tab; defaults to `value` if it looks like a URL.
   */
  linkUrl?: string;
  callback?: (a: { action: string; data?: any }) => void;
};

const isProbablyUrl = (text: string) => /^(https?:\/\/)/i.test(text);

const ASSET_BASE = "/assets/images";
const LOGO_SRC = "logo/logo.png";
const STORE_SCENE_SRC = "club-qr/store.png";

type Benefit = { img: string; label: string };

const LEFT_BENEFITS: Benefit[] = [
  { img: "club-qr/time.png", label: "Order\nAnytime" },
  { img: "club-qr/women.png", label: "Order While\nRelaxing" },
  { img: "club-qr/boy.png", label: "No More\nHeavy Lifting" },
];
const RIGHT_BENEFITS: Benefit[] = [
  { img: "club-qr/bike.png", label: "Enjoy Home\nDelivery" },
  { img: "club-qr/coin.png", label: "Earn King\nCOINS" },
  { img: "club-qr/gift.png", label: "Redeem King\nCOINS" },
];

const ViewMyClubModal: React.FC<Props> = ({
  show,
  onClose,
  title = "My Club QR",
  value,
  linkUrl,
  callback,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrSrc, setQrSrc] = useState<string>("");
  const [smartCoinQrSrc, setSmartCoinQrSrc] = useState<string>("");
  const loggedInUser = AuthService.getLoggedInUser() || {};
  const storeName = loggedInUser?.name || "My Store";
  const userMobile = loggedInUser?.mobile;
  const smartCoinUrl = userMobile
    ? `https://club.storeking.in/${userMobile}?rd=coin-store/list`
    : "";

  const openUrl = useMemo(() => {
    if (linkUrl) return linkUrl;
    if (isProbablyUrl(value)) return value;
    return undefined;
  }, [value, linkUrl]);

  const mainQrUrl = userMobile ? `https://storeking.in/${userMobile}` : "";

  useEffect(() => {
    setQrError(null);
    setQrSrc("");
    if (!show) return;
    const text = mainQrUrl.trim();
    if (!text) {
      setQrError("No QR content");
      return;
    }
    (async () => {
      try {
        const mod: any = await import("qrcode");
        const url: string = await mod.toDataURL(text, {
          margin: 1,
          errorCorrectionLevel: "M",
          width: 360,
        });
        setQrSrc(url);
      } catch (e) {
        setQrError("Failed to render QR");
      }
    })();
  }, [mainQrUrl, show]);

  useEffect(() => {
    setSmartCoinQrSrc("");
    if (!show || !smartCoinUrl) return;
    (async () => {
      try {
        const mod: any = await import("qrcode");
        const url: string = await mod.toDataURL(smartCoinUrl, {
          margin: 1,
          errorCorrectionLevel: "M",
          width: 240,
        });
        setSmartCoinQrSrc(url);
      } catch {}
    })();
  }, [smartCoinUrl, show]);

  const BenefitItem: React.FC<Benefit & { side: "left" | "right" }> = ({
    img,
    label,
    side,
  }) => (
    <div className="tw:flex tw:flex-col tw:items-center tw:gap-1 tw:text-center">
      <div className="tw:relative">
        <div className="tw:flex tw:items-center tw:justify-center tw:w-14 tw:h-14 tw:rounded-full tw:bg-[#dff3f1] tw:shrink-0 tw:shadow-sm tw:overflow-hidden">
          <ImgRender
            src={img}
            alt=""
            className="tw:w-10 tw:h-10 tw:object-contain"
          />
        </div>
        <div
          className={`tw:absolute tw:top-1/2 tw:w-4 tw:border-t-2 tw:border-dashed tw:border-[#00337c]/35 ${
            side === "left" ? "tw:left-full tw:ml-1" : "tw:right-full tw:mr-1"
          }`}
        />
      </div>
      <div className="tw:text-[#00337c] tw:text-[10px] tw:font-bold tw:leading-tight tw:whitespace-pre-line">
        {label}
      </div>
    </div>
  );

  const handlePrint = () => {
    try {
      if (!qrSrc || !printRef.current) return;
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      const styles = Array.from(document.styleSheets)
        .map((sheet) => {
          try {
            return Array.from(sheet.cssRules)
              .map((r) => r.cssText)
              .join("\n");
          } catch {
            if (sheet.href)
              return `@import url("${sheet.href}");`;
            return "";
          }
        })
        .join("\n");

      const content = printRef.current.outerHTML;

      const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <base href="${origin}/"/>
    <title>${title || "Club QR"}</title>
    <style>${styles}</style>
    <style>
      *{-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}
      html,body{margin:0;padding:0;background:#fff}
      .print-sheet{
        width:210mm;min-height:297mm;margin:0 auto;padding:14mm 12mm;
        background:linear-gradient(180deg,#ffffff 0%,#f4fbfa 55%,#e6f3f0 100%);
        box-sizing:border-box;
      }
      .print-sheet > div{transform-origin:top center}
      .print-sheet .club-qr-col{width:90mm !important;max-width:none !important;margin-top:0 !important}
      .print-sheet .club-qr-card{width:90mm !important;max-width:none !important}
      .print-sheet .club-qr-card img{width:100% !important;height:auto !important}
      .print-sheet .club-qr-card span{font-size:20px !important}
      /* Enlarge fonts for print only (screen classes stay untouched) */
      .print-sheet .tw\\:text-\\[10px\\]{font-size:15px !important}
      .print-sheet .tw\\:text-\\[11px\\]{font-size:16px !important}
      .print-sheet .tw\\:text-\\[14px\\]{font-size:20px !important}
      .print-sheet .tw\\:text-\\[18px\\]{font-size:26px !important}
      .print-sheet .tw\\:text-\\[22px\\]{font-size:32px !important}
      .print-sheet .tw\\:text-\\[26px\\]{font-size:38px !important}
      @media print{
        @page{size:A4 portrait;margin:0}
        .print-sheet{width:210mm;min-height:297mm;padding:14mm 12mm}
        .print-sheet .club-qr-col{width:90mm !important}
        .print-sheet .club-qr-card{width:90mm !important}
      }
    </style>
  </head>
  <body><div class="print-sheet">${content}</div>
    <script>window.onload=()=>{setTimeout(()=>{window.print();window.close();},600)};</script>
  </body>
</html>`;
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch {}
  };

  const handleShareWhatsApp = () => {
    const payload = {
      action: "whatsapp",
      data: {
        value,
        linkUrl: openUrl,
        storeLink: openUrl,
        franchiseName: AuthService.getLoggedInUser()?.name,
      },
    };
    if (typeof callback === "function") {
      try {
        callback(payload as any);
      } catch (e) {
        console.error("ViewMyClubModal.callback error", e);
      }
      return;
    }

    const text = encodeURIComponent(value);
    const url = `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  const handleOpenInBrowser = () => {
    if (!openUrl) return;
    window.open(openUrl, "_blank");
  };

  return (
    <AppModal
      show={show}
      callback={() => onClose()}
      noPadding
      overFlowHidden
      className="tw:h-[90vh]"
    >
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-start tw:justify-between tw:w-full">
          <div>
            <div className="tw:text-[#00337c] tw:text-lg tw:font-bold">
              CLUB - your online Store
            </div>
            <div className="tw:text-[#00337c] tw:text-xs tw:font-medium tw:mt-1">
              {t("scanOrShareYourClubQR")}
            </div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content noPadding className="tw:h-[90vh]">
        <div className="tw:relative tw:w-full tw:overflow-hidden tw:bg-gradient-to-b tw:from-white tw:via-[#f4fbfa] tw:to-[#e6f3f0]">
          <div
            ref={printRef}
            className="tw:px-5 tw:pt-1 tw:pb-5 tw:bg-gradient-to-b tw:from-white tw:via-[#f4fbfa] tw:to-[#e6f3f0]"
          >
            <div className="tw:flex tw:justify-center tw:mb-2">
              <ImgRender
                src={LOGO_SRC}
                alt="StoreKing"
                className="tw:h-9 tw:object-contain"
              />
            </div>

            <div className="tw:text-center tw:mb-4">
              <div className="tw:text-[#00337c] tw:text-[22px] tw:font-extrabold tw:leading-tight tw:tracking-tight">
                {storeName}
              </div>
              <div className="tw:text-[#f26c21] tw:text-[26px] tw:font-semibold tw:tracking-tight tw:leading-[1] tw:mt-2">
                WE&rsquo;RE ONLINE!
              </div>
            </div>

            <div className="tw:flex tw:items-center tw:justify-center tw:gap-4">
              <div className="tw:flex tw:flex-col tw:justify-between tw:gap-5 tw:py-1">
                {LEFT_BENEFITS.map((b, i) => (
                  <BenefitItem key={i} {...b} side="left" />
                ))}
              </div>

              <div className="club-qr-col tw:flex tw:flex-col tw:items-center tw:w-40 tw:md:w-52 tw:shrink-0 tw:mt-1 tw:self-start">
              <div
                ref={containerRef}
                className="club-qr-card tw:relative tw:bg-white tw:rounded-2xl tw:shadow-lg tw:border tw:border-gray-200 tw:flex tw:flex-col tw:overflow-hidden tw:w-full"
              >
                <div className="tw:flex tw:items-center tw:justify-center tw:px-3 tw:pt-3 tw:pb-0">
                  {qrSrc ? (
                    <img
                      src={qrSrc}
                      alt="Club QR Code"
                      className="tw:w-full tw:h-auto tw:object-contain"
                    />
                  ) : (
                    <div className="tw:text-[10px] tw:text-gray-500 tw:px-2 tw:text-center tw:py-16">
                      {qrError || "Generating QR..."}
                    </div>
                  )}
                </div>
                <div className="tw:px-3 tw:pb-3 tw:pt-0 -tw:mt-1 tw:flex tw:items-center tw:justify-center tw:gap-2">
                  <Camera size={28} color="#00337c" strokeWidth={2.5} />
                  <span className="tw:text-[#00337c] tw:text-[14px] tw:font-black tw:tracking-wider tw:text-center">
                    SCAN &amp; ORDER NOW
                  </span>
                </div>
              </div>
                {mainQrUrl && (
                  <div className="tw:mt-2 tw:text-center tw:text-[10px] tw:text-gray-500 tw:break-all tw:px-1 tw:w-full">
                    {mainQrUrl}
                  </div>
                )}
              </div>

              <div className="tw:flex tw:flex-col tw:justify-between tw:gap-5 tw:py-1">
                {RIGHT_BENEFITS.map((b, i) => (
                  <BenefitItem key={i} {...b} side="right" />
                ))}
              </div>
            </div>


            <div className="tw:mt-3 tw:rounded-xl tw:px-3 tw:py-3 tw:flex tw:items-center tw:justify-center tw:gap-3">
              <ImgRender
                src={STORE_SCENE_SRC}
                alt=""
                className="tw:w-64 tw:h-48 tw:object-contain tw:shrink-0"
              />
              <div className="tw:text-left">
                <div className="tw:text-[#00337c] tw:text-[18px] tw:font-black tw:tracking-wide tw:leading-none">
                  STORE TO DOOR
                </div>
                <div className="tw:text-[#00337c] tw:text-[11px] tw:opacity-75 tw:font-semibold tw:mt-1">
                  Your Store On Your Phone
                </div>
              </div>
            </div>

            {smartCoinUrl && (
              <div className="tw:mt-3 tw:rounded-xl tw:bg-gradient-to-r tw:from-[#fff7e6] tw:to-[#ffeccb] tw:px-5 tw:py-4 tw:flex tw:items-center tw:justify-between tw:gap-4">
                <div className="tw:flex tw:items-center tw:gap-4">
                  <ImgRender
                    src="kingcoins/logo.png"
                    alt=""
                    className="tw:w-20 tw:h-20 tw:object-contain tw:shrink-0"
                  />
                  <div className="tw:text-left">
                    <div className="tw:text-[#00337c] tw:text-[18px] tw:font-black tw:tracking-wide tw:leading-none">
                      SMARTCOINS STORE
                    </div>
                    <div className="tw:text-[#00337c] tw:text-[11px] tw:opacity-75 tw:font-semibold tw:mt-1">
                      Spend your King COINS
                    </div>
                  </div>
                </div>
                <div className="tw:flex tw:flex-col tw:items-center tw:gap-1.5">
                  <div className="tw:bg-white tw:rounded-lg tw:shadow-sm tw:p-2">
                    {smartCoinQrSrc ? (
                      <img
                        src={smartCoinQrSrc}
                        alt="SmartCoins QR"
                        className="tw:w-24 tw:h-24 tw:object-contain"
                      />
                    ) : (
                      <div className="tw:w-24 tw:h-24 tw:flex tw:items-center tw:justify-center tw:text-[10px] tw:text-gray-500 tw:text-center tw:px-1">
                        Generating QR...
                      </div>
                    )}
                  </div>
                  <div className="tw:text-[#00337c] tw:text-[10px] tw:font-bold tw:tracking-wider tw:opacity-70">
                    SCAN ME
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-center tw:gap-2 tw:w-full">
          {!MiscService.hasCordova() && (
            <button
              onClick={handlePrint}
              disabled={!qrSrc}
              className="tw:flex tw:items-center tw:gap-2 tw:bg-[#00337c] tw:text-white tw:px-4 tw:py-2 tw:rounded-lg tw:text-xs tw:font-semibold tw:shadow active:tw:scale-95 tw:transition disabled:tw:opacity-50"
            >
              <Printer size={16} />
              <span className="tw:hidden tw:md:inline">Print Poster</span>
            </button>
          )}
          {openUrl && (
            <button
              onClick={handleOpenInBrowser}
              className="tw:flex tw:items-center tw:gap-2 tw:bg-white tw:border tw:border-[#00337c] tw:text-[#00337c] tw:px-4 tw:py-2 tw:rounded-lg tw:text-xs tw:font-semibold active:tw:scale-95 tw:transition"
            >
              <ExternalLink size={16} />
              <span className="tw:hidden tw:md:inline">View Store</span>
            </button>
          )}
          <button
            onClick={handleShareWhatsApp}
            className="tw:flex tw:items-center tw:gap-2 tw:bg-white tw:border tw:border-[#25D366] tw:text-[#25D366] tw:px-4 tw:py-2 tw:rounded-lg tw:text-xs tw:font-semibold active:tw:scale-95 tw:transition"
          >
            <ImgRender
              src="whatsapp-logo.png"
              alt="WhatsApp"
              className="tw:w-4 tw:h-4 tw:object-contain"
            />
            <span className="tw:hidden tw:md:inline">Share WhatsApp</span>
          </button>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ViewMyClubModal;
