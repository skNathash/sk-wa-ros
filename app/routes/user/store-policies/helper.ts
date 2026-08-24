export type PolicyRow = {
  key: string;
  value: string;
};

export type PolicyFormValues = {
  ownPolicy: PolicyRow[];
};

// Shown as ghost text so the retailer knows the kind of policy expected.
export const POLICY_PLACEHOLDERS: PolicyRow[] = [
  {
    key: "Return Policy",
    value: "Returns accepted within 7 days with original bill.",
  },
  {
    key: "Delivery Policy",
    value: "Free delivery above Rs.500 within 5 km.",
  },
  {
    key: "Warranty",
    value: "Manufacturer warranty only. No store warranty.",
  },
];

export const EMPTY_POLICY_ROW: PolicyRow = { key: "", value: "" };

export const MAX_POLICY_KEY_LENGTH = 60;

export const MAX_POLICY_VALUE_LENGTH = 500;

/**
 * The profile API returns `ownPolicy` as a key/value array, but older records
 * may carry nulls or a plain object, so normalise before feeding the form.
 */
export const formatPolicies = (ownPolicy: any): PolicyRow[] => {
  if (Array.isArray(ownPolicy)) {
    return ownPolicy
      .filter((p) => p && (p.key || p.value))
      .map((p) => ({
        key: String(p.key || ""),
        value: String(p.value || ""),
      }));
  }

  if (ownPolicy && typeof ownPolicy === "object") {
    return Object.keys(ownPolicy).map((key) => ({
      key,
      value: String(ownPolicy[key] ?? ""),
    }));
  }

  return [];
};

// Drop rows the user left completely blank so we never persist empty entries.
export const cleanPolicies = (rows: PolicyRow[]): PolicyRow[] =>
  (rows || [])
    .map((r) => ({ key: (r.key || "").trim(), value: (r.value || "").trim() }))
    .filter((r) => r.key || r.value);

export const getPlaceholder = (index: number, field: keyof PolicyRow) =>
  POLICY_PLACEHOLDERS[index % POLICY_PLACEHOLDERS.length][field];
