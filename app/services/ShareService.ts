declare const window: any;

class ShareService {
  static async share(options: {
    msg?: string;
    imageId?: string;
    imgPath?: string;
    hashUrl?: string;
    absoluteUrl?: string;
    title?: string;
    redirectUrl?: string;
    type?: string;
    v2?: boolean;
    slug?: string;
    phone?: string | undefined;
  }) {
    this.shareInWeb({
      msg: options.msg,
      phone: options.phone,
    });
  }

  static prepareUrl(
    options: { absoluteUrl?: string; hashUrl?: string },
    encode = true,
  ) {
    let url = "";
    let u = "";
    if (options.absoluteUrl) {
      url = options.absoluteUrl;
      u = encode ? encodeURIComponent(url) : url;
      return u;
    } else if (options.hashUrl) {
      url = options.hashUrl;
      u = encode ? encodeURIComponent(url) : url;
      return u;
    } else {
      return "";
    }
  }

  static shareInWeb(options: {
    msg?: string;
    hashUrl?: string;
    absoluteUrl?: string;
    phone?: string | undefined;
  }) {
    let m = options.msg || "";
    const u = this.prepareUrl({
      absoluteUrl: options.absoluteUrl,
      hashUrl: options.hashUrl,
    });
    if (u) {
      // Comma-separate the message from the appended link (previous behavior),
      // but only when there is actually a link to append.
      m += (m ? "," : "") + u;
    }

    let shareUrl = "https://api.whatsapp.com/send";
    // If a specific phone number is provided, use phone param
    if (options.phone) {
      // Remove any non-digit characters
      const digits = String(options.phone).replace(/\D+/g, "");
      shareUrl +=
        "?phone=" +
        encodeURIComponent("+91" + digits) +
        "&text=" +
        encodeURIComponent(m);
    } else {
      shareUrl += "?text=" + encodeURIComponent(m);
    }

    window.open(shareUrl, "_system");
  }
}

export default ShareService;
