import { API } from "~/constants";
import AjaxService from "./AjaxService";

class WhatsappTemplateService {
  static getList(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}notification/whatsapp-templates`,
      "GET",
      params,
    );
  }

  // Render a template body by replacing placeholders like {{name}} with values from data.
  // Supports nested keys with dot notation, e.g. {{user.name}} and array indexes like {{items.0.title}}.
  static renderTemplate(body: string, data: Record<string, any> = {}): string {
    if (!body || typeof body !== "string") return "";

    // Helper to resolve nested paths safely
    const resolvePath = (obj: any, path: string) => {
      if (!path) return undefined;
      const parts = path.split(".");
      let cur = obj;
      for (const p of parts) {
        if (cur == null) return undefined;
        // if numeric index, treat as number for arrays
        const index = p.match(/^\d+$/) ? Number(p) : p;
        cur = cur[index];
      }
      return cur;
    };

    // Replace all occurrences of {{ key }} with their corresponding values
    return body.replace(/{{\s*([^}\s]+(?:\.[^}\s]+)*)\s*}}/g, (match, key) => {
      const val = resolvePath(data, key);
      if (val === undefined || val === null) return match; // leave placeholder if missing
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    });
  }

  // Send a template by generating a whatsapp link for a given template id.
  // The API expects POST to notification/whatsapp-templates/{templateId}/generate-link
  // with dynamic data in the request body.
  static send(
    templateId: string | number,
    dynamicData: Record<string, any> = {},
  ) {
    const url = `${API}notification/whatsapp-templates/${templateId}/generate-link`;
    return AjaxService.request(url, "POST", dynamicData);
  }

  // Format a single template object by adding isAssetFeatureImage key.
  // isAssetFeatureImage is true if featureImage starts with a number, false if starts with http or https.
  static formatTemplate(template: Record<string, any>): Record<string, any> {
    const featureImage = template.featureImage || "";
    const startsWithNumber = /^\d/.test(featureImage);
    template.isAssetFeatureImage = startsWithNumber;
    return template;
  }
}

export default WhatsappTemplateService;
