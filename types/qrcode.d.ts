declare module "qrcode" {
  export interface QRCodeRenderersOptions {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  }
  export function toDataURL(
    text: string,
    opts?: QRCodeRenderersOptions
  ): Promise<string>;
}
