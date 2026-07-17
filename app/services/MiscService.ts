class MiscService {
  static isJwtExpired(token: string): boolean {
    try {
      const payload = this.decodeJwt(token);
      if (!payload || typeof payload !== "object" || !payload.exp) return true;
      // exp is in seconds since epoch
      const now = Math.floor(Date.now() / 1000);
      return now >= payload.exp;
    } catch (e) {
      return true;
    }
  }
  static isMobile() {
    return window.innerWidth < 768;
  }

  static decodeJwt(token: any) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return {};
    }
  }

  static disableSideMenu() {
    // menuController.enable(false);
  }

  static enableSideMenu() {
    // menuController.enable(true);
  }

  static isDesktopView() {
    return window.innerWidth > 1024;
  }

  static createEvent(event: string, data: any) {
    const eventObj = new CustomEvent(event, { detail: data });
    document.dispatchEvent(eventObj as Event);
  }

  static listenEvent(event: string, handler: (e: any) => void) {
    document.addEventListener(event, handler as EventListener);
  }

  static removeEventListener(event: string, handler: (e: any) => void) {
    document.removeEventListener(event, handler as EventListener);
  }

  static removeEvent(event: string, callback: (e: CustomEvent) => void) {
    document.removeEventListener(event, callback as EventListener);
  }

  static hasCordova() {
    return window && window.parent && window.parent.cordova ? true : false;
  }

  static getCordova() {
    if (window && window.parent && window.parent.cordova) {
      return window.parent.cordova;
    }
    return null;
  }

  static getSelectedLang() {
    return localStorage.getItem("i18nextLng") || "en";
  }

  /**
   * Scanner detection helper
   * Creates a detector that identifies if input is from a barcode scanner
   * based on rapid keystroke timing (< 50ms between keys)
   *
   * @returns Object with methods to track and detect scanner input
   */
  static createScannerDetector() {
    let lastKeyTime = 0;
    let keystrokeCount = 0;
    const SCANNER_THRESHOLD_MS = 50; // Time between keystrokes for scanner
    const MIN_KEYSTROKES = 3; // Minimum rapid keystrokes to consider as scanner

    return {
      /**
       * Call this on each keystroke to track timing
       * @returns true if this appears to be scanner input
       */
      trackKeystroke(): boolean {
        const currentTime = Date.now();
        const timeDiff = currentTime - lastKeyTime;

        if (timeDiff < SCANNER_THRESHOLD_MS && lastKeyTime > 0) {
          keystrokeCount++;
        } else {
          keystrokeCount = 1;
        }

        lastKeyTime = currentTime;
        return keystrokeCount >= MIN_KEYSTROKES;
      },

      /**
       * Reset the detector state
       */
      reset(): void {
        lastKeyTime = 0;
        keystrokeCount = 0;
      },

      /**
       * Check if current state indicates scanner input
       */
      isScanning(): boolean {
        return keystrokeCount >= MIN_KEYSTROKES;
      },
    };
  }
}

export default MiscService;
