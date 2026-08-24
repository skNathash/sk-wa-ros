// Deterministic avatar tint so the same customer always keeps the same colour.
const AVATAR_COLORS = [
  "tw:bg-blue-500",
  "tw:bg-cyan-500",
  "tw:bg-teal-600",
  "tw:bg-purple-500",
  "tw:bg-indigo-500",
  "tw:bg-pink-500",
  "tw:bg-emerald-600",
];

export const getAvatarColor = (name?: string) => {
  const key = (name || "").trim();
  if (!key) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash + key.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash];
};
