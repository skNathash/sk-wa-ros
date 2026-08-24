import type { LucideIcon } from "lucide-react";
import { ExternalLink, Facebook, Instagram, Youtube } from "lucide-react";

export interface BrandingFormValues {
  storeLogo: string;
  storeCaption: string;
  youtubeLink: string;
  instagramLink: string;
  facebookLink: string;
  googleLink: string;
}

export const MAX_CAPTION_LENGTH = 200;

/** Upload constraints the logo picker uses. */
export const LOGO_UPLOAD_PROPS = {
  allowedExtensions: ["jpg", "jpeg", "png", "webp"],
  accept: "image/*,.webp",
  maxSizeMB: 10,
};

export const EMPTY_BRANDING_FORM: BrandingFormValues = {
  storeLogo: "",
  storeCaption: "",
  youtubeLink: "",
  instagramLink: "",
  facebookLink: "",
  googleLink: "",
};

interface SocialFieldDef {
  /** Form field this row writes to. */
  name: keyof BrandingFormValues;
  /** Key inside the franchise `socialMediaLinks` object. */
  apiKey: "youtube" | "instagram" | "facebook" | "google";
  label: string;
  placeholder: string;
  icon: LucideIcon;
  iconClass: string;
  /** Hosts the url must belong to; empty means any valid url. */
  hosts: string[];
  errorMsg: string;
}

export const SOCIAL_FIELDS: SocialFieldDef[] = [
  {
    name: "youtubeLink",
    apiKey: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@yourstore",
    icon: Youtube,
    iconClass: "tw:text-red-600",
    hosts: ["youtube.com", "www.youtube.com", "youtu.be"],
    errorMsg: "Please provide a valid YouTube URL",
  },
  {
    name: "instagramLink",
    apiKey: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/yourstore",
    icon: Instagram,
    iconClass: "tw:text-pink-600",
    hosts: ["instagram.com", "www.instagram.com"],
    errorMsg: "Please provide a valid Instagram URL",
  },
  {
    name: "facebookLink",
    apiKey: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/yourstore",
    icon: Facebook,
    iconClass: "tw:text-blue-600",
    hosts: ["facebook.com", "www.facebook.com", "fb.com"],
    errorMsg: "Please provide a valid Facebook URL",
  },
  {
    name: "googleLink",
    apiKey: "google",
    label: "Google",
    placeholder: "https://google.com/maps/place/yourstore",
    icon: ExternalLink,
    iconClass: "tw:text-amber-600",
    hosts: [
      "google.com",
      "www.google.com",
      "maps.google.com",
      "google.co.in",
      "www.google.co.in",
      "goo.gl",
      "maps.app.goo.gl",
    ],
    errorMsg: "Please provide a valid Google URL",
  },
];

/** Reads the saved profile into the values the form opens with. */
export const buildBrandingForm = (profile: any): BrandingFormValues => {
  const social = profile?.socialMediaLinks || {};
  return {
    storeLogo: profile?.storeLogo || "",
    storeCaption: profile?.storeCaption || "",
    youtubeLink: social.youtube || "",
    instagramLink: social.instagram || "",
    facebookLink: social.facebook || "",
    googleLink: social.google || "",
  };
};

/** The payload `FranchiseService.updateFranchise` expects for branding. */
export const buildBrandingPayload = (values: BrandingFormValues) => ({
  storeLogo: values.storeLogo || null,
  storeCaption: values.storeCaption?.trim() || null,
  socialMediaLinks: SOCIAL_FIELDS.reduce<Record<string, string | null>>(
    (acc, field) => {
      acc[field.apiKey] = (values[field.name] as string)?.trim() || null;
      return acc;
    },
    {},
  ),
});

const hostMatches = (url: string, hosts: string[]) => {
  try {
    const { hostname } = new URL(url);
    return hosts.includes(hostname.toLowerCase());
  } catch {
    return false;
  }
};

/**
 * Validates every filled social url against the hosts its platform allows.
 * Returns the first failure so the page can surface one clear message.
 */
export const validateSocialLinks = (
  values: BrandingFormValues,
): { name: keyof BrandingFormValues; msg: string } | null => {
  for (const field of SOCIAL_FIELDS) {
    const url = (values[field.name] as string)?.trim();
    if (url && !hostMatches(url, field.hosts)) {
      return { name: field.name, msg: field.errorMsg };
    }
  }
  return null;
};

/** Links to render in the live preview — only the ones actually filled in. */
export const buildPreviewLinks = (values: BrandingFormValues) =>
  SOCIAL_FIELDS.map((field) => ({
    key: field.apiKey,
    label: field.label,
    icon: field.icon,
    iconClass: field.iconClass,
    url: (values[field.name] as string)?.trim() || "",
  })).filter((link) => !!link.url);

/**
 * How much of the branding is filled in — logo, caption and at least one
 * social link each count as a step.
 */
export const buildBrandingProgress = (values: BrandingFormValues) => {
  const steps = [
    !!values.storeLogo,
    !!values.storeCaption?.trim(),
    buildPreviewLinks(values).length > 0,
  ];
  const done = steps.filter(Boolean).length;
  return {
    done,
    total: steps.length,
    percent: Math.round((done / steps.length) * 100),
    label: `${done}/${steps.length} complete`,
  };
};
