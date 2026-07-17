import type { PaylaterNotificationTemplate } from "~/types/PayalterTypes";

class PaylaterNotificationTemplateService {
  static getDueTemplates(
    options: PaylaterNotificationTemplate,
    language: string = "en",
    delimiter: string = "%0a%0a"
  ) {
    let lng = language;
    const delim = delimiter;

    let templates: Record<string, { templates: { msg: string }[] }> = {
      en: {
        templates: [
          {
            msg: `Hi ${options.customerName}${delim}This is a reminder from ${options.franchiseName}. Your PayLater payment of ₹${options.amount} is still pending.${delim}Please clear it at the earliest to avoid any delay.${delim}Thank you!`,
          },
          {
            msg: `Dear ${options.customerName}${delim}Today is the last day for your PayLater payment of ₹${options.amount}.${delim}Kindly complete the payment today to keep your account active.${delim}Regards,${delim}${options.franchiseName}`,
          },
          {
            msg: `Hello ${options.customerName}${delim}Your PayLater due date ${options.dueDate} is approaching soon.${delim}Outstanding amount: ₹${options.amount}.${delim}Please make the payment on or before the due date to avoid penalties`,
          },
        ],
      },
      kn: {
        templates: [
          {
            msg: `ನಮಸ್ಕಾರ ${options.customerName}${delim}${options.franchiseName} ವತಿಯಿಂದ ಒಂದು ಸ್ಮರಣಿಕೆ. ನಿಮ್ಮ PayLater ಪಾವತಿ ₹${options.amount} ಇನ್ನೂ ಬಾಕಿ ಇದೆ.${delim}ದಯವಿಟ್ಟು ಸಾಧ್ಯವಾದಷ್ಟು ಬೇಗ ಪಾವತಿಸಿ.${delim}ಧನ್ಯವಾದಗಳು!`,
          },
          {
            msg: `ಪ್ರಿಯ ${options.customerName}${delim},ಇಂದು ನಿಮ್ಮ PayLater ಪಾವತಿ ₹${options.amount} ಪಾವತಿಸಲು ಕೊನೆಯ ದಿನ.${delim}ದಯವಿಟ್ಟು ಇಂದು ಪಾವತಿಸಿ ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಸಕ್ರಿಯವಾಗಿಡಿ.${delim}ಧನ್ಯವಾದಗಳು,${delim}${options.franchiseName}`,
          },
          {
            msg: `ನಮಸ್ಕಾರ ${options.customerName}${delim},ನಿಮ್ಮ PayLater ಪಾವತಿ ಕೊನೆಯ ದಿನಾಂಕ ${options.dueDate} ಹತ್ತಿರ ಬರುತ್ತಿದೆ.ಬಾಕಿ ಮೊತ್ತ: ₹${options.amount}.${delim}ದಯವಿಟ್ಟು ಕೊನೆಯ ದಿನಾಂಕದೊಳಗೆ ಪಾವತಿಸಿ.${delim}– ${options.franchiseName}`,
          },
        ],
      },
    };

    return templates[lng]?.templates || [];
  }
}

export default PaylaterNotificationTemplateService;
